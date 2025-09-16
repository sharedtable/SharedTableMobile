import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface DinnerBooking {
  id: string;
  dinner_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'waitlisted' | 'declined' | 'cancelled' | 'attended' | 'completed';
  dietary_restrictions?: string;
  preferences?: string;
  plus_one?: boolean;
  has_reviewed?: boolean;
  created_at?: string;
  updated_at?: string;
  dinners?: {
    id: string;
    datetime: string;
    status: string;
    restaurant_name?: string;
    restaurant_address?: string;
    group_details?: {
      table_number?: number;
      meeting_time?: string;
      special_instructions?: string;
    };
  };
  dinner?: {
    id: string;
    datetime: string;
    status: string;
    restaurant_name?: string;
    restaurant_address?: string;
    group_details?: {
      table_number?: number;
      meeting_time?: string;
      special_instructions?: string;
    };
  };
}

interface ReservationCardProps {
  reservation: DinnerBooking;
  onCancel: (bookingId: string) => void;
  restaurantImage: string;
}

export function ReservationCard({ reservation, onCancel, restaurantImage }: ReservationCardProps) {
  const navigation = useNavigation<ProfileNavigationProp>();

  const formatReservationDate = () => {
    const dinnerDateTime = reservation.dinners?.datetime || reservation.dinner?.datetime;
    if (!dinnerDateTime) return '';
    const dateTime = new Date(dinnerDateTime);
    if (isNaN(dateTime.getTime())) return '';
    
    const year = dateTime.getFullYear().toString();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    let displayHour;
    if (hours > 12) {
      displayHour = hours - 12;
    } else if (hours === 0) {
      displayHour = 12;
    } else {
      displayHour = hours;
    }
    const displayMinute = minutes.toString().padStart(2, '0');
    const time = `${displayHour}:${displayMinute} ${period}`;
    
    return `${month}/${day}/${year} at ${time}`;
  };

  const handleSeeDetails = () => {
    navigation.navigate('DinnerDetails', { 
      bookingId: reservation.id,
      dinnerId: reservation.dinner_id || reservation.dinners?.id,
      reservation
    });
  };

  const handleReview = () => {
    navigation.navigate('PostDinnerSurvey' as any, {
      bookingId: reservation.id,
      dinnerId: reservation.dinner_id || reservation.dinner?.id
    });
  };

  const restaurantName = reservation.dinners?.restaurant_name || 
                         reservation.dinner?.restaurant_name || 
                         'Restaurant TBD';

  const dinnerDate = reservation.dinners?.datetime || reservation.dinner?.datetime;
  const isPastReservation = dinnerDate ? new Date(dinnerDate) < new Date() : false;
  const groupDetails = reservation.dinners?.group_details || reservation.dinner?.group_details;

  // Determine what to show based on status
  const shouldShowReviewButton = () => {
    return (reservation.status === 'completed' || 
            reservation.status === 'attended' ||
            (isPastReservation && reservation.status === 'assigned')) && 
           !reservation.has_reviewed;
  };


  const shouldShowCancelButton = () => {
    return reservation.status !== 'cancelled' && 
           reservation.status !== 'declined' &&
           reservation.status !== 'attended' &&
           reservation.status !== 'completed' &&
           !isPastReservation;
  };

  const shouldShowDetailsButton = () => {
    return reservation.status !== 'cancelled' && 
           reservation.status !== 'declined' &&
           reservation.status !== 'completed' &&
           reservation.status !== 'attended';
  };

  const isDisabled = reservation.status === 'cancelled' || reservation.status === 'declined';

  return (
    <Pressable 
      style={[
        styles.reservationCard,
        isDisabled && styles.cardDisabled
      ]}
      onPress={!isDisabled ? handleSeeDetails : undefined}
      disabled={isDisabled}
    >
      <View style={styles.cardContent}>
        {/* Left: Restaurant image or SharedTable logo */}
        {restaurantName !== 'Restaurant TBD' ? (
          <Image 
            source={{ uri: restaurantImage }}
            style={styles.imageSquare}
            resizeMode="cover"
          />
        ) : (
          <Image 
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require('@/assets/icon.png')}
            style={styles.imageSquare}
            resizeMode="cover"
          />
        )}
        
        {/* Center: Restaurant info */}
        <View style={styles.restaurantInfo}>
          <Text style={[
            styles.restaurantTitle,
            isDisabled && styles.textDisabled
          ]}>
            {restaurantName}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons 
              name="calendar-outline" 
              size={12} 
              color={isDisabled ? theme.colors.gray?.['400'] || '#9E9E9E' : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.dateText,
              isDisabled && styles.textDisabled
            ]}>
              {formatReservationDate()}
            </Text>
          </View>
          
          {/* Show status-specific information */}
          {reservation.status === 'assigned' && groupDetails?.table_number && (
            <View style={styles.statusRow}>
              <Ionicons name="people" size={12} color={theme.colors.primary.main} />
              <Text style={styles.statusText}>Table {groupDetails.table_number}</Text>
            </View>
          )}
          
          {reservation.status === 'waitlisted' && (
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={12} color={theme.colors.warning?.main || '#FF9800'} />
              <Text style={styles.statusText}>Waitlisted</Text>
            </View>
          )}
          
          {reservation.status === 'cancelled' && (
            <View style={styles.statusRow}>
              <Ionicons name="close-circle-outline" size={12} color={theme.colors.gray?.['500'] || '#757575'} />
              <Text style={[styles.statusText, styles.textDisabled]}>Cancelled</Text>
            </View>
          )}
          
          {reservation.status === 'declined' && (
            <View style={styles.statusRow}>
              <Ionicons name="close-circle" size={12} color={theme.colors.error.main} />
              <Text style={[styles.statusText, { color: theme.colors.error.main }]}>Declined</Text>
            </View>
          )}
        </View>
        
        {/* Right: Actions or Status Badge */}
        <View style={styles.cardActions}>
          {shouldShowReviewButton() ? (
            // Show Review link for completed/attended dinners
            <Pressable 
              style={styles.reviewLink}
              onPress={handleReview}
            >
              <Text style={styles.reviewLinkText}>Review</Text>
            </Pressable>
          ) : (
            // Show action buttons for active bookings
            !isDisabled && (
              <View style={styles.actionButtonsColumn}>
                {shouldShowDetailsButton() && (
                  <Pressable 
                    style={styles.seeDetailsButton}
                    onPress={handleSeeDetails}
                  >
                    <Text style={styles.seeDetailsText}>See details</Text>
                  </Pressable>
                )}
                
                {shouldShowCancelButton() && (
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => onCancel(reservation.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            )
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reservationCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.paleGray,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
  },
  imageSquare: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(8),
    marginRight: scaleWidth(12),
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  dateText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    marginTop: scaleHeight(2),
  },
  statusText: {
    fontSize: scaleFont(11),
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  textDisabled: {
    color: theme.colors.gray?.['500'] || '#757575',
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionButtonsColumn: {
    alignItems: 'flex-end',
    gap: scaleHeight(8),
  },
  seeDetailsButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
  },
  seeDetailsText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  cancelButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  cancelButtonText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  reviewLink: {
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(4),
  },
  reviewLinkText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
});