/**
 * Script to create a time slot and sign up all test users
 * This prepares data for the matching algorithm
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get next Friday at 7 PM
function getNextFriday(): { date: string; time: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // If today is Friday, get next Friday
  
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  nextFriday.setHours(19, 0, 0, 0); // 7 PM
  
  const date = nextFriday.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = '19:00:00'; // 7 PM in 24hr format
  
  return { date, time };
}

async function createTimeSlot(): Promise<string | null> {
  try {
    const { date, time } = getNextFriday();
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`📅 Creating time slot for ${dayOfWeek}, ${date} at ${time}`);
    
    // Check if time slot already exists
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id')
      .eq('slot_date', date)
      .eq('slot_time', time)
      .single();
    
    if (existing) {
      console.log(`ℹ️  Time slot already exists: ${existing.id}`);
      return existing.id;
    }
    
    // Create new time slot
    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .insert({
        slot_date: date,
        slot_time: time,
        day_of_week: dayOfWeek,
        max_signups: 20, // Allow up to 20 signups
        current_signups: 0,
        status: 'open',
        dinner_type: 'regular',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating time slot:', error);
      return null;
    }
    
    console.log(`✅ Created time slot: ${timeSlot.id}`);
    return timeSlot.id;
  } catch (error) {
    console.error('❌ Unexpected error creating time slot:', error);
    return null;
  }
}

async function loadTestUsers(): Promise<Array<{ userId: string; email: string }>> {
  // Try to load from saved file first
  const savedUsersPath = join(__dirname, 'test-users-created.json');
  
  if (fs.existsSync(savedUsersPath)) {
    console.log('📁 Loading users from saved file...');
    const savedUsers = JSON.parse(fs.readFileSync(savedUsersPath, 'utf-8'));
    return savedUsers.map((u: any) => ({ userId: u.userId, email: u.email }));
  }
  
  // Otherwise, fetch from database
  console.log('🔍 Fetching test users from database...');
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .like('email', '%@test.stanford.edu')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error || !users) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
  
  return users.map(u => ({ userId: u.id, email: u.email }));
}

async function signupUsersForTimeSlot(timeSlotId: string, users: Array<{ userId: string; email: string }>): Promise<number> {
  console.log(`\n👥 Signing up ${users.length} users for time slot...`);
  
  let successCount = 0;
  
  for (const user of users) {
    try {
      // Check if already signed up
      const { data: existing } = await supabase
        .from('slot_signups')
        .select('id')
        .eq('time_slot_id', timeSlotId)
        .eq('user_id', user.userId)
        .single();
      
      if (existing) {
        console.log(`ℹ️  ${user.email} already signed up`);
        successCount++;
        continue;
      }
      
      // Create signup with some variation in preferences
      const userIndex = users.indexOf(user);
      const dietaryOptions = [
        'None',
        'Vegetarian',
        'Vegan',
        'Gluten-free',
        'Dairy-free',
        'Nut allergy',
        'Halal',
        'Kosher'
      ];
      
      const preferenceOptions = [
        'Quiet table preferred',
        'Lively conversation',
        'Business networking',
        'Casual meetup',
        'Cultural exchange',
        'Foodie experience'
      ];
      
      const { error } = await supabase
        .from('slot_signups')
        .insert({
          time_slot_id: timeSlotId,
          user_id: user.userId,
          status: 'confirmed', // Set as confirmed so they're ready for matching
          dietary_restrictions: userIndex % 3 === 0 ? dietaryOptions[userIndex % dietaryOptions.length] : null,
          preferences: preferenceOptions[userIndex % preferenceOptions.length],
          signed_up_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`❌ Error signing up ${user.email}:`, error);
      } else {
        console.log(`✅ Signed up: ${user.email}`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
    }
  }
  
  // Update the time slot's current_signups count
  await supabase
    .from('time_slots')
    .update({
      current_signups: successCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', timeSlotId);
  
  return successCount;
}

async function main() {
  console.log('🚀 Starting time slot creation and user signup...\n');
  
  // 1. Create time slot
  const timeSlotId = await createTimeSlot();
  if (!timeSlotId) {
    console.error('❌ Failed to create time slot. Exiting.');
    process.exit(1);
  }
  
  // 2. Load test users
  const users = await loadTestUsers();
  if (users.length === 0) {
    console.error('❌ No test users found. Run createTestUsersWithPrivy.ts first.');
    process.exit(1);
  }
  
  console.log(`\n📋 Found ${users.length} test users`);
  
  // 3. Sign up users for the time slot
  const signupCount = await signupUsersForTimeSlot(timeSlotId, users);
  
  // 4. Save results
  const results = {
    timeSlotId,
    userCount: users.length,
    signupCount,
    date: getNextFriday().date,
    time: getNextFriday().time,
    createdAt: new Date().toISOString()
  };
  
  const outputPath = join(__dirname, 'time-slot-created.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Setup complete!');
  console.log('='.repeat(60));
  console.log(`Time Slot ID: ${timeSlotId}`);
  console.log(`Users signed up: ${signupCount}/${users.length}`);
  console.log(`Data saved to: ${outputPath}\n`);
  
  if (signupCount >= 12) {
    console.log('✅ You have enough users for matching!');
    console.log('\nTo run the matching algorithm:');
    console.log('1. Start the matching services (data-processor, people-matcher)');
    console.log('2. Call the API: POST /api/matching/run/' + timeSlotId);
    console.log('   with admin authentication');
  } else {
    console.log('⚠️  Warning: You need at least 12 users for matching.');
    console.log(`   Current: ${signupCount} users`);
  }
}

// Run the script
main().catch(console.error);