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

async function createAug29RegularDinner() {
  console.log('📅 Creating August 29 Regular Dinner with proper grouping...\n');

  try {
    // 1. Find or create Aug 29 time slot
    let timeSlotId;
    const aug29Date = '2025-08-29';
    
    const { data: existingSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('slot_date', aug29Date)
      .eq('dinner_type', 'regular')
      .single();

    if (existingSlot) {
      timeSlotId = existingSlot.id;
      console.log('Found existing Aug 29 regular dinner slot');
    } else {
      // Create new time slot for Aug 29
      const { data: newSlot, error: slotError } = await supabase
        .from('time_slots')
        .insert({
          slot_date: aug29Date,
          slot_time: '19:00:00',
          day_of_week: 'Friday',
          max_signups: 30,
          current_signups: 5,
          status: 'open',
          dinner_type: 'regular', // Regular dinner (4-6 people)
        })
        .select()
        .single();

      if (slotError) {
        console.error('Error creating time slot:', slotError);
        return;
      }
      
      timeSlotId = newSlot.id;
      console.log('✅ Created Aug 29 regular dinner time slot');
    }

    // 2. Get Gary's user account
    const { data: garyUser, error: garyError } = await supabase
      .from('users')
      .select('*')
      .or('email.ilike.%garyxuejingzhou%,external_auth_id.ilike.%garyxuejingzhou%,email.ilike.%jingzhou%')
      .single();

    if (garyError || !garyUser) {
      console.error('Could not find Gary/Jingzhou user:', garyError);
      return;
    }

    console.log(`Found user: ${garyUser.display_name || garyUser.email}`);

    // 3. Create or get other users for the group (need 4-6 total for regular dinner)
    const groupMembers = [
      { email: 'sarah.chen@stanford.edu', first_name: 'Sarah', last_name: 'Chen', external_auth_id: 'aug29_user_1' },
      { email: 'michael.park@stanford.edu', first_name: 'Michael', last_name: 'Park', external_auth_id: 'aug29_user_2' },
      { email: 'jennifer.wu@stanford.edu', first_name: 'Jennifer', last_name: 'Wu', external_auth_id: 'aug29_user_3' },
      { email: 'alex.thompson@stanford.edu', first_name: 'Alex', last_name: 'Thompson', external_auth_id: 'aug29_user_4' },
    ];

    const userIds = [garyUser.id]; // Start with Gary
    
    console.log('\nCreating group members for regular dinner (5 people total):');
    console.log(`  1. ${garyUser.display_name || garyUser.email} (you)`);
    
    for (let i = 0; i < groupMembers.length; i++) {
      const member = groupMembers[i];
      
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, display_name, email')
        .eq('email', member.email)
        .single();

      if (existing) {
        userIds.push(existing.id);
        console.log(`  ${i + 2}. ${existing.display_name || existing.email} (existing)`);
      } else {
        // Create user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            display_name: `${member.first_name} ${member.last_name}`,
            external_auth_id: member.external_auth_id,
            auth_provider: 'email',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (userError) {
          console.error(`Error creating user ${member.email}:`, userError);
          continue;
        }
        
        userIds.push(newUser.id);
        console.log(`  ${i + 2}. ${member.first_name} ${member.last_name} (created)`);
      }
    }

    console.log(`\nGroup size: ${userIds.length} people (perfect for regular dinner!)`);

    // 4. Create signups for all members
    console.log('\nCreating signups...');
    const signupIds = [];
    
    for (const userId of userIds) {
      // Check if signup already exists
      const { data: existingSignup } = await supabase
        .from('slot_signups')
        .select('*')
        .eq('time_slot_id', timeSlotId)
        .eq('user_id', userId)
        .single();

      if (existingSignup) {
        signupIds.push(existingSignup.id);
        // Reset to pending if it was cancelled
        if (existingSignup.status === 'cancelled') {
          await supabase
            .from('slot_signups')
            .update({ status: 'pending' })
            .eq('id', existingSignup.id);
        }
      } else {
        // Create new signup
        const { data: newSignup, error: signupError } = await supabase
          .from('slot_signups')
          .insert({
            time_slot_id: timeSlotId,
            user_id: userId,
            status: 'pending',
            dietary_restrictions: userId === garyUser.id ? 'None' : null,
            preferences: null,
          })
          .select()
          .single();

        if (signupError) {
          console.error('Error creating signup:', signupError);
          continue;
        }
        
        signupIds.push(newSignup.id);
      }
    }

    // 5. Create the dinner group
    console.log('\nCreating dinner group...');
    
    const restaurant = {
      name: 'Evvia Estiatorio',
      address: '420 Emerson St, Palo Alto, CA',
      cuisine: 'Mediterranean'
    };

    const { data: dinnerGroup, error: groupError } = await supabase
      .from('dinner_groups')
      .insert({
        time_slot_id: timeSlotId,
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        restaurant_cuisine: restaurant.cuisine,
        reservation_time: '19:00:00',
        reservation_date: aug29Date,
        group_size: userIds.length,
        status: 'confirmed',
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating dinner group:', groupError);
      return;
    }

    console.log(`✅ Created dinner group at ${restaurant.name}`);

    // 6. Add all members to the group
    const memberInserts = userIds.map((userId, index) => ({
      dinner_group_id: dinnerGroup.id,
      user_id: userId,
      signup_id: signupIds[index],
      status: 'assigned',
    }));

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('Error adding group members:', membersError);
      return;
    }

    // 7. Update all signups to 'grouped' status
    const { error: updateError } = await supabase
      .from('slot_signups')
      .update({ status: 'grouped' })
      .in('id', signupIds);

    if (updateError) {
      console.error('Error updating signup status:', updateError);
    }

    // 8. Update time slot status
    await supabase
      .from('time_slots')
      .update({ 
        status: 'grouped',
        current_signups: userIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeSlotId);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! August 29 Regular Dinner Group Created');
    console.log('='.repeat(60));
    console.log('\n📋 Group Details:');
    console.log(`  Date: Friday, August 29, 2025`);
    console.log(`  Time: 7:00 PM`);
    console.log(`  Type: Regular Dinner (group social dining)`);
    console.log(`  Restaurant: ${restaurant.name}`);
    console.log(`  Address: ${restaurant.address}`);
    console.log(`  Cuisine: ${restaurant.cuisine}`);
    console.log(`  Group Size: ${userIds.length} people`);
    console.log('\n👥 Your Dinner Companions:');
    console.log('  1. You (Jingzhou Xue)');
    console.log('  2. Sarah Chen');
    console.log('  3. Michael Park');
    console.log('  4. Jennifer Wu');
    console.log('  5. Alex Thompson');
    console.log('\n📱 Check your Profile screen to see this reservation!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createAug29RegularDinner();