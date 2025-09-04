import express, { Request, Response } from 'express';
import { supabaseService } from '../../config/supabase';
import { logger } from '../../utils/logger';

const router = express.Router();

// Mock restaurant data - in production, this would come from a database
const RESTAURANTS = [
  { name: 'The French Laundry', address: '6640 Washington St, Yountville, CA', cuisine: 'French' },
  { name: 'Chez Panisse', address: '1517 Shattuck Ave, Berkeley, CA', cuisine: 'Californian' },
  { name: 'State Bird Provisions', address: '1529 Fillmore St, San Francisco, CA', cuisine: 'American' },
  { name: 'Tartine Bakery', address: '600 Guerrero St, San Francisco, CA', cuisine: 'Bakery/Cafe' },
  { name: 'Swan Oyster Depot', address: '1517 Polk St, San Francisco, CA', cuisine: 'Seafood' },
  { name: 'House of Prime Rib', address: '1906 Van Ness Ave, San Francisco, CA', cuisine: 'American' },
  { name: 'Nopa', address: '560 Divisadero St, San Francisco, CA', cuisine: 'Californian' },
  { name: 'Zuni Cafe', address: '1658 Market St, San Francisco, CA', cuisine: 'Mediterranean' },
];

// Grouping algorithm - groups users into parties of 4-6
function createGroups(users: any[], minSize = 4, maxSize = 6): any[][] {
  const shuffled = [...users].sort(() => Math.random() - 0.5);
  const groups: any[][] = [];
  
  let i = 0;
  while (i < shuffled.length) {
    const remaining = shuffled.length - i;
    
    if (remaining <= maxSize) {
      // Last group
      if (remaining >= minSize) {
        groups.push(shuffled.slice(i));
      } else if (groups.length > 0) {
        // Add remaining users to the last group if it won't exceed maxSize
        const lastGroup = groups[groups.length - 1];
        if (lastGroup.length + remaining <= maxSize) {
          lastGroup.push(...shuffled.slice(i));
        } else {
          // Try to redistribute
          groups.push(shuffled.slice(i));
        }
      }
      break;
    } else {
      // Create a group of optimal size
      const groupSize = remaining >= minSize * 2 ? maxSize : minSize;
      groups.push(shuffled.slice(i, i + groupSize));
      i += groupSize;
    }
  }
  
  // Filter out groups that are too small
  return groups.filter(group => group.length >= minSize);
}

// Admin endpoint to trigger grouping for a time slot
// In production, this would be called by a scheduled job 24 hours before the dinner
router.post('/group-timeslot/:timeSlotId', async (req: Request, res: Response) => {
  try {
    const { timeSlotId } = req.params;
    
    // TODO: Add admin authentication here
    
    // Get the time slot
    const { data: timeSlot, error: slotError } = await supabaseService
      .from('timeslots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found',
      });
    }

    if (timeSlot.status === 'grouped') {
      return res.status(400).json({
        success: false,
        error: 'Time slot has already been grouped',
      });
    }

    // Get all signups for this time slot
    const { data: signups, error: signupsError } = await supabaseService
      .from('dinner_bookings')
      .select(`
        *,
        user:users(*)
      `)
      .eq('timeslot_id', timeSlotId)
      .eq('status', 'pending');

    if (signupsError) {
      logger.error('Error fetching signups:', signupsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch signups',
      });
    }

    if (!signups || signups.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No signups found for this time slot',
      });
    }

    // Create groups
    const groups = createGroups(signups);
    
    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Not enough signups to form groups',
      });
    }

    // Assign restaurants to groups (round-robin for now)
    const createdGroups = [];
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const restaurant = RESTAURANTS[i % RESTAURANTS.length];
      
      // Create dinner group
      const { data: dinnerGroup, error: groupError } = await supabaseService
        .from('dinner_groups')
        .insert({
          slot_id: timeSlotId,
          restaurant_name: restaurant.name,
          restaurant_address: restaurant.address,
          restaurant_cuisine: restaurant.cuisine,
          reservation_date: timeSlot.datetime ? new Date(timeSlot.datetime).toISOString().split('T')[0] : null,
          reservation_time: timeSlot.datetime ? new Date(timeSlot.datetime).toTimeString().split(' ')[0] : null,
          group_size: group.length,
          status: 'confirmed',
        })
        .select()
        .single();

      if (groupError) {
        logger.error('Error creating dinner group:', groupError);
        continue;
      }

      // Add members to the group
      const memberInserts = group.map(signup => ({
        dinner_group_id: dinnerGroup.id,
        user_id: signup.user_id,
        signup_id: signup.id,
        status: 'assigned',
      }));

      const { error: membersError } = await supabaseService
        .from('group_members')
        .insert(memberInserts);

      if (membersError) {
        logger.error('Error adding group members:', membersError);
      }

      // Update signup status to 'grouped'
      const signupIds = group.map(s => s.id);
      const { error: updateError } = await supabaseService
        .from('dinner_bookings')
        .update({ status: 'grouped' })
        .in('id', signupIds);

      if (updateError) {
        logger.error('Error updating signup status:', updateError);
      }

      createdGroups.push({
        group: dinnerGroup,
        members: group.length,
      });
    }

    // Update time slot status
    const { error: slotUpdateError } = await supabaseService
      .from('timeslots')
      .update({ 
        status: 'grouped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeSlotId);

    if (slotUpdateError) {
      logger.error('Error updating time slot status:', slotUpdateError);
    }

    // TODO: Trigger notifications to users about their group assignments

    return res.json({
      success: true,
      data: {
        totalSignups: signups.length,
        groupsCreated: createdGroups.length,
        groups: createdGroups,
      },
      message: `Successfully created ${createdGroups.length} dinner groups`,
    });
  } catch (error) {
    logger.error('Error in grouping algorithm:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get grouping status for a time slot
router.get('/status/:timeSlotId', async (req: Request, res: Response) => {
  try {
    const { timeSlotId } = req.params;
    
    // Get time slot info
    const { data: timeSlot, error: slotError } = await supabaseService
      .from('timeslots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found',
      });
    }

    // Get groups if they exist
    const { data: groups, error: groupsError } = await supabaseService
      .from('dinner_groups')
      .select(`
        *,
        members:group_members(count)
      `)
      .eq('slot_id', timeSlotId);

    if (groupsError) {
      logger.error('Error fetching groups:', groupsError);
    }

    return res.json({
      success: true,
      data: {
        timeSlot,
        groups: groups || [],
        isGrouped: timeSlot.status === 'grouped',
      },
    });
  } catch (error) {
    logger.error('Error in grouping status endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;