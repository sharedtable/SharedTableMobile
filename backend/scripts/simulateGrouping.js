import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateGrouping() {
  console.log('Starting grouping simulation...');

  try {
    // 1. Get all pending signups for future time slots
    const _now = new Date();
    const { data: pendingSignups, error: signupsError } = await supabase
      .from('slot_signups')
      .select(`
        *,
        time_slot:time_slots(*),
        user:users(id, email, first_name, last_name, display_name)
      `)
      .eq('status', 'pending')
      .order('time_slot_id');

    if (signupsError) {
      console.error('Error fetching signups:', signupsError);
      return;
    }

    console.log(`Found ${pendingSignups?.length || 0} pending signups`);

    if (!pendingSignups || pendingSignups.length === 0) {
      console.log('No pending signups to group');
      return;
    }

    // Group signups by time slot
    const signupsBySlot = pendingSignups.reduce((acc, signup) => {
      if (!acc[signup.time_slot_id]) {
        acc[signup.time_slot_id] = [];
      }
      acc[signup.time_slot_id].push(signup);
      return acc;
    }, {});

    console.log(`Processing ${Object.keys(signupsBySlot).length} time slots`);

    // Process each time slot
    for (const [timeSlotId, signups] of Object.entries(signupsBySlot)) {
      console.log(`\nProcessing time slot ${timeSlotId} with ${signups.length} signups`);
      
      const timeSlot = signups[0].time_slot;
      
      // Create groups based on dinner type
      const dinnerType = timeSlot.dinner_type || 'regular';
      const groups = [];
      let remainingSignups = [...signups];
      
      if (dinnerType === 'singles') {
        // Singles dinner: exactly 2 people per group
        while (remainingSignups.length >= 2) {
          groups.push(remainingSignups.splice(0, 2));
        }
        if (remainingSignups.length > 0) {
          console.log(`  ${remainingSignups.length} person(s) left without a match for singles dinner`);
        }
      } else {
        // Regular dinner: 4-6 people per group
        while (remainingSignups.length >= 4) {
          const groupSize = remainingSignups.length >= 6 ? 5 : Math.min(remainingSignups.length, 6);
          groups.push(remainingSignups.splice(0, groupSize));
        }
        if (remainingSignups.length > 0) {
          console.log(`  ${remainingSignups.length} person(s) couldn't form a group (need at least 4)`);
        }
      }

      console.log(`Created ${groups.length} groups for time slot ${timeSlotId}`);

      // Sample restaurants for assignment
      const restaurants = [
        { name: 'The Garden Table', address: '123 Main St, Palo Alto, CA' },
        { name: 'Nola Restaurant', address: '535 Ramona St, Palo Alto, CA' },
        { name: 'Tamarine Restaurant', address: '546 University Ave, Palo Alto, CA' },
        { name: 'Evvia Estiatorio', address: '420 Emerson St, Palo Alto, CA' },
        { name: 'Oren\'s Hummus', address: '261 University Ave, Palo Alto, CA' },
        { name: 'Coupa Cafe', address: '419 Ramona St, Palo Alto, CA' },
      ];

      // Create dinner groups in database
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const groupSignups = groups[groupIndex];
        const restaurant = restaurants[groupIndex % restaurants.length];

        // Create dinner group
        const { data: dinnerGroup, error: groupError } = await supabase
          .from('dinner_groups')
          .insert({
            time_slot_id: timeSlotId,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address,
            restaurant_cuisine: 'Mixed',
            reservation_time: timeSlot.slot_time,
            reservation_date: timeSlot.slot_date,
            group_size: groupSignups.length,
            status: 'confirmed',
          })
          .select()
          .single();

        if (groupError) {
          console.error(`Error creating dinner group:`, groupError);
          continue;
        }

        console.log(`Created dinner group ${dinnerGroup.id} at ${restaurant.name}`);

        // Add members to the group
        const groupMembers = groupSignups.map(signup => ({
          dinner_group_id: dinnerGroup.id,
          user_id: signup.user_id,
          signup_id: signup.id,
          status: 'assigned',
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(groupMembers);

        if (membersError) {
          console.error(`Error adding group members:`, membersError);
          continue;
        }

        // Update signups status to 'grouped'
        const signupIds = groupSignups.map(s => s.id);
        const { error: updateError } = await supabase
          .from('slot_signups')
          .update({ 
            status: 'grouped',
          })
          .in('id', signupIds);

        if (updateError) {
          console.error(`Error updating signup status:`, updateError);
          continue;
        }

        console.log(`Updated ${groupSignups.length} signups to 'grouped' status`);
      }
    }

    // Update time slots status to 'grouped'
    const groupedSlotIds = Object.keys(signupsBySlot);
    const { error: slotsUpdateError } = await supabase
      .from('time_slots')
      .update({ 
        status: 'grouped',
        updated_at: new Date().toISOString(),
      })
      .in('id', groupedSlotIds);

    if (slotsUpdateError) {
      console.error('Error updating time slots status:', slotsUpdateError);
    } else {
      console.log(`\nUpdated ${groupedSlotIds.length} time slots to 'grouped' status`);
    }

    console.log('\nGrouping simulation completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the simulation
simulateGrouping();