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
      const result = await apiService.patch(`/service-requests/${serviceRequestId}/schedule`, {
        scheduledDate: selectedDate.toISOString()
      });

      if (result.success) {
        onScheduleUpdated(selectedDate.toISOString());
        SheetManager.hide(sheetId);
        Alert.alert(
          'Success', 
          `Service has been scheduled for ${formatDateTime(selectedDate)}`
        );
      } else {
        throw new Error(result.error || 'Failed to schedule service');
      }
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
              const result = await apiService.patch(`/service-requests/${serviceRequestId}/schedule`, {
                scheduledDate: null
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const getQuickScheduleOptions = () => {
    const now = new Date();
    const options = [];

    // Tomorrow morning
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    options.push({ label: 'Tomorrow Morning (9:00 AM)', date: tomorrow });

    // Tomorrow afternoon
    const tomorrowAfternoon = new Date(now);
    tomorrowAfternoon.setDate(now.getDate() + 1);
    tomorrowAfternoon.setHours(14, 0, 0, 0);
    options.push({ label: 'Tomorrow Afternoon (2:00 PM)', date: tomorrowAfternoon });

    // Day after tomorrow
    const dayAfter = new Date(now);
    dayAfter.setDate(now.getDate() + 2);
    dayAfter.setHours(10, 0, 0, 0);
    options.push({ label: 'Day After Tomorrow (10:00 AM)', date: dayAfter });

    // Next week
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    options.push({ label: 'Next Week (10:00 AM)', date: nextWeek });

    return options;
  };

  const quickOptions = getQuickScheduleOptions();

  return (
    <ActionSheet
      id={sheetId}
      snapPoints={[100]}
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

        {/* Quick Schedule Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Schedule</Text>
          <View style={styles.quickOptionsContainer}>
            {quickOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickOption}
                onPress={() => setSelectedDate(option.date)}
                disabled={updating}
              >
                <Ionicons name="time" size={20} color="#3B82F6" />
                <Text style={styles.quickOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Date & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Date & Time</Text>
          
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
              disabled={updating}
            >
              <Ionicons name="calendar" size={20} color="#3B82F6" />
              <View style={styles.dateTimeInfo}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
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
                <Text style={styles.dateTimeValue}>{formatTime(selectedDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
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
                  <Text style={styles.clearButtonText}>Clear Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.scheduleButton,
              updating && styles.disabledButton
            ]}
            onPress={handleScheduleService}
            disabled={updating}
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
    minHeight: screenHeight ,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: screenHeight ,
    minHeight: screenHeight * 0.7,
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
  quickOptionsContainer: {
    gap: 8,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  quickOptionText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    flex: 1,
  },
  dateTimeContainer: {
    gap: 12,
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