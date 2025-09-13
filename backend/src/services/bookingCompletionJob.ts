/**
 * Scheduled job manager for booking completions
 * Schedules exact-time jobs to mark dinners as completed 1.5 hours after start
 */

import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

export class BookingCompletionScheduler {
  private static scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Schedule a booking to be marked as completed at exact time
   * @param bookingId - The booking ID to complete
   * @param dinnerId - The dinner ID
   * @param dinnerDateTime - The dinner start time
   */
  static scheduleCompletion(bookingId: string, dinnerId: string, dinnerDateTime: string): void {
    const dinnerDate = new Date(dinnerDateTime);
    const completionTime = new Date(dinnerDate.getTime() + (1.5 * 60 * 60 * 1000)); // Add 1.5 hours
    const now = new Date();
    const delay = completionTime.getTime() - now.getTime();
    
    // If completion time has already passed, complete immediately
    if (delay <= 0) {
      logger.info(`Dinner ${dinnerId} completion time has passed, completing booking ${bookingId} immediately`);
      this.completeBooking(bookingId);
      return;
    }
    
    // Cancel any existing scheduled job for this booking
    this.cancelScheduledCompletion(bookingId);
    
    // Schedule the completion
    const timeoutId = setTimeout(() => {
      this.completeBooking(bookingId);
      this.scheduledJobs.delete(bookingId);
    }, delay);
    
    this.scheduledJobs.set(bookingId, timeoutId);
    logger.info(`Scheduled booking ${bookingId} to complete at ${completionTime.toISOString()} (in ${Math.round(delay / 60000)} minutes)`);
  }
  
  /**
   * Cancel a scheduled completion
   */
  static cancelScheduledCompletion(bookingId: string): void {
    const timeoutId = this.scheduledJobs.get(bookingId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledJobs.delete(bookingId);
      logger.info(`Cancelled scheduled completion for booking ${bookingId}`);
    }
  }
  
  /**
   * Complete a specific booking
   */
  private static async completeBooking(bookingId: string): Promise<void> {
    try {
      const { data, error } = await supabaseService
        .from('dinner_bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('status', 'attended') // Only complete if still in attended status
        .select()
        .single();
      
      if (error) {
        logger.error(`Error completing booking ${bookingId}:`, error);
        return;
      }
      
      if (data) {
        logger.info(`✅ Auto-completed booking ${bookingId}`);
        
        // TODO: Send push notification to prompt post-dinner survey
        // This will be handled by the notification service
      }
    } catch (error) {
      logger.error(`Error in auto-completion for booking ${bookingId}:`, error);
    }
  }
  
  /**
   * Initialize scheduler and schedule all pending completions on startup
   */
  static async initialize(): Promise<void> {
    try {
      logger.info('Initializing booking completion scheduler...');
      
      // Find all bookings that are in 'attended' status
      const { data: attendedBookings, error } = await supabaseService
        .from('dinner_bookings')
        .select(`
          id,
          dinner_id,
          dinners!inner(
            id,
            datetime
          )
        `)
        .eq('status', 'attended');
      
      if (error) {
        logger.error('Error fetching attended bookings:', error);
        return;
      }
      
      if (!attendedBookings || attendedBookings.length === 0) {
        logger.info('No attended bookings to schedule');
        return;
      }
      
      // Schedule completion for each attended booking
      for (const booking of attendedBookings) {
        if (booking.dinners?.datetime) {
          this.scheduleCompletion(
            booking.id,
            booking.dinner_id,
            booking.dinners.datetime
          );
        }
      }
      
      logger.info(`✅ Scheduled ${attendedBookings.length} bookings for auto-completion`);
    } catch (error) {
      logger.error('Error initializing booking completion scheduler:', error);
    }
  }
  
  /**
   * Clean up all scheduled jobs
   */
  static stop(): void {
    for (const [_bookingId, timeoutId] of this.scheduledJobs) {
      clearTimeout(timeoutId);
    }
    this.scheduledJobs.clear();
    logger.info('Booking completion scheduler stopped');
  }
}

// Rename export for backward compatibility
export const BookingCompletionJob = BookingCompletionScheduler;