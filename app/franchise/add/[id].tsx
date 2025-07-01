// screens/FranchiseFormScreen.tsx
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, StyleSheet, Text, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"
import PolygonSelector from "../../../lib/components/ui/polygon-selector"
import { apiService } from "@/lib/api/api"
import { router, useLocalSearchParams } from "expo-router"

const FranchiseFormScreen = () => {
    const { id } = useLocalSearchParams();

    const isNew = id === "new"

    const [initialValues, setInitialValues] = useState({})
    const [loading, setLoading] = useState(!isNew)

    useEffect(() => {
        if (!isNew) {
            // Fetch data from backend for edit
            fetchFranchiseData()
        }
    }, [id])

    const fetchFranchiseData = async () => {
        try {
            // Simulated API call
            const response = await apiService.get(`franchises/${id}`)
            console.log('response  in franchisedata', response.data.franchiseArea)

            setInitialValues({
                franchise_info: {
                    franchise_name: response.data.franchiseArea.name,
                    city_name: response.data.franchiseArea.city,
                    phone_number: response.data.franchiseArea.phoneNumber,
                    franchise_polygon: response.data.franchiseArea.geoPolygon
                }
            })
        } catch (error) {
            Alert.alert("Error", "Failed to load franchise data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            const payload = {
                name: values.franchise_info.franchise_name,
                city: values.franchise_info.city_name,
                phoneNumber: values.franchise_info.phone_number,
                geoPolygon: values.franchise_info.franchise_polygon.coordinates,
            }

            let result;
            let newFranchiseData;

            if (isNew) {
                result = await apiService.post('/franchises', payload);
                if (!result.success) {
                    throw new Error('Unable to add Franchise')
                }
                // Create the new franchise data to pass back
                newFranchiseData = {
                    id: result.data.id || Date.now().toString(),
                    name: payload.name,
                    location: payload.city,
                    owner: 'Owned By Company',
                    revenue: '₹0',
                    year: new Date().getFullYear(),
                    outlets: 0,
                    employees: 0,
                    status: 'Active',
                    geoPolygon: payload.geoPolygon,
                    isCompanyManaged: true,
                };
            } else {
                result = await apiService.patch(`/franchises/${id}`, payload)
                if (!result.success) {
                    throw new Error('Unable to Update Franchise')
                }
                // Create the updated franchise data to pass back
                newFranchiseData = {
                    id: id,
                    name: payload.name,
                    location: payload.city,
                    owner: 'Owned By Company',
                    revenue: '₹0',
                    year: new Date().getFullYear(),
                    outlets: 0,
                    employees: 0,
                    status: 'Active',
                    geoPolygon: payload.geoPolygon,
                    isCompanyManaged: true,
                };
            }

            Alert.alert("Success", `Franchise ${isNew ? "created" : "updated"} successfully`)
            
            // Navigate back with the new/updated data
            if (router.canGoBack()) {
                router.back();
                // Use a timeout to ensure navigation completes before sending data
                setTimeout(() => {
                    // This will trigger a refresh in the list screen
                    router.setParams({ 
                        refreshData: JSON.stringify({
                            type: isNew ? 'add' : 'update',
                            data: newFranchiseData
                        })
                    });
                }, 100);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit the form")
        }
    }

    const formSections: FormSection[] = [
        {
            id: "franchise_info",
            title: "Franchise Details",
            fields: [
                {
                    id: "franchise_name",
                    type: "text",
                    label: "Franchise Name",
                    placeholder: "Enter franchise name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                    },
                },
                {
                    id: "city_name",
                    type: "text",
                    label: "City Name",
                    placeholder: "Enter city name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                    },
                },
                {
                    id: "phone_number",
                    type: "text",
                    label: "Phone Number (optional)",
                    placeholder: "Enter phone number if not managed by company",
                    required: false,
                    validation: {
                        pattern: /^[6-9]\d{9}$/,
                        custom: (value: string) => {
                            if (value && value.length !== 10) {
                                return "Phone number must be 10 digits"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "franchise_polygon",
                    type: "custom",
                    label: "Service Area (Polygon)",
                    placeholder: "Select franchise area on map",
                    customComponent: PolygonSelector,
                    required: true,
                    validation: {
                        custom: (value: any) => {
                            if (value && (!value.coordinates || value.coordinates.length < 3)) {
                                return "Franchise area must have at least 3 coordinates"
                            }
                            return null
                        },
                    },
                },
            ],
        },
    ]

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>
                </SafeAreaView>
            </SafeAreaProvider>
        )
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <DynamicForm
                    sections={formSections}
                    onSubmit={handleSubmit}
                    submitButtonText={isNew ? "Create Franchise" : "Update Franchise"}
                    initialValues={initialValues}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
})

export default FranchiseFormScreen;