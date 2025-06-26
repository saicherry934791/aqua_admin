import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import ActionSheet, { ScrollView, SheetManager, SheetProps } from "react-native-actions-sheet";

interface SelectSheetProps extends SheetProps {
    options: { label: string; value: string }[];
    onSelect: (value: string | string[]) => void;
    multiple?: boolean;
    selectedValues?: string[];
    placeholder?: string;
    label?: string;
}

function SelectSheet({ sheetId, payload }: SelectSheetProps) {
    const [search, setSearch] = useState("");
    const {
        options = [],
        onSelect,
        multiple = false,
        selectedValues: initialSelectedValues = [],
        placeholder = "Select an option",
        label = ""
    } = (payload || {}) as SelectSheetProps;

    const [internalSelectedValues, setInternalSelectedValues] = useState<string[]>(initialSelectedValues);



    useEffect(() => {
        setInternalSelectedValues(initialSelectedValues);
    }, [initialSelectedValues]);

    // Filter and sort options: selected items first, then alphabetical
    const processedOptions = useMemo(() => {
        const filtered = options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );

        // Sort: selected items first, then unselected alphabetically
        return filtered.sort((a, b) => {
            const aSelected = internalSelectedValues.includes(a.value);
            const bSelected = internalSelectedValues.includes(b.value);

            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return a.label.localeCompare(b.label);
        });
    }, [options, search, internalSelectedValues]);

    const handleSelect = (selectedValue: string) => {
    
        if (multiple) {
            const newValues = internalSelectedValues.includes(selectedValue)
                ? internalSelectedValues.filter((v) => v !== selectedValue)
                : [...internalSelectedValues, selectedValue];
            setInternalSelectedValues(newValues);
            onSelect(newValues);
        } else {
            onSelect(selectedValue);
            SheetManager.hide(sheetId);
        }
    };

    const handleDone = () => {
        SheetManager.hide(sheetId);
    };

    return (
        <ActionSheet
            id={sheetId}
            snapPoints={[60, 85]} // Better snap points
            initialSnapIndex={0}
            gestureEnabled={true}
            onClose={() => setSearch("")}
            closeOnTouchBackdrop={true}
            containerStyle={sheetStyles.actionSheetContainer}
        >
            {/* This View needs proper styling for the layout to work */}
            <View style={sheetStyles.container}>
                {/* Header */}
                <View style={sheetStyles.header}>
            
                    <Text style={sheetStyles.headerTitle}>
                        {label || "Select Options"}
                    </Text>
                </View>

                {/* Search Input */}
                <TextInput
                    style={sheetStyles.searchInput}
                    placeholder="Search options..."
                    value={search}
                    onChangeText={setSearch}
                    autoFocus={false}
                    placeholderTextColor="#71717a"
                />

                {/* Selected Count (for multiple selection) */}
                {multiple && internalSelectedValues.length > 0 && (
                    <View style={sheetStyles.selectedCountContainer}>
                        <Text style={sheetStyles.selectedCountText}>
                            {internalSelectedValues.length} selected
                        </Text>
                    </View>
                )}

                <ScrollView style={{
                    
                }}>

                </ScrollView>

                {/* Options List */}
                <FlatList
                    data={processedOptions}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item, index }) => {
                        const isSelected = internalSelectedValues.includes(item.value);
                        return (
                            <Pressable
                                style={[
                                    sheetStyles.option,
                                    isSelected && sheetStyles.selectedOption,
                                    index === processedOptions.length - 1 && sheetStyles.lastOption
                                ]}
                                onPressIn={() => handleSelect(item.value)}
                                android_ripple={{ color: '#e0f7fa' }}
                            >
                                <View style={sheetStyles.optionContent}>
                                    <Text style={[
                                        sheetStyles.optionText,
                                        isSelected && sheetStyles.selectedOptionText
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <View style={sheetStyles.checkmark}>
                                            <Text style={sheetStyles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </View>
                            </Pressable>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={sheetStyles.emptyContainer}>
                            <Text style={sheetStyles.noResults}>No options found</Text>
                            <Text style={sheetStyles.noResultsSubtext}>
                                Try adjusting your search
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={true}
                    style={sheetStyles.list}
                    contentContainerStyle={sheetStyles.listContent}
                />

                {/* Action Buttons */}
                <View style={sheetStyles.buttonContainer}>
                    {multiple && (
                        <Pressable
                            style={[sheetStyles.button, sheetStyles.doneButton]}
                            onPress={handleDone}
                        >
                            <Text style={sheetStyles.doneButtonText}>Done</Text>
                        </Pressable>
                    )}
                    <Pressable
                        style={[sheetStyles.button, sheetStyles.cancelButton]}
                        onPress={() => SheetManager.hide(sheetId)}
                    >
                        <Text style={sheetStyles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </ActionSheet>
    );
}

export default SelectSheet;

const sheetStyles = StyleSheet.create({
    actionSheetContainer: {
        flex: 1,
    },
    container: {
        
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
       
    },
    header: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#cbd5e1',
        borderRadius: 2,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        fontFamily: 'Outfit_600SemiBold',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginVertical: 16,
        fontSize: 16,
        backgroundColor: '#f8fafc',
        fontFamily: 'Outfit_400Regular',
    },
    selectedCountContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#e0f7fa',
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    selectedCountText: {
        fontSize: 12,
        color: '#0891b2',
        fontWeight: '500',
        fontFamily: 'Outfit_500Medium',
    },
    list: {
        // flex: 1,
        // flexGrow:1,
        paddingHorizontal: 20,
        height:220
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    option: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        borderRadius: 8,
        marginBottom: 2,
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    selectedOption: {
        backgroundColor: '#e0f7fa',
        borderColor: '#0891b2',
        borderWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
        flex: 1,
        fontFamily: 'Outfit_400Regular',
    },
    selectedOptionText: {
        color: '#0f172a',
        fontWeight: '500',
        fontFamily: 'Outfit_500Medium',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0891b2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noResults: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 4,
        fontFamily: 'Outfit_500Medium',
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#94a3b8',
        fontFamily: 'Outfit_400Regular',
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButton: {
        backgroundColor: '#0891b2',
    },
    doneButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Outfit_500Medium',
    },
});