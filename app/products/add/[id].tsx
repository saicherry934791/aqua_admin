import { apiService } from "@/lib/api/api"
import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, StyleSheet, Text } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"

const ProductFormScreen = () => {

    const { id } = useLocalSearchParams()

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
            const response = await apiService.get(`/products/${id}`)
            const data = response.data.product;

            console.log('data is ',data)

            setInitialValues({
                product_info: {
                    name: data.name,
                    description: data.description,
                    images: data.images.map((image:string)=>{return {
                        isNew:false,
                        uri:image
                    }}),
                    rentPrice: data.rentPrice?.toString(),
                    buyPrice: data.buyPrice?.toString(),
                    deposit: data.deposit?.toString(),
                    isRentable: data.isRentable ? 'true':'false',
                    isPurchasable: data.isPurchasable ?'true':'false',
                    isActive: data.isActive?'true':'false',
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

            let existingImages=[]

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
                }else{
                    existingImages.push(image.uri)
                }
            }

            console.log('formData ',formData)
            console.log('id ',id)

            const endpoint = isNew
                ? "/products"
                : `/products/${id}`

            let response ;

            if(isNew){
                response = await apiService.post(endpoint, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    }
                }
                )

            }else{
                formData.append("existingImages",JSON.stringify(existingImages))
                response = await apiService.put(endpoint,formData,{
                    headers: {
                        "Content-Type": "multipart/form-data",
                    }
                })
            }

            if (!response.success) throw new Error("Upload failed")

            // Create the new/updated product data to pass back
            const newProductData = {
                id: response.data?.id || id || Date.now().toString(),
                name: values.product_info.name,
                description: values.product_info.description,
                price: `₹${values.product_info.buyPrice ?? 0}`,
                rentPrice: `₹${values.product_info.rentPrice ?? 0}`,
                deposit: `₹${values.product_info.deposit ?? 0}`,
                isActive: values.product_info.isActive === 'true',
                isRentable: values.product_info.isRentable === 'true',
                isPurchasable: values.product_info.isPurchasable === 'true',
            };

            Alert.alert("Success", `Product ${isNew ? "created" : "updated"} successfully`)
            
            // Use setTimeout to ensure navigation happens after state updates
            setTimeout(async () => {
                try {
                    await router.push({
                        pathname: '/(tabs)/manage',
                        params: { 
                            tab: 'Products',
                            refreshData: JSON.stringify({
                                type: isNew ? 'add' : 'update',
                                data: newProductData
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

const styles= StyleSheet.create({
    container :{
        flex:1
    }
})