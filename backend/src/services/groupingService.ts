import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface Booking {
  id: string;
  user_id: string;
  linked_booking_id?: string;
  is_linked_booking?: boolean;
  user?: User;
}

interface LinkedBookingPair {
  bookings: Booking[];
  userIds: Set<string>;
}

interface Group {
  id?: string;
  users: User[];
  bookingIds: string[];
  restaurant?: any;
  tableNumber?: number;
}

/**
 * Enhanced grouping service that ensures linked bookings (inviter + invitee) 
 * are always placed in the same group
 */
export class GroupingService {
  private minGroupSize: number;
  private maxGroupSize: number;

  constructor(minSize = 4, maxSize = 6) {
    this.minGroupSize = minSize;
    this.maxGroupSize = maxSize;
  }

  /**
   * Main grouping function that handles linked bookings
   */
  async createGroupsForTimeSlot(timeSlotId: string): Promise<Group[]> {
    try {
      // Fetch all confirmed bookings for the time slot
      const { data: bookings, error } = await supabaseService
        .from('dinner_bookings')
        .select(`
          *,
          user:users(*)
        `)
        .eq('dinner_id', timeSlotId)
        .eq('status', 'confirmed');

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      if (!bookings || bookings.length === 0) {
        logger.info('No bookings found for time slot:', timeSlotId);
        return [];
      }

      // Process linked bookings
      const { linkedPairs, standaloneBookings } = this.processLinkedBookings(bookings);
      
      // Create groups with linked pairs kept together
      const groups = this.createOptimalGroups(linkedPairs, standaloneBookings);
      
      return groups;
    } catch (error) {
      logger.error('Error creating groups:', error);
      throw error;
    }
  }

  /**
   * Identify and process linked bookings (friend invitations)
   */
  private processLinkedBookings(bookings: Booking[]): {
    linkedPairs: LinkedBookingPair[];
    standaloneBookings: Booking[];
  } {
    const linkedPairs: LinkedBookingPair[] = [];
    const processedBookingIds = new Set<string>();
    const standaloneBookings: Booking[] = [];

    // Create a map for quick lookup
    const bookingMap = new Map<string, Booking>();
    bookings.forEach(booking => {
      bookingMap.set(booking.id, booking);
    });

    // Identify linked pairs
    bookings.forEach(booking => {
      if (processedBookingIds.has(booking.id)) {
        return;
      }

      if (booking.linked_booking_id && booking.is_linked_booking) {
        const linkedBooking = bookingMap.get(booking.linked_booking_id);
        
        if (linkedBooking) {
          // Create a linked pair
          const pair: LinkedBookingPair = {
            bookings: [booking, linkedBooking],
            userIds: new Set([booking.user_id, linkedBooking.user_id])
          };
          
          linkedPairs.push(pair);
          processedBookingIds.add(booking.id);
          processedBookingIds.add(linkedBooking.id);
        } else {
          // Linked booking not found, treat as standalone
          standaloneBookings.push(booking);
          processedBookingIds.add(booking.id);
        }
      } else {
        // Not a linked booking
        standaloneBookings.push(booking);
        processedBookingIds.add(booking.id);
      }
    });

    return { linkedPairs, standaloneBookings };
  }

