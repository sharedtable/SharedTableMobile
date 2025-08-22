/**
 * Events API service
 * Works with the existing database schema from SharedTableWeb
 */

import { supabase } from '../supabase/client';
import type { Event } from '../supabase/types/database';

export interface EventWithAvailability extends Event {
  availableSpots: number;
  isFullyBooked: boolean;
  canBook: boolean;
  formattedDate: string;
  formattedTime: string;
  formattedDateTime: string;
  location: string;
  priceDisplay: string;
}

export class EventsService {
  /**
   * Get all upcoming events from the actual database
   */
  static async getUpcomingEvents(): Promise<EventWithAvailability[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    if (!events) {
      return [];
    }

    const transformedEvents = events.map(EventsService.transformEvent);
    return transformedEvents;
  }

  /**
   * Get events categorized by type
   */
  static async getEventsByType(): Promise<{
    regularDinners: EventWithAvailability[];
    singlesDinners: EventWithAvailability[];
  }> {
    try {
      const allEvents = await EventsService.getUpcomingEvents();

      // Categorize based on target relationship goals first, then capacity
      const singlesDinners = allEvents.filter((event) => {
        return (
          event.target_relationship_goals?.includes('dating') ||
          event.target_relationship_goals?.includes('relationship') ||
          (event.max_capacity < 8 && !event.target_relationship_goals?.length)
        );
      });

      const regularDinners = allEvents.filter((event) => {
        // Only regular dinners if NOT in singles category
        const isSinglesEvent =
          event.target_relationship_goals?.includes('dating') ||
          event.target_relationship_goals?.includes('relationship') ||
          (event.max_capacity < 8 && !event.target_relationship_goals?.length);
        return !isSinglesEvent;
      });

      return { regularDinners, singlesDinners };
    } catch (error) {
      console.error('Error fetching events by type:', error);
      return { regularDinners: [], singlesDinners: [] };
    }
  }

  /**
   * Transform raw event data to EventWithAvailability
   */
  private static transformEvent(rawEvent: Event): EventWithAvailability {
    const availableSpots = Math.max(0, rawEvent.max_capacity - rawEvent.current_capacity);
    const isFullyBooked = availableSpots === 0;

    const now = new Date();
    const eventDate = new Date(rawEvent.event_date);

    // Simplified booking logic - allow booking if event is in future and not cancelled
    const isBookingOpen = eventDate > now;

    const canBook =
      !isFullyBooked && isBookingOpen && rawEvent.status === 'published' && !rawEvent.cancelled_at;

    const eventDateTime = EventsService.combineDateTime(rawEvent.event_date, rawEvent.start_time);
    const { formattedDate, formattedTime, formattedDateTime } =
      EventsService.formatDateTime(eventDateTime);
    const location = EventsService.extractLocation(rawEvent);
    const priceDisplay = EventsService.formatPrice(rawEvent.price_cents);

    return {
      ...rawEvent,
      availableSpots,
      isFullyBooked,
      canBook,
      formattedDate,
      formattedTime,
      formattedDateTime,
      location,
      priceDisplay,
    };
  }

  /**
   * Combine event_date and start_time into a single DateTime
   */
  private static combineDateTime(eventDate: string, startTime: string): Date {
    try {
      const dateTimeString = `${eventDate}T${startTime}`;
      return new Date(dateTimeString);
    } catch (error) {
      console.error('Date parsing error:', error);
      return new Date();
    }
  }

  /**
   * Format date and time for display
   */
  private static formatDateTime(dateTime: Date): {
    formattedDate: string;
    formattedTime: string;
    formattedDateTime: string;
  } {
    try {
      const formattedDate = dateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const formattedTime = dateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const formattedDateTime = `${formattedDate} at ${formattedTime}`;

      return { formattedDate, formattedTime, formattedDateTime };
    } catch (error) {
      console.error('Date formatting error:', error);
      return {
        formattedDate: 'Invalid Date',
        formattedTime: 'Invalid Time',
        formattedDateTime: 'Invalid Date/Time',
      };
    }
  }

  /**
   * Extract location from venue data
   */
  private static extractLocation(event: Event): string {
    if (event.venue_details?.name) {
      return event.venue_details.name;
    }

    if (event.venue_details?.address) {
      return event.venue_details.address;
    }

    if (event.venue_id) {
      return `Venue ${event.venue_id.substring(0, 8)}`;
    }

    return 'Location TBD';
  }

  /**
   * Format price in cents to display string
   */
  private static formatPrice(priceCents: number | null): string {
    if (!priceCents || priceCents === 0) {
      return 'Free';
    }

    const dollars = priceCents / 100;
    return `$${dollars.toFixed(0)}`;
  }

  /**
   * Update event capacity when someone books
   */
  static async updateEventCapacity(eventId: string, increment: number): Promise<boolean> {
    try {
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('current_capacity, max_capacity')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        return false;
      }

      const newCapacity = Math.max(0, event.current_capacity + increment);

      if (newCapacity > event.max_capacity) {
        return false;
      }

      const { error: updateError } = await supabase
        .from('events')
        .update({
          current_capacity: newCapacity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (updateError) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update event capacity error:', error);
      return false;
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(eventId: string): Promise<EventWithAvailability | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        return null;
      }

      return EventsService.transformEvent(event);
    } catch (error) {
      console.error('Get event by ID error:', error);
      return null;
    }
  }
}
