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

async function createTestSignups() {
  console.log('Creating test signups...');

  try {
    // Get available time slots
    const { data: timeSlots, error: slotsError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('status', 'open')
      .limit(2);

    if (slotsError || !timeSlots || timeSlots.length === 0) {
      console.error('No open time slots found:', slotsError);
      return;
    }

    console.log(`Found ${timeSlots.length} open time slots`);

    // Create test users if they don't exist
    const testUsers = [
      { email: 'test1@stanford.edu', first_name: 'Alice', last_name: 'Johnson', external_auth_id: 'test_user_1' },
      { email: 'test2@stanford.edu', first_name: 'Bob', last_name: 'Smith', external_auth_id: 'test_user_2' },
      { email: 'test3@stanford.edu', first_name: 'Carol', last_name: 'Davis', external_auth_id: 'test_user_3' },
      { email: 'test4@stanford.edu', first_name: 'David', last_name: 'Wilson', external_auth_id: 'test_user_4' },
      { email: 'test5@stanford.edu', first_name: 'Emma', last_name: 'Brown', external_auth_id: 'test_user_5' },
      { email: 'test6@stanford.edu', first_name: 'Frank', last_name: 'Miller', external_auth_id: 'test_user_6' },
      { email: 'test7@stanford.edu', first_name: 'Grace', last_name: 'Lee', external_auth_id: 'test_user_7' },
      { email: 'test8@stanford.edu', first_name: 'Henry', last_name: 'Taylor', external_auth_id: 'test_user_8' },
    ];

    const userIds = [];
    
    for (const testUser of testUsers) {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', testUser.email)
        .single();

      if (existing) {
        userIds.push(existing.id);
        console.log(`User ${testUser.email} already exists`);
      } else {
        // Create user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: testUser.email,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            display_name: `${testUser.first_name} ${testUser.last_name}`,
            external_auth_id: testUser.external_auth_id,
            auth_provider: 'email',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (userError) {
          console.error(`Error creating user ${testUser.email}:`, userError);
        } else {
          userIds.push(newUser.id);
          console.log(`Created user ${testUser.email}`);
        }
      }
    }

    // Create signups for the first time slot
    const timeSlot = timeSlots[0];
    const signupsToCreate = [];

    for (let i = 0; i < Math.min(6, userIds.length); i++) {
      // Check if signup already exists
      const { data: existing } = await supabase
        .from('slot_signups')
        .select('id')
        .eq('time_slot_id', timeSlot.id)
        .eq('user_id', userIds[i])
        .single();

      if (!existing) {
        signupsToCreate.push({
          time_slot_id: timeSlot.id,
          user_id: userIds[i],
          status: 'pending',
          dietary_restrictions: i % 3 === 0 ? 'Vegetarian' : null,
          preferences: i % 2 === 0 ? 'Quiet table preferred' : null,
          signed_up_at: new Date().toISOString(),
        });
      }
    }

    if (signupsToCreate.length > 0) {
      const { data: signups, error: signupError } = await supabase
        .from('slot_signups')
        .insert(signupsToCreate)
        .select();

      if (signupError) {
        console.error('Error creating signups:', signupError);
      } else {
        console.log(`Created ${signups.length} test signups for time slot ${timeSlot.id}`);
      }

      // Update the slot's current_signups count
      const { error: updateError } = await supabase
        .from('time_slots')
        .update({ 
          current_signups: timeSlot.current_signups + signupsToCreate.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timeSlot.id);

      if (updateError) {
        console.error('Error updating signup count:', updateError);
      }
    } else {
      console.log('All test users already signed up for this slot');
    }

    console.log('\nTest signups created successfully!');
    console.log('You can now run the grouping simulation.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createTestSignups();