import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { logger } from '@/utils/logger';

interface BookingData {
  dinnerId: string;
  preferences?: string;
  plusOne?: boolean;
}

interface BookingUpdateData {
  bookingId: string;
  status?: string;
  preferences?: string;
}

export function useBookingWithNotifications() {
  const queryClient = useQueryClient();
  const { sendBookingStatusNotification, sendDinnerReminder } = useNotifications();

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async (data: BookingData) => {
      const response = await api.createBooking(
        data.dinnerId,
        data.preferences,
        data.plusOne
      );
      return response;
    },
    onSuccess: async (response, _variables) => {
      if (response.success) {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['dinners'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });

        // Send notification
        const booking = response.data;
        if (booking) {
          const dinnerName = (booking as any).dinner?.restaurant_name || 'the dinner';
          await sendBookingStatusNotification(
            booking.status || 'pending',
            dinnerName,
            booking.id
          );

          // Schedule reminder if dinner is confirmed
          if (booking.status === 'confirmed' && booking.dinner?.datetime) {
            const dinnerTime = new Date(booking.dinner.datetime);
            const reminderTime = new Date(dinnerTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
            
            if (reminderTime > new Date()) {
              await sendDinnerReminder(
                dinnerName,
                (booking as any).dinner_id || '',
                2
              );
            }
          }
        }

        logger.info('Booking created successfully', { bookingId: booking?.id });
      }
    },
    onError: (error) => {
      logger.error('Failed to create booking', error);
    },
  });

  // Cancel booking mutation
  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.cancelBooking(bookingId);
      return response;
    },
    onSuccess: async (response, bookingId) => {
      if (response.success) {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['dinners'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });

        // Send notification
        const booking = response.data;
        if (booking) {
          const dinnerName = (booking as any).dinner?.restaurant_name || 'the dinner';
          await sendBookingStatusNotification(
            'cancelled',
            dinnerName,
            bookingId
          );
        }

        logger.info('Booking cancelled successfully', { bookingId });
      }
    },
    onError: (error) => {
      logger.error('Failed to cancel booking', error);
    },
  });

  // Update booking mutation
  const updateBooking = useMutation({
    mutationFn: async (data: BookingUpdateData) => {
      const response = await api.updateBooking(data.bookingId, {
        status: data.status,
        preferences: data.preferences,
      });
      return response;
    },
    onSuccess: async (response, variables) => {
      if (response.success) {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['dinners'] });

        // Send notification if status changed
        if (variables.status && response.data) {
          const booking = response.data;
          const dinnerName = (booking as any).dinner?.restaurant_name || 'the dinner';
          await sendBookingStatusNotification(
            variables.status,
            dinnerName,
            variables.bookingId
          );

          // Schedule reminder if status changed to confirmed
          if (variables.status === 'confirmed' && booking.dinner?.datetime) {
            const dinnerTime = new Date(booking.dinner.datetime);
            const reminderTime = new Date(dinnerTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
            
            if (reminderTime > new Date()) {
              await sendDinnerReminder(
                dinnerName,
                (booking as any).dinner_id || '',
                2
              );
            }
          }
        }

        logger.info('Booking updated successfully', { bookingId: variables.bookingId });
      }
    },
    onError: (error) => {
      logger.error('Failed to update booking', error);
    },
  });

  // Check booking status and send appropriate notifications
  const checkAndNotifyBookingStatus = useCallback(async (bookingId: string) => {
    try {
      const response = await api.getBookingDetails(bookingId);
      if (response.success && response.data) {
        const booking = response.data;
        const dinnerName = booking.dinner?.restaurant_name || 'the dinner';
        
        // Send notification based on current status
        await sendBookingStatusNotification(
          booking.status || 'pending',
          dinnerName,
          bookingId
        );

        // If dinner is coming up soon, send reminder
        if (booking.status === 'confirmed' && (booking as any).dinner?.datetime) {
          const dinnerTime = new Date((booking as any).dinner.datetime);
          const hoursUntilDinner = (dinnerTime.getTime() - Date.now()) / (1000 * 60 * 60);
          
          if (hoursUntilDinner > 0 && hoursUntilDinner <= 24) {
            await sendDinnerReminder(
              dinnerName,
              (booking as any).dinner_id || '',
              Math.round(hoursUntilDinner)
            );
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check booking status', error);
    }
  }, [sendBookingStatusNotification, sendDinnerReminder]);

  return {
    createBooking,
    cancelBooking,
    updateBooking,
    checkAndNotifyBookingStatus,
  };
}