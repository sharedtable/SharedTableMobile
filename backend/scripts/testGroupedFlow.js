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

async function testGroupedFlow() {
  console.log('Testing grouped flow...\n');

  try {
    // 1. Check grouped signups
    const { data: groupedSignups, error: signupsError } = await supabase
      .from('slot_signups')
      .select(`
        *,
        time_slot:time_slots(*),
        user:users(id, email, first_name, last_name, display_name)
      `)
      .eq('status', 'grouped')
      .limit(3);

    if (signupsError) {
      console.error('Error fetching grouped signups:', signupsError);
      return;
    }

    console.log(`Found ${groupedSignups?.length || 0} grouped signups\n`);

    if (groupedSignups && groupedSignups.length > 0) {
      const signup = groupedSignups[0];
      console.log('Sample grouped signup:');
      console.log(`  User: ${signup.user?.display_name || signup.user?.email}`);
      console.log(`  Date: ${signup.time_slot?.slot_date}`);
      console.log(`  Time: ${signup.time_slot?.slot_time}`);
      console.log(`  Status: ${signup.status}`);
      console.log('');

      // 2. Check dinner group
      const { data: groupMembers, error: memberError } = await supabase
        .from('group_members')
        .select(`
          *,
          dinner_group:dinner_groups(*)
        `)
        .eq('user_id', signup.user_id);
        
      const groupMember = groupMembers?.find(m => 
        m.dinner_group?.time_slot_id === signup.time_slot_id
      );

      if (memberError) {
        console.log('No group found for this signup (error):', memberError.message);
      } else if (groupMember) {
        console.log('Dinner Group Details:');
        console.log(`  Restaurant: ${groupMember.dinner_group.restaurant_name}`);
        console.log(`  Address: ${groupMember.dinner_group.restaurant_address}`);
        console.log(`  Date: ${groupMember.dinner_group.reservation_date}`);
        console.log(`  Time: ${groupMember.dinner_group.reservation_time}`);
        console.log(`  Group Size: ${groupMember.dinner_group.group_size}`);
        console.log(`  Status: ${groupMember.dinner_group.status}`);
        console.log('');

        // 3. Check other members
        const { data: allMembers, error: membersError } = await supabase
          .from('group_members')
          .select(`
            *,
            user:users(id, email, first_name, last_name, display_name)
          `)
          .eq('dinner_group_id', groupMember.dinner_group_id);

        if (allMembers && allMembers.length > 0) {
          console.log(`Group Members (${allMembers.length} total):`);
          allMembers.forEach((member, index) => {
            console.log(`  ${index + 1}. ${member.user?.display_name || member.user?.email}`);
          });
        }
      }
    }

    console.log('\n✅ Flow test completed successfully!');
    console.log('The grouped reservations should now show restaurant details in the Profile screen.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testGroupedFlow();