  /**
   * Create optimal groups ensuring linked pairs stay together
   */
  private createOptimalGroups(
    linkedPairs: LinkedBookingPair[],
    standaloneBookings: Booking[]
  ): Group[] {
    const groups: Group[] = [];
    
    // Shuffle standalone bookings for randomness
    const shuffledStandalone = [...standaloneBookings].sort(() => Math.random() - 0.5);
    
    // Start with linked pairs as group seeds
    const unassignedPairs = [...linkedPairs];
    const unassignedStandalone = [...shuffledStandalone];

    // First pass: Create groups starting with linked pairs
    while (unassignedPairs.length > 0) {
      const group: Group = {
        users: [],
        bookingIds: []
      };

      // Add a linked pair to start the group
      const pair = unassignedPairs.shift()!;
      pair.bookings.forEach(booking => {
        if (booking.user) {
          group.users.push(booking.user);
          group.bookingIds.push(booking.id);
        }
      });

      // Try to add more linked pairs if they fit
      let i = 0;
      while (i < unassignedPairs.length && group.users.length + 2 <= this.maxGroupSize) {
        const additionalPair = unassignedPairs[i];
        if (group.users.length + additionalPair.bookings.length <= this.maxGroupSize) {
          additionalPair.bookings.forEach(booking => {
            if (booking.user) {
              group.users.push(booking.user);
              group.bookingIds.push(booking.id);
            }
          });
          unassignedPairs.splice(i, 1);
        } else {
          i++;
        }
      }

      // Fill remaining spots with standalone users
      while (unassignedStandalone.length > 0 && group.users.length < this.maxGroupSize) {
        const booking = unassignedStandalone.shift()!;
        if (booking.user) {
          group.users.push(booking.user);
          group.bookingIds.push(booking.id);
        }
      }

      groups.push(group);
    }

    // Second pass: Group remaining standalone users
    while (unassignedStandalone.length > 0) {
      const remaining = unassignedStandalone.length;
      
      if (remaining < this.minGroupSize) {
        // Try to add to existing groups
        let distributed = false;
        for (const group of groups) {
          if (group.users.length + remaining <= this.maxGroupSize) {
            unassignedStandalone.forEach(booking => {
              if (booking.user) {
                group.users.push(booking.user);
                group.bookingIds.push(booking.id);
              }
            });
            unassignedStandalone.length = 0;
            distributed = true;
            break;
          }
        }
        
        if (!distributed && remaining >= 2) {
          // Create a small group if we can't distribute
          const group: Group = {
            users: [],
            bookingIds: []
          };
          
          unassignedStandalone.forEach(booking => {
            if (booking.user) {
              group.users.push(booking.user);
              group.bookingIds.push(booking.id);
            }
          });
          
          groups.push(group);
          unassignedStandalone.length = 0;
        }
        break;
      }

      // Create a new group
      const groupSize = Math.min(
        this.maxGroupSize,
        remaining >= this.minGroupSize * 2 ? this.maxGroupSize : this.minGroupSize
      );
      
      const group: Group = {
        users: [],
        bookingIds: []
      };
      
      for (let i = 0; i < groupSize && unassignedStandalone.length > 0; i++) {
        const booking = unassignedStandalone.shift()!;
        if (booking.user) {
          group.users.push(booking.user);
          group.bookingIds.push(booking.id);
        }
      }
      
      groups.push(group);
    }

    // Validate groups
    return groups.filter(group => {
      if (group.users.length < this.minGroupSize) {
        logger.warn(`Group too small (${group.users.length} users), minimum is ${this.minGroupSize}`);
        return false;
      }
      return true;
    });
  }

  /**
   * Save groups to database
   */
  async saveGroups(groups: Group[], timeSlotId: string, eventId: string): Promise<void> {
    try {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Create dinner party record
        const { data: dinnerParty, error: partyError } = await supabaseService
          .from('dinner_parties')
          .insert({
            event_id: eventId,
            party_number: i + 1,
            table_number: i + 1,
            size: group.users.length,
            status: 'confirmed'
          })
          .select()
          .single();

        if (partyError) {
          logger.error('Failed to create dinner party:', partyError);
          continue;
        }

        // Update bookings with party assignment
        for (const bookingId of group.bookingIds) {
          await supabaseService
            .from('dinner_bookings')
            .update({
              dinner_party_id: dinnerParty.id,
              status: 'grouped'
            })
            .eq('id', bookingId);
        }

        // Send notifications to users about their group assignment
        for (const user of group.users) {
          await this.sendGroupAssignmentNotification(user, dinnerParty, group);
        }
      }

      // Update time slot status
      await supabaseService
        .from('dinners')
        .update({ status: 'grouped' })
        .eq('id', timeSlotId);

    } catch (error) {
      logger.error('Error saving groups:', error);
      throw error;
    }
  }

  /**
   * Send notification to user about their group assignment
   */
  private async sendGroupAssignmentNotification(
    user: User,
    dinnerParty: any,
    group: Group
  ): Promise<void> {
    try {
      // Create in-app notification
      await supabaseService
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'group_assigned',
          title: 'Your dinner group is ready!',
          message: `You've been matched with ${group.users.length - 1} other people for your upcoming dinner.`,
          metadata: {
            dinner_party_id: dinnerParty.id,
            group_size: group.users.length,
            table_number: dinnerParty.table_number
          }
        });

      // TODO: Send push notification
      // TODO: Send email notification

    } catch (error) {
      logger.error('Failed to send group assignment notification:', error);
    }
  }

  /**
   * Validate that all linked bookings are in the same group
   * This is a safety check to ensure the algorithm worked correctly
   */
  async validateGrouping(timeSlotId: string): Promise<boolean> {
    try {
      const { data: bookings, error } = await supabaseService
        .from('dinner_bookings')
        .select(`
          id,
          user_id,
          linked_booking_id,
          is_linked_booking,
          dinner_party_id
        `)
        .eq('dinner_id', timeSlotId)
        .eq('status', 'grouped');

      if (error || !bookings) {
        return false;
      }

      // Check each linked booking pair
      for (const booking of bookings) {
        if (booking.linked_booking_id && booking.is_linked_booking) {
          const linkedBooking = bookings.find(b => b.id === booking.linked_booking_id);
          
          if (!linkedBooking) {
            logger.error(`Linked booking ${booking.linked_booking_id} not found`);
            return false;
          }
          
          if (booking.dinner_party_id !== linkedBooking.dinner_party_id) {
            logger.error(
              `Linked bookings ${booking.id} and ${linkedBooking.id} are in different groups!`
            );
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Error validating grouping:', error);
      return false;
    }
  }
}

// Export singleton instance
export const groupingService = new GroupingService();