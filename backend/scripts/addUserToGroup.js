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

async function addGaryToGroup() {
  console.log('Adding garyxuejingzhou to a dinner group...\n');

  try {
    // 1. Find Gary's user account
    const { data: garyUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .or('email.ilike.%garyxuejingzhou%,external_auth_id.ilike.%garyxuejingzhou%')
      .single();

    if (userError || !garyUser) {
      console.error('Could not find user garyxuejingzhou:', userError);
      console.log('Please make sure you are logged in with this account');
      return;
    }

    console.log(`Found user: ${garyUser.email || garyUser.display_name || garyUser.external_auth_id}`);
    console.log(`User ID: ${garyUser.id}\n`);

    // 2. Get an available time slot (preferably one with existing groups)
    const { data: existingGroup, error: groupError } = await supabase
      .from('dinner_groups')
      .select(`
        *,
        members:group_members(count)
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!existingGroup) {
      console.log('No existing groups found. Creating a new time slot and group...');
      
      // Create a new time slot for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: newSlot, error: slotError } = await supabase
        .from('time_slots')
        .insert({
          slot_date: tomorrow.toISOString().split('T')[0],
          slot_time: '19:00:00',
          day_of_week: 'Saturday',
          max_signups: 30,
          current_signups: 7,
          status: 'grouped',
          dinner_type: 'regular',
        })
        .select()
        .single();

      if (slotError) {
        console.error('Error creating time slot:', slotError);
        return;
      }

      // Create a dinner group
      const { data: newGroup, error: newGroupError } = await supabase
        .from('dinner_groups')
        .insert({
          time_slot_id: newSlot.id,
          restaurant_name: 'Nola Restaurant',
          restaurant_address: '535 Ramona St, Palo Alto, CA',
          restaurant_cuisine: 'Californian',
          reservation_time: newSlot.slot_time,
          reservation_date: newSlot.slot_date,
          group_size: 7,
          status: 'confirmed',
        })
        .select()
        .single();

      if (newGroupError) {
        console.error('Error creating dinner group:', newGroupError);
        return;
      }

      // Create Gary's signup
      const { data: garySignup, error: signupError } = await supabase
        .from('slot_signups')
        .insert({
          time_slot_id: newSlot.id,
          user_id: garyUser.id,
          status: 'grouped',
          dietary_restrictions: null,
          preferences: null,
        })
        .select()
        .single();

      if (signupError) {
        console.error('Error creating signup:', signupError);
        return;
      }

      // Add Gary to the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          dinner_group_id: newGroup.id,
          user_id: garyUser.id,
          signup_id: garySignup.id,
          status: 'assigned',
        });

      if (memberError) {
        console.error('Error adding to group:', memberError);
        return;
      }

      console.log('✅ Successfully created new group and added Gary!');
      console.log(`Group Details:`);
      console.log(`  Restaurant: ${newGroup.restaurant_name}`);
      console.log(`  Address: ${newGroup.restaurant_address}`);
      console.log(`  Date: ${newGroup.reservation_date}`);
      console.log(`  Time: ${newGroup.reservation_time}`);
      
    } else {
      // Use existing group and time slot
      console.log(`Found existing group at ${existingGroup.restaurant_name}`);
      
      // Check if Gary already has a signup for this time slot
      const { data: existingSignup } = await supabase
        .from('slot_signups')
        .select('*')
        .eq('time_slot_id', existingGroup.time_slot_id)
        .eq('user_id', garyUser.id)
        .single();

      let signupId;
      
      if (existingSignup) {
        console.log('Gary already has a signup for this time slot');
        signupId = existingSignup.id;
        
        // Update status to grouped
        await supabase
          .from('slot_signups')
          .update({ status: 'grouped' })
          .eq('id', signupId);
      } else {
        // Create Gary's signup
        const { data: newSignup, error: signupError } = await supabase
          .from('slot_signups')
          .insert({
            time_slot_id: existingGroup.time_slot_id,
            user_id: garyUser.id,
            status: 'grouped',
            dietary_restrictions: null,
            preferences: null,
          })
          .select()
          .single();

        if (signupError) {
          console.error('Error creating signup:', signupError);
          return;
        }
        signupId = newSignup.id;
      }

      // Check if Gary is already in the group
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('dinner_group_id', existingGroup.id)
        .eq('user_id', garyUser.id)
        .single();

      if (existingMember) {
        console.log('Gary is already in this group!');
      } else {
        // Add Gary to the group
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            dinner_group_id: existingGroup.id,
            user_id: garyUser.id,
            signup_id: signupId,
            status: 'assigned',
          });

        if (memberError) {
          console.error('Error adding to group:', memberError);
          return;
        }

        // Update group size
        await supabase
          .from('dinner_groups')
          .update({ group_size: existingGroup.group_size + 1 })
          .eq('id', existingGroup.id);
      }

      console.log('✅ Successfully added Gary to existing group!');
      console.log(`Group Details:`);
      console.log(`  Restaurant: ${existingGroup.restaurant_name}`);
      console.log(`  Address: ${existingGroup.restaurant_address}`);
      console.log(`  Date: ${existingGroup.reservation_date}`);
      console.log(`  Time: ${existingGroup.reservation_time}`);
    }

    // List all of Gary's grouped reservations
    console.log('\n📋 All of Gary\'s grouped reservations:');
    const { data: garySignups } = await supabase
      .from('slot_signups')
      .select(`
        *,
        time_slot:time_slots(*)
      `)
      .eq('user_id', garyUser.id)
      .eq('status', 'grouped');

    if (garySignups && garySignups.length > 0) {
      for (const signup of garySignups) {
        const { data: groupInfo } = await supabase
          .from('group_members')
          .select(`
            *,
            dinner_group:dinner_groups(*)
          `)
          .eq('user_id', garyUser.id)
          .eq('dinner_group.time_slot_id', signup.time_slot_id)
          .single();

        if (groupInfo?.dinner_group) {
          console.log(`  - ${signup.time_slot.slot_date} at ${signup.time_slot.slot_time}`);
          console.log(`    Restaurant: ${groupInfo.dinner_group.restaurant_name}`);
        }
      }
    }

    console.log('\n🎉 You should now see the "Matched" status in your Profile screen!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
addGaryToGroup();