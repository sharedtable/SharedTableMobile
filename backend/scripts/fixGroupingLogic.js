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

// Correct group size rules
const GROUP_RULES = {
  singles: {
    min: 2,
    max: 2,
    ideal: 2,
    description: '1-on-1 dinner for singles/dating'
  },
  regular: {
    min: 4,
    max: 6,
    ideal: 5,
    description: 'Group social dining'
  }
};

async function fixGrouping() {
  console.log('🔧 Fixing grouping logic with correct rules...\n');
  console.log('Rules:');
  console.log('  Singles Dinner: 2 people (1-on-1)');
  console.log('  Regular Dinner: 4-6 people (group dining)\n');

  try {
    // 1. Clear existing incorrect groups
    console.log('Step 1: Cleaning up existing groups...');
    
    // Reset all grouped signups back to pending
    const { error: resetError } = await supabase
      .from('slot_signups')
      .update({ status: 'pending' })
      .eq('status', 'grouped');
    
    if (resetError) {
      console.error('Error resetting signups:', resetError);
    }

    // Delete existing group members
    const { error: deleteMembersError } = await supabase
      .from('group_members')
      .delete()
      .gte('created_at', '2020-01-01');
    
    if (deleteMembersError) {
      console.error('Error deleting group members:', deleteMembersError);
    }

    // Delete existing dinner groups
    const { error: deleteGroupsError } = await supabase
      .from('dinner_groups')
      .delete()
      .gte('created_at', '2020-01-01');
    
    if (deleteGroupsError) {
      console.error('Error deleting dinner groups:', deleteGroupsError);
    }

    console.log('✅ Cleaned up existing groups\n');

    // 2. Get all pending signups grouped by time slot and dinner type
    console.log('Step 2: Fetching signups...');
    const { data: signups, error: signupsError } = await supabase
      .from('slot_signups')
      .select(`
        *,
        time_slot:time_slots(*),
        user:users(id, email, first_name, last_name, display_name)
      `)
      .eq('status', 'pending')
      .order('time_slot_id');

    if (signupsError || !signups) {
      console.error('Error fetching signups:', signupsError);
      return;
    }

    console.log(`Found ${signups.length} pending signups\n`);

    // Group signups by time slot
    const signupsBySlot = signups.reduce((acc, signup) => {
      const key = signup.time_slot_id;
      if (!acc[key]) {
        acc[key] = {
          timeSlot: signup.time_slot,
          signups: []
        };
      }
      acc[key].signups.push(signup);
      return acc;
    }, {});

    // Sample restaurants
    const restaurants = [
      { name: 'The Garden Table', address: '123 Main St, Palo Alto, CA' },
      { name: 'Nola Restaurant', address: '535 Ramona St, Palo Alto, CA' },
      { name: 'Tamarine Restaurant', address: '546 University Ave, Palo Alto, CA' },
      { name: 'Evvia Estiatorio', address: '420 Emerson St, Palo Alto, CA' },
      { name: 'Oren\'s Hummus', address: '261 University Ave, Palo Alto, CA' },
      { name: 'Coupa Cafe', address: '419 Ramona St, Palo Alto, CA' },
    ];

    // 3. Create groups with correct sizes
    console.log('Step 3: Creating properly sized groups...\n');
    
    for (const [timeSlotId, slotData] of Object.entries(signupsBySlot)) {
      const { timeSlot, signups } = slotData;
      const dinnerType = timeSlot.dinner_type || 'regular';
      const rules = GROUP_RULES[dinnerType];
      
      console.log(`Processing ${dinnerType} dinner on ${timeSlot.slot_date} with ${signups.length} signups`);
      console.log(`  Required group size: ${rules.min}-${rules.max} people`);

      const groups = [];
      let remainingSignups = [...signups];

      // Create groups based on dinner type
      if (dinnerType === 'singles') {
        // Singles: Create pairs (2 people each)
        while (remainingSignups.length >= 2) {
          groups.push(remainingSignups.splice(0, 2));
        }
      } else {
        // Regular: Create groups of 4-6 people
        while (remainingSignups.length >= rules.min) {
          const groupSize = remainingSignups.length >= rules.max 
            ? rules.ideal 
            : Math.min(remainingSignups.length, rules.max);
          groups.push(remainingSignups.splice(0, groupSize));
        }
      }

      console.log(`  Created ${groups.length} groups`);
      if (remainingSignups.length > 0) {
        console.log(`  ⚠️  ${remainingSignups.length} people couldn't be grouped (not enough for minimum size)`);
      }

      // Create dinner groups in database
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const restaurant = restaurants[i % restaurants.length];

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
            group_size: group.length,
            status: 'confirmed',
          })
          .select()
          .single();

        if (groupError) {
          console.error('Error creating dinner group:', groupError);
          continue;
        }

        // Add members to the group
        const groupMembers = group.map(signup => ({
          dinner_group_id: dinnerGroup.id,
          user_id: signup.user_id,
          signup_id: signup.id,
          status: 'assigned',
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(groupMembers);

        if (membersError) {
          console.error('Error adding group members:', membersError);
          continue;
        }

        // Update signups status to 'grouped'
        const signupIds = group.map(s => s.id);
        const { error: updateError } = await supabase
          .from('slot_signups')
          .update({ status: 'grouped' })
          .in('id', signupIds);

        if (updateError) {
          console.error('Error updating signup status:', updateError);
        }

        const memberNames = group.map(s => s.user?.display_name || s.user?.email).join(', ');
        console.log(`    ✅ Group ${i + 1}: ${group.length} people at ${restaurant.name}`);
        console.log(`       Members: ${memberNames}`);
      }
    }

    // 4. Update time slots status
    const groupedSlotIds = Object.keys(signupsBySlot);
    if (groupedSlotIds.length > 0) {
      const { error: slotsUpdateError } = await supabase
        .from('time_slots')
        .update({ 
          status: 'grouped',
          updated_at: new Date().toISOString(),
        })
        .in('id', groupedSlotIds);

      if (slotsUpdateError) {
        console.error('Error updating time slots status:', slotsUpdateError);
      }
    }

    console.log('\n✅ Grouping logic fixed successfully!');
    console.log('Singles dinners now have 2 people each');
    console.log('Regular dinners now have 4-6 people each');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixGrouping();