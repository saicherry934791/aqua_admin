import { apiService } from '@/lib/api/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';

interface ScheduleTimeSheetProps extends SheetProps {
  serviceRequestId: string;
  currentScheduledDate?: string;
  onScheduleUpdated: (scheduledDate: string | null) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ScheduleTimeSheet({ 
  sheetId, 
  payload 
}: ScheduleTimeSheetProps) {
  const { 
    serviceRequestId, 
    currentScheduledDate, 
    onScheduleUpdated 
  } = payload || {};

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (currentScheduledDate) {
      return new Date(currentScheduledDate);
    }
    // Default to tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setSelectedDate(newDateTime);
    }
  };

  const handleScheduleService = async () => {
    setUpdating(true);
    try {
      // Use the status update endpoint with SCHEDULED status and scheduledDate
      const formData = new FormData();
      formData.append('status', 'SCHEDULED');
      formData.append('scheduledDate', selectedDate.toISOString());

      console.log('formData is ',formData)
      onScheduleUpdated(selectedDate.toISOString());

      // const result = await apiService.patch(`/service-requests/${serviceRequestId}/status`, formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      // if (result.success) {
      //   // Call the callback to trigger details refresh
      //   onScheduleUpdated(selectedDate.toISOString());
      //   SheetManager.hide(sheetId);
      //   Alert.alert(
      //     'Success', 
      //     `Service has been scheduled for ${formatDateTime(selectedDate)}`
      //   );
      // } else {
      //   throw new Error(result.error || 'Failed to schedule service');
      // }
    } catch (error: any) {
      console.log('Failed to schedule service:', error);
      Alert.alert('Error', error.message || 'Failed to schedule service');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearSchedule = async () => {
    Alert.alert(
      'Clear Schedule',
      'Are you sure you want to remove the scheduled time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              // Use the status update endpoint to clear schedule
              const formData = new FormData();
              formData.append('scheduledDate', ''); // Clear the scheduled date

              const result = await apiService.patch(`/service-requests/${serviceRequestId}/status`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              if (result.success) {
                onScheduleUpdated(null);
                SheetManager.hide(sheetId);
                Alert.alert('Success', 'Schedule has been cleared');
              } else {
                throw new Error(result.error || 'Failed to clear schedule');
              }
            } catch (error: any) {
              console.log('Failed to clear schedule:', error);
              Alert.alert('Error', error.message || 'Failed to clear schedule');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isValidScheduleTime = () => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return selectedDate > oneHourFromNow;
  };

  return (
    <ActionSheet
      id={sheetId}
      initialSnapIndex={0}
      gestureEnabled={true}
      closeOnTouchBackdrop={true}
      containerStyle={styles.actionSheetContainer}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule Service</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => SheetManager.hide(sheetId)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Current Schedule Info */}
        {currentScheduledDate && (
          <View style={styles.currentScheduleInfo}>
            <Text style={styles.currentScheduleLabel}>Currently Scheduled:</Text>
            <Text style={styles.currentScheduleTime}>
              {formatDateTime(new Date(currentScheduledDate))}
            </Text>
          </View>
        )}

        {/* Date & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
            disabled={updating}
          >
            <Ionicons name="calendar" size={20} color="#3B82F6" />
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>
                {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
            disabled={updating}
          >
            <Ionicons name="time" size={20} color="#3B82F6" />
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>
                {selectedDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Validation Warning */}
          {!isValidScheduleTime() && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Schedule time should be at least 1 hour from now
              </Text>
            </View>
          )}
        </View>

        {/* Selected Schedule Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Selected Schedule:</Text>
          <Text style={styles.previewDateTime}>{formatDateTime(selectedDate)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentScheduledDate && (
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearSchedule}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.scheduleButton,
              (updating || !isValidScheduleTime()) && styles.disabledButton
            ]}
            onPress={handleScheduleService}
            disabled={updating || !isValidScheduleTime()}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.scheduleButtonText}>
                  {currentScheduledDate ? 'Update Schedule' : 'Schedule Service'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            onChange={handleTimeChange}
          />
        )}
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  currentScheduleInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  currentScheduleLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  currentScheduleTime: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#92400E',
    flex: 1,
  },
  previewContainer: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#4F46E5',
    marginBottom: 4,
  },
  previewDateTime: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#3730A3',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scheduleButton: {
    backgroundColor: '#10B981',
  },
  scheduleButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
});