import { apiService } from "@/lib/api/api"
import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, Text } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"

interface Franchise {
    id: string
    name: string
}

const AgentFormScreen = () => {

    const { id } = useLocalSearchParams();

    const isNew = id === "new"
    const [initialValues, setInitialValues] = useState({})
    const [loading, setLoading] = useState(true)
    const [franchises, setFranchises] = useState<Franchise[]>([])

    useEffect(() => {
        fetchFranchises()
        if (!isNew) {
            fetchAgentData()
        } else {
            setLoading(false)
        }
    }, [id])

    const fetchFranchises = async () => {
        try {
            const response = await apiService.get("/franchises")
            if (response.success && response.data) {
                setFranchises(response.data)
            }
        } catch (error) {
            console.log("Failed to fetch franchises:", error)
            Alert.alert("Error", "Failed to load franchise data")
        }
    }

    const fetchAgentData = async () => {
        try {
            const response = await apiService.get(`/agents?id=${id}`)

            if (response.success && response.data) {
                const data = response.data[0]
                console.log('response in getting agent ',data)
                setInitialValues({
                    agent_info: {
                        agentName: data.name || "",
                        phoneNumber: data.number || "",
                        email: data.email || "",
                        address: data.address || "",
                        alternativePhone: data.alternativePhone || "",
                        franchiseAreaId: data.franchiseId?.toString() || "",
                    },
                })
            }
        } catch (error) {
            console.log("Failed to fetch agent data:", error)
            Alert.alert("Error", "Failed to load agent data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            console.log('clicked ')
            const payload = {
                name: values.agent_info.agentName,
                number: values.agent_info.phoneNumber,
                email: values.agent_info.email || null,
                address: values.agent_info.address || null,
                alternativeNumber: values.agent_info.alternativePhone || null,
                franchiseId: values.agent_info.franchiseAreaId || null,
            }

            const endpoint = isNew ? "/agents" : `/agents/${id}`
            const method = isNew ? "post" : "patch"

            console.log('came here ')
            const response = await apiService[method](endpoint, payload)
            
            console.log('here completed ')
            if (!response.success) {
                throw new Error(response.message || "Failed to save agent")
            }

            // Create the new/updated agent data to pass back
            const franchiseName = franchises.find(f => f.id.toString() === payload.franchiseId)?.name || 'Global Agent';
            const newAgentData = {
                id: response.data?.id || id || Date.now().toString(),
                name: payload.name,
                email: payload.email,
                phone: payload.number,
                isActive: true,
                franchise: franchiseName,
                franchiseId: payload.franchiseId,
                createdAt: new Date().toISOString(),
                joinDate: new Date(),
                serviceRequestsCount: 0,
                ordersCount: 0
            };

            Alert.alert("Success", `Agent ${isNew ? "created" : "updated"} successfully`)
            
            // Use setTimeout to ensure navigation happens after state updates
            setTimeout(async () => {
                try {
                    await router.push({
                        pathname: '/(tabs)/manage',
                        params: { 
                            tab: 'Agents',
                            refreshData: JSON.stringify({
                                type: isNew ? 'add' : 'update',
                                data: newAgentData
                            })
                        }
                    });
                } catch (navError) {
                    console.log('Navigation error:', navError);
                    // Fallback navigation
                    router.replace('/(tabs)/manage');
                }
            }, 300);

        } catch (error) {
            console.log("Submit Error:", error)
            Alert.alert("Error", "Failed to submit the form")
        }
    }

    const franchiseOptions = franchises.map(franchise => ({
        label: franchise.name,
        value: franchise.id.toString()
    }))

    const formSections: FormSection[] = [
        {
            id: "agent_info",
            title: "Agent Details",
            fields: [
                {
                    id: "agentName",
                    type: "text",
                    label: "Agent Name",
                    placeholder: "Enter agent name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                    },
                },
                {
                    id: "phoneNumber",
                    type: "text",
                    label: "Phone Number",
                    placeholder: "Enter phone number",
                    required: true,
                    validation: {
                        pattern: /^[0-9+\-\s()]+$/,
                        custom: (value: string) => {
                            const cleanedValue = value.replace(/[^\d]/g, "")
                            if (cleanedValue.length < 10) {
                                return "Phone number must be at least 10 digits"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "email",
                    type: "text",
                    label: "Email (Optional)",
                    placeholder: "Enter email address",
                    required: false,
                    validation: {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        custom: (value: string) => {
                            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                return "Please enter a valid email address"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "address",
                    type: "textarea",
                    label: "Address (Optional)",
                    placeholder: "Enter agent address",
                    required: false,
                    props: {
                        rows: 3,
                    },
                    validation: {
                        max: 500,
                    },
                },
                {
                    id: "alternativePhone",
                    type: "text",
                    label: "Alternative Phone (Optional)",
                    placeholder: "Enter alternative phone number",
                    required: false,
                    validation: {
                        pattern: /^[0-9+\-\s()]*$/,
                        custom: (value: string) => {
                            if (value) {
                                const cleanedValue = value.replace(/[^\d]/g, "")
                                if (cleanedValue.length > 0 && cleanedValue.length < 10) {
                                    return "Alternative phone must be at least 10 digits"
                                }
                            }
                            return null
                        },
                    },
                },
                {
                    id: "franchiseAreaId",
                    type: "select",
                    label: "Franchise Area (Optional)",
                    placeholder: "Select franchise area or leave empty for global agent",
                    required: false,
                    options: [
                        { label: "Global Agent (No specific area)", value: "" },
                        ...franchiseOptions
                    ],
                },
            ],
        },
    ]

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <Text style={{ textAlign: "center", fontSize: 16 }}>Loading...</Text>
                </SafeAreaView>
            </SafeAreaProvider>
        )
    }

    return (
        <DynamicForm
            sections={formSections}
            onSubmit={handleSubmit}
            submitButtonText={isNew ? "Create Agent" : "Update Agent"}
            initialValues={initialValues}
        />
    )
}

export default AgentFormScreen