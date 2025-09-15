// screens/FranchiseFormScreen.tsx
import { apiService } from "@/lib/api/api"
import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../../lib/components/dynamic-form/dynamic-form"
import { FilePicker } from "../../../lib/components/ui/file-picker"

const FranchiseFormScreen = () => {
    const { id } = useLocalSearchParams();

    const isNew = id === "new"

    const [initialValues, setInitialValues] = useState({})
    const [loading, setLoading] = useState(!isNew)
    const [isInfoExpanded, setIsInfoExpanded] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            console.log('response  in franchisedata', response.data)

            setInitialValues({
                franchise_info: {
                    franchise_name: response.data.franchiseArea.name || "",
                    fullname: response.data.franchiseArea.fullname || response.data.franchiseArea.ownerName || "",
                    cityname: response.data.franchiseArea.city || "",
                    phonenumebr: response.data.franchiseArea.phonenumber || response.data.franchiseArea.phoneNumber || "",
                    franchise_type: response.data.franchiseArea.franchiseType || "BOUGHT",
                    gst_number: response.data.franchiseArea.gst_number || "",
                    gst_document: response.data.franchiseArea.gst_document
                        ? [{ uri: response.data.franchiseArea.gst_document, isNew: false }]
                        : [],
                    identity_proof: Array.isArray(response.data.franchiseArea.identity_proof)
                        ? response.data.franchiseArea.identity_proof.map((u: string) => ({ uri: u, isNew: false }))
                        : (response.data.franchiseArea.identity_proof
                            ? [{ uri: response.data.franchiseArea.identity_proof, isNew: false }]
                            : []),
                }
            })
        } catch (error) {
            Alert.alert("Error", "Failed to load franchise data")
        } finally {
            setLoading(false)
        }
    }

    const validateFormData = (values: any): string[] => {
        const errors: string[] = [];
        const info = values.franchise_info;

        // Basic required field validation
        if (!info.franchise_name?.trim()) {
            errors.push("Franchise Name is required");
        }
        if (!info.fullname?.trim()) {
            errors.push("Full Name is required");
        }
        if (!info.cityname?.trim()) {
            errors.push("City Name is required");
        }
        if (!info.franchise_type) {
            errors.push("Franchise Type is required");
        }

        // Franchise type specific validation
        switch (info.franchise_type) {
            case 'BOUGHT':
                if (!info.gst_number?.trim()) {
                    errors.push("GST Number is required for BOUGHT franchises");
                } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(info.gst_number)) {
                    errors.push("Please enter a valid GST Number format");
                }

                if (!info.gst_document || info.gst_document.length === 0) {
                    errors.push("GST Document is required for BOUGHT franchises");
                } else {
                    const hasValidGstDoc = info.gst_document.some((doc: any) => doc.uri);
                    if (!hasValidGstDoc) {
                        errors.push("Please upload a valid GST Document");
                    }
                }

                if (!info.identity_proof || info.identity_proof.length === 0) {
                    errors.push("Identity Proof is required for BOUGHT franchises");
                } else {
                    const hasValidIdProof = info.identity_proof.some((doc: any) => doc.uri);
                    if (!hasValidIdProof) {
                        errors.push("Please upload at least one Identity Proof document");
                    }
                }
                break;

            case 'MANAGED':
                if (!info.identity_proof || info.identity_proof.length === 0) {
                    errors.push("Identity Proof is required for MANAGED franchises");
                } else {
                    const hasValidIdProof = info.identity_proof.some((doc: any) => doc.uri);
                    if (!hasValidIdProof) {
                        errors.push("Please upload at least one Identity Proof document");
                    }
                }
                break;

            case 'COMPANY_MANAGED':
                // No additional validation needed
                break;

            default:
                errors.push("Please select a valid franchise type");
        }

        // Phone number validation
        if (info.franchise_type === 'BOUGHT') {
            // Phone number is required for BOUGHT franchises
            if (!info.phonenumebr?.trim()) {
                errors.push("Phone Number is required for BOUGHT franchises");
            } else if (info.phonenumebr.length !== 10) {
                errors.push("Phone number must be exactly 10 digits");
            } else if (!/^[6-9]/.test(info.phonenumebr)) {
                errors.push("Phone number must start with 6, 7, 8, or 9");
            }
        } else if (info.phonenumebr) {
            // For other franchise types, validate if provided
            if (info.phonenumebr.length !== 10) {
                errors.push("Phone number must be exactly 10 digits");
            } else if (!/^[6-9]/.test(info.phonenumebr)) {
                errors.push("Phone number must start with 6, 7, 8, or 9");
            }
        }

        return errors;
    };

    const handleSubmit = async (values: any) => {
        try {
            // Prevent multiple submissions
            if (isSubmitting) return;

            setIsSubmitting(true);
            console.log('Form values received:', JSON.stringify(values, null, 2))
            console.log('Franchise info:', JSON.stringify(values.franchise_info, null, 2))

            // Validate form data before proceeding
            const validationErrors = validateFormData(values);
            console.log('Validation completed. Errors found:', validationErrors.length);
            if (validationErrors.length > 0) {
                console.log('Validation errors found:', validationErrors);
                throw new Error(`Please fix the following errors:\n\n${validationErrors.join('\n')}`);
            }
            console.log('Validation passed successfully');

            // Additional validation check for BOUGHT franchises
            if (values.franchise_info.franchise_type === 'BOUGHT') {
                console.log('BOUGHT franchise detected - checking phone number...');
                console.log('Phone number value:', values.franchise_info.phonenumebr);
                console.log('Phone number trimmed:', values.franchise_info.phonenumebr?.trim());
                console.log('Phone number length:', values.franchise_info.phonenumebr?.length);

                if (!values.franchise_info.phonenumebr?.trim()) {
                    throw new Error('Phone Number is required for BOUGHT franchises - validation failed');
                }
            }

            const formData: any = new FormData()

            const info = values.franchise_info
            formData.append('name', info.franchise_name)
            formData.append('fullname', info.fullname)
            formData.append('city', info.cityname)

            // Add franchise type
            formData.append('franchiseType', info.franchise_type)

            // Handle different franchise types
            switch (info.franchise_type) {
                case 'BOUGHT':
                    // BOUGHT Franchise - needs everything including phone number
                    if (!info.phonenumebr?.trim()) {
                        throw new Error('Phone Number is required for BOUGHT franchises')
                    }
                    if (!info.gst_number) {
                        throw new Error('GST Number is required for BOUGHT franchises')
                    }
                    if (!info.gst_document || info.gst_document.length === 0) {
                        throw new Error('GST Document is required for BOUGHT franchises')
                    }
                    if (!info.identity_proof || info.identity_proof.length === 0) {
                        throw new Error('Identity Proof is required for BOUGHT franchises')
                    }

                    // Add phone number for BOUGHT franchises - try both field names
                    formData.append('phoneNumber', info.phonenumebr)
                    formData.append('phonenumber', info.phonenumebr) // Also try lowercase version
                    formData.append('gst_number', info.gst_number)

                    // Debug: Log what's being sent for BOUGHT franchises
                    console.log('BOUGHT franchise - Phone number being sent:', info.phonenumebr);
                    console.log('BOUGHT franchise - FormData phoneNumber field:', formData.get('phoneNumber'));
                    console.log('BOUGHT franchise - FormData phonenumber field:', formData.get('phonenumber'));
                    break

                case 'MANAGED':
                    // MANAGED Franchise - needs identity proof but no GST
                    if (!info.identity_proof || info.identity_proof.length === 0) {
                        throw new Error('Identity Proof is required for MANAGED franchises')
                    }
                    // Add phone number if provided (optional for MANAGED)
                    if (info.phonenumebr?.trim()) {
                        formData.append('phoneNumber', '+91' + info.phonenumebr)
                        formData.append('phonenumber', '+91' + info.phonenumebr) // Also try lowercase version
                    }
                    break

                case 'COMPANY_MANAGED':
                    // COMPANY_MANAGED Franchise - only basic info needed
                    // Add phone number if provided (optional for COMPANY_MANAGED)
                    if (info.phonenumebr?.trim()) {
                        formData.append('phoneNumber', '+91' + info.phonenumebr)
                        formData.append('phonenumber', '+91' + info.phonenumebr) // Also try lowercase version
                    }
                    break

                default:
                    throw new Error('Please select a valid franchise type')
            }

            // Handle GST documents (only for BOUGHT franchises)
            let existingGstDoc: string | undefined
            if (info.franchise_type === 'BOUGHT') {
                const gstArr = info.gst_document || []
                if (Array.isArray(gstArr) && gstArr.length > 0) {
                    const gst = gstArr[0]
                    if (gst.isNew && gst.uri) {
                        const file: any = {
                            uri: gst.uri,
                            name: gst.name || `gst-${Date.now()}`,
                            type: gst.mimeType || 'application/octet-stream',
                        }
                        formData.append('gst_document', file)
                    } else if (gst.uri) {
                        existingGstDoc = gst.uri
                    }
                }
            }

            const idArr = info.identity_proof || []
            const existingIdProof: string[] = []
            if (Array.isArray(idArr) && idArr.length > 0) {
                for (const idp of idArr) {
                    if (idp.isNew && idp.uri) {
                        const file: any = {
                            uri: idp.uri,
                            name: idp.name || `id-${Date.now()}`,
                            type: idp.mimeType || 'application/octet-stream',
                        }
                        formData.append('identity_proof', file)
                    } else if (idp.uri) {
                        existingIdProof.push(idp.uri)
                    }
                }
            }

            // Debug: Log the entire FormData being sent
            console.log('=== FORM DATA BEING SENT ===');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            console.log('=== END FORM DATA ===');

            let result
            let newFranchiseData

            if (isNew) {
                result = await apiService.post('/franchises', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (!result.success) throw new Error('Unable to add Franchise')
            } else {
                if (existingGstDoc && info.franchise_type === 'BOUGHT') formData.append('existingGstDocument', existingGstDoc)
                if (existingIdProof.length) formData.append('existingIdentityProof', JSON.stringify(existingIdProof))
                result = await apiService.patch(`/franchises/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (!result.success) throw new Error('Unable to Update Franchise')
            }

            // Only proceed with success logic if we reach here (no errors thrown)
            // Build data for local UI update
            const respId = (result.data as any)?.id || id || Date.now().toString()
            newFranchiseData = {
                id: respId,
                name: info.franchise_name,
                location: info.cityname,
                owner: info.fullname,
                revenue: '₹0',
                year: new Date().getFullYear(),
                outlets: 0,
                employees: 0,
                status: 'Pending',
                franchiseType: info.franchise_type,
            }

            // Show success message only after confirming success
            Alert.alert("Success", `Franchise ${isNew ? "created" : "updated"} successfully`)

            // Use setTimeout to ensure navigation happens after state updates
            setTimeout(async () => {
                try {
                    await router.push({
                        pathname: '/(tabs)/manage',
                        params: {
                            tab: 'Franchises',
                            refreshData: JSON.stringify({ type: isNew ? 'add' : 'update', data: newFranchiseData })
                        }
                    } as any)
                } catch (navError) {
                    console.log('Navigation error:', navError);
                    // Fallback navigation
                    router.replace({ pathname: '/(tabs)/manage' } as any);
                }
            }, 300);
        } catch (error: any) {
            console.log('Form submission error:', error);

            // Handle different types of errors
            let errorMessage = "Failed to submit the form";

            if (error.message) {
                // Use the specific error message from validation or API
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                // Use API error message if available
                errorMessage = error.response.data.message;
            } else if (error.response?.status) {
                // Handle HTTP status errors
                switch (error.response.status) {
                    case 400:
                        errorMessage = "Invalid data provided. Please check your inputs.";
                        break;
                    case 401:
                        errorMessage = "Unauthorized. Please login again.";
                        break;
                    case 403:
                        errorMessage = "Access denied. You don't have permission to perform this action.";
                        break;
                    case 404:
                        errorMessage = "Resource not found. Please try again.";
                        break;
                    case 409:
                        errorMessage = "Conflict. This franchise may already exist.";
                        break;
                    case 422:
                        errorMessage = "Validation error. Please check your inputs.";
                        break;
                    case 500:
                        errorMessage = "Server error. Please try again later.";
                        break;
                    default:
                        errorMessage = `Request failed with status ${error.response.status}`;
                }
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = "Network error. Please check your internet connection.";
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setIsSubmitting(false);
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
                    id: "fullname",
                    type: "text",
                    label: "Full Name",
                    placeholder: "Enter full name",
                    required: true,
                    validation: {
                        min: 2,
                        max: 100,
                    },
                },
                {
                    id: "cityname",
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
                    id: "phonenumebr",
                    type: "text",
                    label: "Phone Number (Required for BOUGHT franchises)",
                    placeholder: "Enter 10-digit phone number",
                    required: false,
                    validation: {
                        pattern: /^[6-9]\d{9}$/,
                        custom: (value: string) => {
                            if (value && value.length !== 10) {
                                return "Phone number must be 10 digits"
                            }
                            if (value && !/^[6-9]/.test(value)) {
                                return "Phone number must start with 6, 7, 8, or 9"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "franchise_type",
                    type: "select",
                    label: "Franchise Type",
                    placeholder: "Select franchise type",
                    required: true,
                    options: [
                        { label: "BOUGHT - Franchise Owner (Independent)", value: "BOUGHT" },
                        { label: "MANAGED - Franchise Manager (Company Employee)", value: "MANAGED" },
                        { label: "COMPANY_MANAGED - Directly by Company", value: "COMPANY_MANAGED" }
                    ],
                },
                // GST fields - Required only for BOUGHT Franchises
                {
                    id: "gst_number",
                    type: "text",
                    label: "GST Number (Required for BOUGHT franchises)",
                    placeholder: "Enter GST number (e.g., 27AAPFU0939F1Z5)",
                    required: false,
                    validation: {
                        min: 2,
                        max: 30,
                        pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                        custom: (value: string) => {
                            if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
                                return "Please enter a valid GST number format"
                            }
                            return null
                        },
                    },
                },
                {
                    id: "gst_document",
                    type: "custom",
                    label: "GST Document (Required for BOUGHT franchises)",
                    customComponent: FilePicker as any,
                    props: { multiple: false },
                    required: false,
                    validation: {
                        max: 1,
                    },
                },
                // Identity Proof - Required for BOUGHT and MANAGED Franchises
                {
                    id: "identity_proof",
                    type: "custom",
                    label: "Identity Proof Images (Required for BOUGHT & MANAGED franchises)",
                    customComponent: FilePicker as any,
                    props: { multiple: true, accept: 'images' },
                    required: false,
                    validation: { min: 1, max: 4 },
                },
                // {
                //     id: "franchise_polygon",
                //     type: "custom",
                //     label: "Service Area (Polygon)",
                //     placeholder: "Select franchise area on map",
                //     customComponent: PolygonSelector,
                //     required: false,
                //     validation: {
                //         custom: (value: any) => {
                //             let coordinates
                //             if (Array.isArray(value)) {
                //                 coordinates = value
                //             } else if (value && value.coordinates) {
                //                 coordinates = value.coordinates
                //             } else {
                //                 coordinates = []
                //             }
                //             if (coordinates.length > 0 && coordinates.length < 3) {
                //                 return "Franchise area must have at least 3 coordinates"
                //             }
                //             return null
                //         },
                //     },
                // },
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
                <View style={styles.infoNote}>
                    <TouchableOpacity
                        style={styles.infoHeader}
                        onPress={() => setIsInfoExpanded(!isInfoExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.infoNoteTitle}>Franchise Type Requirements</Text>
                        <Text style={styles.expandIcon}>{isInfoExpanded ? '▼' : '▶'}</Text>
                    </TouchableOpacity>

                    {isInfoExpanded && (
                        <View style={styles.infoContent}>
                            <Text style={styles.infoNoteText}>• BOUGHT: Independent franchise owner - requires Phone Number, GST Number, GST Document, and Identity Proof</Text>
                            <Text style={styles.infoNoteText}>• MANAGED: Company employee managing franchise - requires Identity Proof only</Text>
                            <Text style={styles.infoNoteText}>• COMPANY_MANAGED: Directly managed by company - basic information only</Text>
                            <Text style={styles.infoNoteText}>Note: All fields marked with * are required for the selected franchise type</Text>
                        </View>
                    )}
                </View>
                {isSubmitting && (
                    <View style={styles.submittingIndicator}>
                        <Text style={styles.submittingText}>
                            {isNew ? "Creating franchise..." : "Updating franchise..."}
                        </Text>
                    </View>
                )}
                <DynamicForm
                    sections={formSections}
                    onSubmit={handleSubmit}
                    submitButtonText={
                        isSubmitting
                            ? (isNew ? "Creating..." : "Updating...")
                            : (isNew ? "Create Franchise" : "Update Franchise")
                    }
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
    infoNote: {
        backgroundColor: '#f0f8ff',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    infoNoteTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#121516',
        marginBottom: 8,
    },
    infoNoteText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#687b82',
        marginBottom: 4,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
    },
    expandIcon: {
        fontSize: 16,
        color: '#007AFF',
        fontFamily: 'Outfit_600SemiBold',
    },
    infoContent: {
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
        paddingTop: 8,
    },
    submittingIndicator: {
        backgroundColor: '#e8f5e8',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
        alignItems: 'center',
    },
    submittingText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#2E7D32',
    },
})

export default FranchiseFormScreen;