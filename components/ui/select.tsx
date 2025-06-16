"use client"

import { ChevronDown } from "lucide-react-native"
import type React from "react"
import { useEffect, useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SheetManager } from "react-native-actions-sheet"

interface SelectOption {
    label: string
    value: string
}

interface SelectProps {
    label?: string
    placeholder?: string
    options: SelectOption[]
    value?: string | string[]
    onValueChange: (value: string | string[]) => void
    error?: string
    multiple?: boolean
    searchable?: boolean
}

export const Select: React.FC<SelectProps> = ({
    label,
    placeholder = "Select an option",
    options,
    value,
    onValueChange,
    error,
    multiple = false,
    searchable = false,
}) => {
    const [selectedValues, setSelectedValues] = useState<string[]>(() => {
        if (multiple) {
            if (Array.isArray(value)) return value;
            return value ? String(value).split(",").filter(Boolean) : [];
        }
        return [];
    });

    useEffect(() => {
        if (multiple) {
            if (Array.isArray(value)) {
                setSelectedValues(value);
            } else {
                setSelectedValues(value ? String(value).split(",").filter(Boolean) : []);
            }
        }
    }, [value, multiple]);

    const handlePress = () => {
        console.log("Opening sheet with options:", options);
        console.log("Current selectedValues:", selectedValues);
        
        SheetManager.show('select-sheet', {
            payload: {
                options,
                onSelect: (selectedValue: string | string[]) => {
                    console.log("Selected value:", selectedValue);
                    if (multiple) {
                        if (Array.isArray(selectedValue)) {
                            setSelectedValues(selectedValue);
                            onValueChange(selectedValue);
                        } else {
                            // Handle single value selection in multiple mode
                            const newValues = selectedValues.includes(selectedValue)
                                ? selectedValues.filter((v) => v !== selectedValue)
                                : [...selectedValues, selectedValue];
                            setSelectedValues(newValues);
                            onValueChange(newValues);
                        }
                    } else {
                        onValueChange(selectedValue as string);
                    }
                },
                multiple,
                selectedValues: multiple ? selectedValues : (value ? [value as string] : []),
                placeholder,
                searchable,
                label,
            },
        });
    };

    const getDisplayValue = () => {
        if (multiple) {
            if (selectedValues.length === 0) return placeholder;
            if (selectedValues.length === 1) {
                return options.find((opt) => opt.value === selectedValues[0])?.label || selectedValues[0];
            }
            return `${selectedValues.length} items selected`;
        }
        const selectedOption = options.find((opt) => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    const hasValue = multiple ? selectedValues.length > 0 : !!value;

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity 
                style={[
                    styles.select, 
                    error && styles.error,
                    hasValue && styles.hasValue
                ]} 
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.text, 
                    !hasValue && styles.placeholder
                ]}>
                    {getDisplayValue()}
                </Text>
                <ChevronDown size={20} color="#71717a" />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {/* Show selected items for multiple selection */}
            {multiple && selectedValues.length > 0 && (
                <View style={styles.selectedItemsContainer}>
                    {selectedValues.slice(0, 3).map((val, index) => {
                        const option = options.find((opt) => opt.value === val);
                        return (
                            <View key={val} style={styles.selectedItem}>
                                <Text style={styles.selectedItemText}>
                                    {option?.label || val}
                                </Text>
                            </View>
                        );
                    })}
                    {selectedValues.length > 3 && (
                        <View style={styles.selectedItem}>
                            <Text style={styles.selectedItemText}>
                                +{selectedValues.length - 3} more
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    select: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 48,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    hasValue: {
        backgroundColor: "#ffffff",
        borderColor: "#0891b2",
    },
    error: {
        borderColor: "#ef4444",
        backgroundColor: "#fef2f2",
    },
    text: {
        fontSize: 16,
        color: "#1e293b",
        flex: 1,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    placeholder: {
        color: "#64748b",
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: 6,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    selectedItemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 6,
    },
    selectedItem: {
        backgroundColor: '#e0f7fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#0891b2',
    },
    selectedItemText: {
        fontSize: 12,
        color: '#0891b2',
        fontWeight: '500',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
});