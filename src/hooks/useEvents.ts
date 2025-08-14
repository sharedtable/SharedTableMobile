/**
 * useEvents hook
 * Manages events state and provides event-related actions
 */

import { useState, useEffect, useCallback } from 'react';

import { BookingsService, type BookingRequest, type BookingResponse } from '@/lib/api/bookings';
import { EventsService, type EventWithAvailability } from '@/lib/api/events';
import { useAuth } from '@/lib/auth';

interface UseEventsReturn {
  // State
  regularDinners: EventWithAvailability[];
  singlesDinners: EventWithAvailability[];
  allEvents: EventWithAvailability[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;

  // Actions
  refreshEvents: () => Promise<void>;
  bookEvent: (eventId: string, specialRequests?: string) => Promise<BookingResponse>;
  cancelBooking: (eventId: string) => Promise<BookingResponse>;
  isEventBooked: (eventId: string) => Promise<boolean>;
}

export const useEvents = (): UseEventsReturn => {
  const { user } = useAuth();

  // State
  const [regularDinners, setRegularDinners] = useState<EventWithAvailability[]>([]);
  const [singlesDinners, setSinglesDinners] = useState<EventWithAvailability[]>([]);
  const [allEvents, setAllEvents] = useState<EventWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch events by type
      const { regularDinners: regular, singlesDinners: singles } =
        await EventsService.getEventsByType();

      // Also get all upcoming events
      const upcoming = await EventsService.getUpcomingEvents();

      setRegularDinners(regular);
      setSinglesDinners(singles);
      setAllEvents(upcoming);

      console.log('✅ [useEvents] Events loaded:', {
        regular: regular.length,
        singles: singles.length,
        total: upcoming.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      console.error('❌ [useEvents] Error fetching events:', err);
      setError(errorMessage);

      // Set empty arrays on error to prevent UI crashes
      setRegularDinners([]);
      setSinglesDinners([]);
      setAllEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Refresh events (pull-to-refresh functionality)
   */
  const refreshEvents = useCallback(async () => {
    await fetchEvents(true);
  }, [fetchEvents]);

  /**
   * Book an event
   */
  const bookEvent = useCallback(
    async (eventId: string, specialRequests?: string): Promise<BookingResponse> => {
      if (!user) {
        return {
          success: false,
          message: 'You must be logged in to book an event',
        };
      }

      try {
        const bookingRequest: BookingRequest = {
          eventId,
          userId: user.id,
          specialRequests,
        };

        const response = await BookingsService.bookEvent(bookingRequest);

        if (response.success) {
          // Refresh events to update participant counts
          await fetchEvents(true);
        }

        return response;
      } catch (error) {
        console.error('❌ [useEvents] Booking failed:', error);
        return {
          success: false,
          message: 'Failed to book event. Please try again.',
        };
      }
    },
    [user, fetchEvents]
  );

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(
    async (eventId: string): Promise<BookingResponse> => {
      if (!user) {
        return {
          success: false,
          message: 'You must be logged in to cancel a booking',
        };
      }

      try {
        const response = await BookingsService.cancelBooking(eventId, user.id);

        if (response.success) {
          // Refresh events to update participant counts
          await fetchEvents(true);
        }

        return response;
      } catch (error) {
        console.error('❌ [useEvents] Cancel booking failed:', error);
        return {
          success: false,
          message: 'Failed to cancel booking. Please try again.',
        };
      }
    },
    [user, fetchEvents]
  );

  /**
   * Check if user has booked an event
   */
  const isEventBooked = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        return await BookingsService.isEventBooked(eventId, user.id);
      } catch (error) {
        console.error('❌ [useEvents] Failed to check booking status:', error);
        return false;
      }
    },
    [user]
  );

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    // State
    regularDinners,
    singlesDinners,
    allEvents,
    loading,
    error,
    refreshing,

    // Actions
    refreshEvents,
    bookEvent,
    cancelBooking,
    isEventBooked,
  };
};
