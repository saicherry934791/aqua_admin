import { apiService } from "@/lib/api/api"
import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, StyleSheet, Text } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"

const CategoryFormScreen = () => {
    const { id } = useLocalSearchParams()
    const isNew = id === "new"
    const [initialValues, setInitialValues] = useState({})
    const [loading, setLoading] = useState(!isNew)

    useEffect(() => {
        if (!isNew) {
            fetchCategoryData()
        }
    }, [id])

    const fetchCategoryData = async () => {
        try {
            const response = await apiService.get(`/categories/${id}`)
            const data = response.data.category;

            console.log('Category data:', data)

            setInitialValues({
                category_info: {
                    name: data.name,
                    isActive: data.isActive ? 'true' : 'false',
                },
            })
        } catch (error) {
            console.log('Error fetching category:', error)
            Alert.alert("Error", "Failed to load category data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            const payload = {
                name: values.category_info.name,
                isActive: values.category_info.isActive === 'true'
            }

            console.log('Submitting payload:', payload)

            const endpoint = isNew ? "/categories" : `/categories/${id}`
            
            let response;
            if (isNew) {
                response = await apiService.post(endpoint, payload)
            } else {
                response = await apiService.put(endpoint, payload)
            }

            if (!response.success) {
                throw new Error(response.message || "Failed to save category")
            }

            // Create the new/updated category data to pass back
            const categoryData = {
                id: response.data?.category?.id || id || Date.now().toString(),
                name: values.category_info.name,
                isActive: values.category_info.isActive === 'true',
                createdAt: response.data?.category?.createdAt || new Date().toISOString(),
                updatedAt: response.data?.category?.updatedAt || new Date().toISOString(),
            };

            Alert.alert("Success", `Category ${isNew ? "created" : "updated"} successfully`)
            
            // Use setTimeout to ensure navigation happens after state updates
            setTimeout(async () => {
                try {
                    await router.push({
                        pathname: '/(tabs)/manage',
                        params: { 
                            tab: 'Categories',
                            refreshData: JSON.stringify({
                                type: isNew ? 'add' : 'update',
                                data: categoryData
                            })
                        }
                    });
                } catch (navError) {
                    console.log('Navigation error:', navError);
                    // Fallback navigation
                    router.replace('/(tabs)/manage');
                }
            }, 300);

        } catch (error: any) {
            console.log("Submit Error:", error)
            
            // Handle specific error cases
            let errorMessage = "Failed to submit the form"
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.message) {
                errorMessage = error.message
            }
            
            // Handle duplicate name error
            if (errorMessage.toLowerCase().includes('already exists') || 
                errorMessage.toLowerCase().includes('duplicate')) {
                errorMessage = "A category with this name already exists"
            }
            
            Alert.alert("Error", errorMessage)
        }
    }

    const formSections: FormSection[] = [
        {
            id: "category_info",
            title: "Category Details",
            fields: [
                {
                    id: "name",
                    type: "text",
                    label: "Category Name",
                    placeholder: "Enter category name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                        custom: (value: string) => {
                            const trimmed = value.trim()
                            if (trimmed.length < 2) {
                                return "Category name must be at least 2 characters"
                            }
                            if (trimmed.length > 100) {
                                return "Category name must be less than 100 characters"
                            }
                            // Check for special characters (optional)
                            if (!/^[a-zA-Z0-9\s\-_&]+$/.test(trimmed)) {
                                return "Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "isActive",
                    type: "select",
                    label: "Status",
                    required: true,
                    options: [
                        { label: "Active", value: 'true' },
                        { label: "Inactive", value: 'false' },
                    ],
                },
            ],
        },
    ]

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <Text style={styles.loadingText}>Loading category data...</Text>
                </SafeAreaView>
            </SafeAreaProvider>
        )
    }

    return (
        <DynamicForm
            sections={formSections}
            onSubmit={handleSubmit}
            submitButtonText={isNew ? "Create Category" : "Update Category"}
            initialValues={initialValues}
        />
    )
}

export default CategoryFormScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    }
})