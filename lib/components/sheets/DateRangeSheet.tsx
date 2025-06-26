import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Predefined date range options
const DATE_RANGES = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 2 Months', days: 60 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last 1 Year', days: 365 },
];

interface DateRangeSheetProps extends SheetProps {
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
}

export default function DateRangeSheet({ sheetId, payload }: DateRangeSheetProps) {
  const { onDateRangeSelect } = payload || {};
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetSelect = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(days);
  };

  const handleApply = () => {
    if (onDateRangeSelect) {
      onDateRangeSelect(startDate, endDate);
    }
    SheetManager.hide(sheetId);
  };

  return (
    <ActionSheet
      id={sheetId}
      snapPoints={[90]} // Full screen height
      initialSnapIndex={0}
      gestureEnabled={true}
      closeOnTouchBackdrop={true}
      containerStyle={styles.actionSheetContainer}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Time Period</Text>
        </View>

        {/* Preset Ranges */}
        <View style={styles.presetContainer}>
          {DATE_RANGES.map((range, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                selectedPreset === range.days && styles.selectedPreset
              ]}
              onPress={() => handlePresetSelect(range.days)}
            >
              <Text 
                style={[
                  styles.presetText,
                  selectedPreset === range.days && styles.selectedPresetText
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date Selection */}
        <View style={styles.customDateContainer}>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>-</Text>
          </View>

          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
                setSelectedPreset(null);
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
                setSelectedPreset(null);
              }
            }}
          />
        )}

        {/* Apply Button */}
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  actionSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 100,
    // height: screenHeight * 0.9, // 90% of screen height
  },
  container: {
    // flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Outfit_600SemiBold',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetButton: {
    width: '30%',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPreset: {
    backgroundColor: '#007bff',
  },
  presetText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
  selectedPresetText: {
    color: 'white',
    fontFamily: 'Outfit_600SemiBold',
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Outfit_500Medium',
  },
  dateSeparator: {
    paddingHorizontal: 10,
  },
  dateSeparatorText: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'Outfit_600SemiBold',
  },
  applyButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
}); 