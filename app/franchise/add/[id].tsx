// screens/FranchiseFormScreen.tsx
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, StyleSheet, Text, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { useRoute, useNavigation } from "@react-navigation/native"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"
import PolygonSelector from "../../../lib/components/ui/polygon-selector"
import { apiService } from "@/lib/api/api"

const FranchiseFormScreen = () => {
    const route = useRoute()
    const navigation = useNavigation()
    const { id } = route.params || {}

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
            const response = await fetch(`https://api.example.com/franchises/${id}`)
            const data = await response.json()

            setInitialValues({
                franchise_info: {
                    franchise_name: data.name,
                    city_name: data.city,
                    phone_number: data.phoneNumber,
                    franchise_polygon: data.polygon
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
            console.log('values ',values)
            const payload = {
                name: values.franchise_info.franchise_name,
                city: values.franchise_info.city_name,
                phoneNumber: values.franchise_info.phone_number,
                geoPolygon: values.franchise_info.franchise_polygon.coordinates,

            }

            console.log('franchise payload ', payload)

            if (isNew) {
                const result = await apiService.post('/franchises', payload);
                console.log('result is in franchise creation  ', result)
            } else {
                await fetch(`https://api.example.com/franchises/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            }

            Alert.alert("Success", `Franchise ${isNew ? "created" : "updated"} successfully`)
            navigation.goBack()
        } catch (error) {
            Alert.alert("Error", "Failed to submit the form")
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
