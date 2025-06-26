import { apiService } from "@/lib/api/api"
import { useNavigation, useRoute } from "@react-navigation/native"
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, Text } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"

const ProductFormScreen = () => {
    const route = useRoute()
    const navigation = useNavigation()
    const { id } = route.params || {}

    const isNew = id === "new"
    const [initialValues, setInitialValues] = useState({})
    const [loading, setLoading] = useState(!isNew)

    useEffect(() => {
        if (!isNew) {
            fetchProductData()
        }
    }, [id])

    const fetchProductData = async () => {
        try {
            const response = await fetch(`https://api.example.com/products/${id}`)
            const data = await response.json()

            setInitialValues({
                product_info: {
                    name: data.name,
                    description: data.description,
                    images: data.images, // assumed array
                    rentPrice: data.rentPrice?.toString(),
                    buyPrice: data.buyPrice?.toString(),
                    deposit: data.deposit?.toString(),
                    isRentable: data.isRentable,
                    isPurchasable: data.isPurchasable,
                    isActive: data.isActive,
                },
            })
        } catch (error) {
            Alert.alert("Error", "Failed to load product data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData()

            formData.append("name", values.product_info.name)
            formData.append("description", values.product_info.description)
            formData.append("rentPrice", values.product_info.rentPrice)
            formData.append("buyPrice", values.product_info.buyPrice)
            formData.append("deposit", values.product_info.deposit)
            formData.append("isRentable", values.product_info.isRentable)
            formData.append("isPurchasable", values.product_info.isPurchasable)
            formData.append("isActive", values.product_info.isActive)
            for (const image of values.product_info.images) {
                if (image.isNew && image.uri) {
                    const file = {
                        uri: image.uri,
                        name: `image-${Date.now()}.jpg`, // or extract from uri
                        type: "image/jpeg", // or determine dynamically
                    };
                    formData.append("images", file);
                }
            }


            console.log('formData ',formData)

            const endpoint = isNew
                ? "/products"
                : `/${id}`

            const response = await apiService.post(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
            )
            if (!response.success) throw new Error("Upload failed")

            Alert.alert("Success", `Product ${isNew ? "created" : "updated"} successfully`)
            // navigation.goBack()

        } catch (error) {
            console.error("Submit Error:", error)
            Alert.alert("Error", "Failed to submit the form")
        }
    }


    const formSections: FormSection[] = [
        {
            id: "product_info",
            title: "Product Details",
            fields: [
                {
                    id: "name",
                    type: "text",
                    label: "Product Name",
                    placeholder: "Enter product name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                    },
                },
                {
                    id: "description",
                    type: "textarea",
                    label: "Description",
                    placeholder: "Describe your product",
                    required: true,
                    props: {
                        rows: 4,
                    },
                    validation: {
                        min: 10,
                        max: 1000,
                    },
                },
                {
                    id: "images",
                    type: "image",
                    label: "Product Images",
                    props: {
                        multiple: true,
                    },
                    required: true,
                    validation: {
                        min: 1,
                        max: 4

                    },
                },
                {
                    id: "rentPrice",
                    type: "text",
                    label: "Rent Price ($)",
                    placeholder: "Enter rent price",
                    required: true,
                    validation: {
                        pattern: /^\d+$/,
                        custom: (value: string) => {
                            const val = parseInt(value)
                            if (isNaN(val) || val <= 0) return "Enter a valid rent price"
                            return null
                        },
                    },
                },
                {
                    id: "buyPrice",
                    type: "text",
                    label: "Buy Price ($)",
                    placeholder: "Enter buy price",
                    required: true,
                    validation: {
                        pattern: /^\d+$/,
                        custom: (value: string) => {
                            const val = parseInt(value)
                            if (isNaN(val) || val <= 0) return "Enter a valid buy price"
                            return null
                        },
                    },
                },
                {
                    id: "deposit",
                    type: "text",
                    label: "Deposit ($)",
                    placeholder: "Enter security deposit",
                    required: true,
                    validation: {
                        pattern: /^\d+$/,
                        custom: (value: string) => {
                            const val = parseInt(value)
                            if (isNaN(val) || val < 0) return "Deposit must be 0 or greater"
                            return null
                        },
                    },
                },
                {
                    id: "isRentable",
                    type: "select",
                    label: "Is Rentable?",
                    required: true,
                    options: [
                        { label: "Yes", value: 'true' },
                        { label: "No", value: 'false' },
                    ],
                },
                {
                    id: "isPurchasable",
                    type: "select",
                    label: "Is Purchasable?",
                    required: true,
                    options: [
                        { label: "Yes", value: 'true' },
                        { label: "No", value: 'false' },
                    ],
                },
                {
                    id: "isActive",
                    type: "select",
                    label: "Is Active?",
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
                    <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>
                </SafeAreaView>
            </SafeAreaProvider>
        )
    }

    return (

        <DynamicForm
            sections={formSections}
            onSubmit={handleSubmit}
            submitButtonText={isNew ? "Create Product" : "Update Product"}
            initialValues={initialValues}
        />

    )
}



export default ProductFormScreen
