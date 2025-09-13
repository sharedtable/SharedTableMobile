import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { api, EventBooking } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type RootStackParamList = {
  PostDinnerSurvey: {
    bookingId: string;
    dinnerId: string;
  };
};

export const usePostDinnerSurvey = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isAuthenticated } = useAuthStore();
  const [pendingSurvey, setPendingSurvey] = useState<EventBooking | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || hasChecked) return;

    const checkForPendingSurveys = async () => {
      try {
        // Get user's bookings
        const response = await api.getMyBookings();
        
        if (response.success && response.data) {
          // Find bookings that are completed but don't have survey submitted
          const completedBookings = response.data.filter(
            (booking: any) => 
              booking.status === 'completed' && 
              !booking.survey_submitted
          );

          if (completedBookings.length > 0) {
            // Get the most recent completed booking
            const mostRecent = completedBookings.sort((a: any, b: any) => {
              const dateA = a.dinners?.datetime || a.dinner?.datetime || 0;
              const dateB = b.dinners?.datetime || b.dinner?.datetime || 0;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })[0];

            setPendingSurvey(mostRecent);

            // Navigate to survey after a short delay
            const dinnerId = mostRecent.dinner_id || mostRecent.dinner?.id;
            if (dinnerId) {
              setTimeout(() => {
                navigation.navigate('PostDinnerSurvey', {
                  bookingId: mostRecent.id,
                  dinnerId,
                });
              }, 2000);
            }
          }
        }
        
        setHasChecked(true);
      } catch (error) {
        console.error('Error checking for pending surveys:', error);
        setHasChecked(true);
      }
    };

    // Check after a delay to not interrupt initial app load
    const timer = setTimeout(checkForPendingSurveys, 5000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasChecked, navigation]);

  return { pendingSurvey };
};