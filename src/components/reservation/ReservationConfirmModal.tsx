import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { format } from 'date-fns';
import { DietaryPreferencesModal } from './DietaryPreferencesModal';

interface ReservationConfirmModalProps {
  visible: boolean;
  dinnerData: {
    id: string;
    datetime: string;
    restaurant?: string;
    address?: string;
    dinner_type?: 'regular' | 'singles';
    current_signups?: number;
    max_signups?: number;
  } | null;
  onConfirm: () => void;
  onChangeTime: () => void;
  onInviteFriends: () => void;
  onCancel: () => void;
}

export const ReservationConfirmModal: React.FC<ReservationConfirmModalProps> = ({
  visible,
  dinnerData,
  onConfirm,
  onChangeTime,
  onInviteFriends,
  onCancel,
}) => {
  const styles = getStyles();
  const [isConfirming, _setIsConfirming] = useState(false);
  const [showDietaryPreferences, setShowDietaryPreferences] = useState(false);
  const [isReservationConfirmed, setIsReservationConfirmed] = useState(false);

  // Reset confirmed state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsReservationConfirmed(false);
    }
  }, [visible]);

  if (!dinnerData) return null;

  const dinnerDate = new Date(dinnerData.datetime);
  const dayOfWeek = format(dinnerDate, 'EEEE');
  const monthDay = format(dinnerDate, 'MMMM d');
  const time = format(dinnerDate, 'h:mm a');

  const handleConfirmReservation = () => {
    // Show dietary preferences modal without closing this one
    setShowDietaryPreferences(true);
  };

  const handleDietarySuccess = () => {
    setShowDietaryPreferences(false);
    // Set reservation as confirmed and keep modal open
    setIsReservationConfirmed(true);
    // Trigger the success callback if needed
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleInvitePlus1 = () => {
    Alert.alert(
      'Invite Plus One',
      'Invite a friend to join you at this dinner',
      [
        {
          text: 'Invite Later',
          style: 'cancel',
        },
        {
          text: 'Send Invite',
          onPress: onInviteFriends,
        },
      ]
    );
  };

  const handleAddToCalendar = async () => {
    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status === 'granted') {
        // Get the default calendar or create one
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        
        let calendarId;
        if (Platform.OS === 'ios') {
          // On iOS, use the default calendar
          const defaultCalendar = calendars.find(cal => cal.allowsModifications && cal.source.name === 'iCloud');
          calendarId = defaultCalendar?.id || calendars[0]?.id;
        } else {
          // On Android, create a new calendar if needed
          const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
          calendarId = defaultCalendar?.id;
        }

        if (!calendarId) {
          Alert.alert('Error', 'Could not find a calendar to add the event to.');
          return;
        }

        // Create the event
        const eventDetails = {
          title: `Fare Dinner ${dinnerData.dinner_type === 'singles' ? '(Singles)' : ''}`,
          startDate: dinnerDate,
          endDate: new Date(dinnerDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
          location: dinnerData.restaurant && dinnerData.address 
            ? `${dinnerData.restaurant}, ${dinnerData.address}`
            : 'Location to be revealed 24h before',
          notes: 'Your Fare dining experience awaits! Location and dining partner details will be sent 24 hours before the event.',
          alarms: [
            { relativeOffset: -1440 }, // 24 hours before
            { relativeOffset: -120 },  // 2 hours before
          ],
        };

        const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
        
        if (eventId) {
          Alert.alert(
            'Success!',
            'The dinner has been added to your calendar.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow calendar access in your device settings to add events.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Could not add event to calendar. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.invisibleArea} onPress={onCancel} />
        <View style={styles.modalContent}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >

            {/* Success Icon and Title */}
            <View style={styles.titleSection}>
              <View style={[styles.successIcon, isReservationConfirmed && styles.confirmedIcon]}>
                <Ionicons 
                  name={isReservationConfirmed ? "checkmark-circle" : "checkmark"} 
                  size={isReservationConfirmed ? 28 : 24} 
                  color={theme.colors.white} 
                />
              </View>
              <Text style={styles.title}>
                {isReservationConfirmed ? "You're all set!" : "Almost there! Let's lock it in"}
              </Text>
              <Text style={styles.subtitle}>
                {isReservationConfirmed 
                  ? "Your reservation has been confirmed. You'll receive details 24 hours before the event."
                  : "Your seat will be held for 15 minutes while you confirm."}
              </Text>
            </View>

            {/* Reservation Details Card */}
            <View style={styles.detailsCard}>
              {/* Date */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.brand.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{dayOfWeek}, {monthDay}</Text>
                </View>
              </View>

              {/* Time */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.brand.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{time}</Text>
                </View>
              </View>

              {/* Restaurant */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.brand.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Restaurant</Text>
                  <Text style={styles.detailValue}>
                    {dinnerData.restaurant || 'Your ideal restaurant and'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {dinnerData.address || 'dining partner revealed 24h before'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Add to Calendar Button */}
            <Pressable 
              style={styles.calendarButton}
              onPress={handleAddToCalendar}
            >
              <View style={styles.calendarIconContainer}>
                <Ionicons name="calendar" size={18} color="#4285F4" />
              </View>
              <Text style={styles.calendarButtonText}>Add to Calendar</Text>
            </Pressable>

            {/* Action Buttons */}
            {isReservationConfirmed ? (
              <>
                <Pressable 
                  style={[styles.confirmButton, styles.doneButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.confirmButtonText}>Done</Text>
                  <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                </Pressable>

                <Pressable style={[styles.secondaryButton, styles.inviteFriendsButton]} onPress={handleInvitePlus1}>
                  <Ionicons name="person-add-outline" size={18} color={theme.colors.text.primary} />
                  <Text style={[styles.secondaryButtonText, styles.inviteFriendsText]}>Invite Friends</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable 
                  style={styles.confirmButton}
                  onPress={handleConfirmReservation}
                  disabled={isConfirming}
                >
                  <Text style={styles.confirmButtonText}>
                    {isConfirming ? 'Confirming...' : 'Confirm Reservation'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                </Pressable>

                <View style={styles.secondaryButtons}>
                  <Pressable style={styles.secondaryButton} onPress={onChangeTime}>
                    <Text style={styles.secondaryButtonText}>Change Time</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryButton} onPress={handleInvitePlus1}>
                    <Text style={styles.secondaryButtonText}>Invite Friends</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Dietary Preferences Modal */}
      <DietaryPreferencesModal
        visible={showDietaryPreferences}
        dinnerData={dinnerData}
        onClose={() => setShowDietaryPreferences(false)}
        onSuccess={handleDietarySuccess}
      />
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

// Calculate the height to match the white card area from HomeScreen
const CARD_TOP_POSITION = scaleHeight(210); // Same as contentCardContainer top position
const MODAL_HEIGHT = screenHeight - CARD_TOP_POSITION;

/* eslint-disable react-native/no-unused-styles */
const getStyles = () => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  invisibleArea: {
    flex: 1,
    // No background - completely transparent
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    height: MODAL_HEIGHT,
    shadowColor: theme.colors.black['1'],
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: scaleHeight(16),
    right: scaleWidth(16),
    zIndex: 10,
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black?.['1'] || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    paddingTop: scaleHeight(30),
    paddingBottom: scaleHeight(40),
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(20),
  },
  successIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: theme.colors.brand.primary,
    marginBottom: scaleHeight(8),
    fontFamily: theme.typography.fontFamily.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: scaleWidth(30),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
  detailsCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    borderWidth: 2,
    borderColor: '#E8F4FF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(20),
  },
  iconContainer: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: scaleFont(11),
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(2),
    fontFamily: theme.typography.fontFamily.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: scaleFont(15),
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.brand.primary,
    marginHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(15),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
  },
  confirmButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    marginRight: scaleWidth(8),
    fontFamily: theme.typography.fontFamily.body,
  },
  secondaryButtons: {
    flexDirection: 'row',
    marginHorizontal: scaleWidth(20),
    gap: scaleWidth(12),
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: scaleHeight(13),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: theme.colors.gray?.['300'] || '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  secondaryButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '500',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  plusOneBadge: {
    marginLeft: scaleWidth(8),
    backgroundColor: theme.colors.success?.main || '#00C896',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(14),
  },
  plusOneText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  calendarButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(16),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconContainer: {
    marginRight: scaleWidth(8),
  },
  calendarButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#4285F4',
    fontFamily: theme.typography.fontFamily.body,
  },
  confirmedIcon: {
    backgroundColor: theme.colors.success?.main || '#4CAF50',
  },
  doneButton: {
    backgroundColor: theme.colors.success?.main || '#4CAF50',
  },
  inviteFriendsButton: {
    marginHorizontal: scaleWidth(20),
    flexDirection: 'row' as const,
  },
  inviteFriendsText: {
    marginLeft: 8,
  },
});