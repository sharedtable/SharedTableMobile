/**
 * Script to create a time slot for next Friday and sign up all test users
 * This will create a realistic dinner event with all 20 test users + Gary's account
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Function to get next Friday's date
function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // 5 is Friday
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  return nextFriday;
}

// Format date for database
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function createFridayDinnerWithSignups() {
  console.log('🍽️  Creating Friday dinner time slot and signing up users...\n');

  try {
    // Get next Friday's date
    const nextFriday = getNextFriday();
    const dateStr = formatDate(nextFriday);
    
    console.log(`📅 Creating time slot for: ${dateStr} (${nextFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })})\n`);

    // Step 1: Create the time slot
    // Combine date and time for datetime field
    const dinnerDateTime = new Date(nextFriday);
    dinnerDateTime.setHours(19, 0, 0, 0); // 7:00 PM
    
    const timeSlotData = {
      datetime: dinnerDateTime.toISOString(),
      dinner_type: 'regular',
      city: 'san_francisco', // Using SF as it's the only valid enum value
      max_signups: 24, // Enough for all our test users
      current_signups: 0,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if time slot already exists
    const { data: existingSlot } = await supabase
      .from('timeslots')
      .select('id')
      .eq('datetime', dinnerDateTime.toISOString())
      .single();

    let timeSlotId;

    if (existingSlot) {
      console.log('⚠️  Time slot already exists, using existing one');
      timeSlotId = existingSlot.id;
      
      // Update the slot to ensure it has enough seats
      await supabase
        .from('timeslots')
        .update({
          max_signups: 24,
          status: 'open'
        })
        .eq('id', timeSlotId);
    } else {
      // Create new time slot
      const { data: newSlot, error: slotError } = await supabase
        .from('timeslots')
        .insert(timeSlotData)
        .select()
        .single();

      if (slotError) {
        console.error('❌ Error creating time slot:', slotError);
        return;
      }

      timeSlotId = newSlot.id;
      console.log(`✅ Time slot created successfully! ID: ${timeSlotId}\n`);
    }

    // Step 2: Get all test users + Gary's account
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, external_auth_id')
      .like('email', '%@test.stanford.edu')
      .order('email');

    if (testUsersError) {
      console.error('❌ Error fetching test users:', testUsersError);
      return;
    }

    // Get Gary's account
    const { data: garyUser, error: garyError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, external_auth_id')
      .eq('email', 'garyxuejingzhou+1@gmail.com')
      .single();

    if (garyError) {
      console.error('⚠️  Could not find Gary\'s account:', garyError);
    }

    // Combine all users
    const allUsers = garyUser ? [...testUsers, garyUser] : testUsers;
    console.log(`👥 Found ${allUsers.length} users to sign up\n`);

    // Step 3: Get user preferences from onboarding_profiles
    const userIds = allUsers.map(u => u.id);
    const { data: userProfiles } = await supabase
      .from('onboarding_profiles')
      .select('user_id, dietary_restrictions, cuisines_to_avoid, food_budget')
      .in('user_id', userIds);

    // Create a map for easy lookup
    const profileMap = {};
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap[profile.user_id] = profile;
      });
    }

    // Step 4: Sign up each user
    console.log('📝 Signing up users...\n');
    
    let successCount = 0;
    let skipCount = 0;

    for (const user of allUsers) {
      // Check if already signed up
      const { data: existingSignup } = await supabase
        .from('dinner_bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('timeslot_id', timeSlotId)
        .single();

      if (existingSignup) {
        console.log(`   ⏭️  ${user.email} - Already signed up`);
        skipCount++;
        continue;
      }

      // Get user's preferences
      const profile = profileMap[user.id];
      
      const signupData = {
        user_id: user.id,
        timeslot_id: timeSlotId,
        status: 'pending',
        dietary_restrictions: profile?.dietary_restrictions || null,
        preferences: profile ? JSON.stringify({
          cuisines_to_avoid: profile.cuisines_to_avoid,
          budget: profile.food_budget
        }) : null,
        signed_up_at: new Date().toISOString()
      };

      const { error: signupError } = await supabase
        .from('dinner_bookings')
        .insert(signupData);

      if (signupError) {
        console.error(`   ❌ ${user.email} - Failed:`, signupError.message);
      } else {
        console.log(`   ✅ ${user.email} - Signed up successfully`);
        successCount++;
      }
    }

    // Step 5: Update current signups count
    const totalSignups = successCount + skipCount;
    await supabase
      .from('timeslots')
      .update({ 
        current_signups: totalSignups,
        updated_at: new Date().toISOString()
      })
      .eq('id', timeSlotId);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Time Slot: ${dateStr} 7:00 PM`);
    console.log(`📍 Location: San Francisco`);
    console.log(`🍽️  Dinner Type: Regular`);
    console.log(`\n👥 Signups:`);
    console.log(`   ✅ Successfully signed up: ${successCount}`);
    console.log(`   ⏭️  Already signed up: ${skipCount}`);
    console.log(`   💺 Total signups: ${totalSignups}/24`);
    console.log('\n🎯 Next Steps:');
    console.log('   1. Run the matching algorithm to create dinner groups');
    console.log('   2. Groups will be formed based on:');
    console.log('      - Similar interests (Tech, Finance, Healthcare, Creative, Academic)');
    console.log('      - Compatible dining preferences');
    console.log('      - Personality compatibility');
    console.log('      - Geographic proximity');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createFridayDinnerWithSignups();