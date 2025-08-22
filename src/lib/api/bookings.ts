/**
 * Bookings API service
 * Handles event reservations and spot management
 * Updated to work with Privy authentication
 */

import { UserSyncService } from '@/services/userSyncService';

import { supabase } from '../supabase/client';
import type { Event } from '../supabase/types/database';

export interface BookingRequest {
  eventId: string;
  userEmail: string; // Changed from userId to userEmail for Privy
  specialRequests?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
  waitlisted?: boolean;
}

export interface UserBooking {
  id: string;
  event: Event;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  createdAt: string;
  specialRequests?: string;
}

export class BookingsService {
  /**
   * Book a spot for an event
   * This is a simplified booking system - in production you'd want more robust handling
   */
  static async bookEvent(booking: BookingRequest): Promise<BookingResponse> {
    try {
      // Get user from database using email (from Privy auth)
      if (!booking.userEmail) {
        return {
          success: false,
          message: 'User email is required to book an event',
        };
      }

      const user = await UserSyncService.getUserByEmail(booking.userEmail);

      if (!user) {
        return {
          success: false,
          message: 'User account not found. Please try logging in again.',
        };
      }

      // First, get the current event data
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', booking.eventId)
        .single();

      if (eventError || !event) {
        return {
          success: false,
          message: 'Event not found or unavailable',
        };
      }

      // Check if event is available for booking
      if (event.status !== 'published') {
        return {
          success: false,
          message: 'Event is not available for booking',
        };
      }

      const availableSpots = event.max_capacity - event.current_capacity;

      if (availableSpots <= 0) {
        return {
          success: false,
          message: 'Event is fully booked',
          waitlisted: true,
        };
      }

      // Create booking record with proper enum values based on defaults
      const bookingData = {
        user_id: user.id, // Use Supabase user ID from synced data
        event_id: booking.eventId,
        status: 'pending', // Default value from schema
        payment_status: 'pending', // Default value from schema
        special_requests: booking.specialRequests || null,
        booking_source: 'mobile_app',
      };

      const { data: bookingRecord, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        return {
          success: false,
          message: 'Failed to complete booking. Please try again.',
        };
      }

      // Update event participant count
      const { error: updateError } = await supabase
        .from('events')
        .update({
          current_capacity: event.current_capacity + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.eventId);

      if (updateError) {
        // Rollback the booking if event update fails
        await supabase.from('bookings').delete().eq('id', bookingRecord.id);

        return {
          success: false,
          message: 'Failed to complete booking. Please try again.',
        };
      }

      return {
        success: true,
        bookingId: bookingRecord.id,
        message: 'Successfully booked your spot!',
      };
    } catch (error) {
      console.error('Error booking event:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(eventId: string, userEmail: string): Promise<BookingResponse> {
    try {
      // Get user from database
      const user = await UserSyncService.getUserByEmail(userEmail);

      if (!user) {
        return {
          success: false,
          message: 'User account not found',
        };
      }

      // First, find the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .single();

      if (bookingError || !booking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Update booking status to cancelled
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateBookingError) {
        return {
          success: false,
          message: 'Failed to cancel booking. Please try again.',
        };
      }

      // Get current event data
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        // Booking was cancelled but event update failed - continue anyway
        return {
          success: true,
          message: 'Booking cancelled successfully',
        };
      }

      // Decrease participant count
      const { error: updateEventError } = await supabase
        .from('events')
        .update({
          current_capacity: Math.max(0, event.current_capacity - 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (updateEventError) {
        // Don't fail the cancellation since the booking was already cancelled
      }

      return {
        success: true,
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return {
        success: false,
        message: 'Failed to cancel booking. Please try again.',
      };
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(userEmail: string): Promise<UserBooking[]> {
    try {
      // Get user from database
      const user = await UserSyncService.getUserByEmail(userEmail);

      if (!user) {
        return [];
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          status,
          created_at,
          special_requests,
          events (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      if (!bookings) {
        return [];
      }

      // Transform the data to match UserBooking interface
      const userBookings: UserBooking[] = bookings
        .filter((booking) => booking.events) // Filter out bookings without event data
        .map((booking) => ({
          id: booking.id,
          event: booking.events as unknown as Event, // Cast properly from join result
          status: booking.status,
          createdAt: booking.created_at,
          specialRequests: booking.special_requests || undefined,
        }));

      return userBookings;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  }

  /**
   * Check if user has already booked an event
   */
  static async isEventBooked(eventId: string, userEmail: string): Promise<boolean> {
    try {
      // Get user from database
      const user = await UserSyncService.getUserByEmail(userEmail);

      if (!user) {
        return false;
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No booking found
          return false;
        }
        return false;
      }

      return !!booking;
    } catch (error) {
      console.error('Error checking if event is booked:', error);
      return false;
    }
  }

  /**
   * Get event capacity info
   */
  static getCapacityInfo(event: Event): {
    availableSpots: number;
    totalSpots: number;
    occupancyRate: number;
    isFullyBooked: boolean;
  } {
    const availableSpots = Math.max(0, event.max_capacity - event.current_capacity);
    const totalSpots = event.max_capacity;
    const occupancyRate = (event.current_capacity / event.max_capacity) * 100;
    const isFullyBooked = availableSpots === 0;

    return {
      availableSpots,
      totalSpots,
      occupancyRate,
      isFullyBooked,
    };
  }
}
