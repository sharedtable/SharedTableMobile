/**
 * Script to verify all test data is properly set up
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTestData() {
  console.log('🔍 Verifying Test Data Setup\n');
  console.log('='.repeat(60));
  
  // 1. Verify Users
  console.log('\n📊 USERS:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, display_name')
    .like('email', '%@test.stanford.edu')
    .order('created_at');
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`✅ Found ${users?.length} test users`);
    users?.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} - ${user.display_name}`);
    });
  }
  
  // 2. Verify Profiles
  console.log('\n📊 USER PROFILES:');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, birth_date, gender, education_level, occupation')
    .in('user_id', users?.map(u => u.id) || []);
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log(`✅ Found ${profiles?.length} user profiles`);
    const missingProfiles = users?.filter(u => 
      !profiles?.find(p => p.user_id === u.id)
    );
    if (missingProfiles?.length) {
      console.log(`⚠️  Missing profiles for:`);
      missingProfiles.forEach(u => console.log(`   - ${u.email}`));
    }
  }
  
  // 3. Verify Preferences
  console.log('\n📊 USER PREFERENCES:');
  const { data: preferences, error: prefsError } = await supabase
    .from('user_preferences')
    .select('user_id, dietary_restrictions, preferred_cuisines, dining_atmospheres')
    .in('user_id', users?.map(u => u.id) || []);
  
  if (prefsError) {
    console.error('Error fetching preferences:', prefsError);
  } else {
    console.log(`✅ Found ${preferences?.length} user preferences`);
    const missingPrefs = users?.filter(u => 
      !preferences?.find(p => p.user_id === u.id)
    );
    if (missingPrefs?.length) {
      console.log(`⚠️  Missing preferences for:`);
      missingPrefs.forEach(u => console.log(`   - ${u.email}`));
    }
  }
  
  // 4. Verify Features
  console.log('\n📊 USER FEATURES:');
  const { data: features, error: featuresError } = await supabase
    .from('user_features')
    .select('user_id, processing_status, version, processed_at')
    .in('user_id', users?.map(u => u.id) || []);
  
  if (featuresError) {
    console.error('Error fetching features:', featuresError);
  } else {
    console.log(`✅ Found ${features?.length} processed feature sets`);
    
    // Check feature details
    const completed = features?.filter(f => f.processing_status === 'completed').length || 0;
    const pending = features?.filter(f => f.processing_status === 'pending').length || 0;
    const failed = features?.filter(f => f.processing_status === 'failed').length || 0;
    
    console.log(`   - Completed: ${completed}`);
    console.log(`   - Pending: ${pending}`);
    console.log(`   - Failed: ${failed}`);
    
    const missingFeatures = users?.filter(u => 
      !features?.find(f => f.user_id === u.id)
    );
    if (missingFeatures?.length) {
      console.log(`⚠️  Missing features for:`);
      missingFeatures.forEach(u => console.log(`   - ${u.email}`));
    }
  }
  
  // 5. Verify Time Slots
  console.log('\n📊 TIME SLOTS:');
  const timeSlotData = JSON.parse(
    fs.readFileSync(join(__dirname, 'time-slot-created.json'), 'utf-8')
  );
  
  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('id', timeSlotData.timeSlotId)
    .single();
  
  if (slot) {
    console.log(`✅ Time slot found: ${slot.date} at ${slot.time}`);
    console.log(`   - Status: ${slot.status}`);
    console.log(`   - User count: ${slot.user_count}`);
  }
  
  // 6. Verify Signups
  console.log('\n📊 TIME SLOT SIGNUPS:');
  const { data: signups, error: signupsError } = await supabase
    .from('slot_signups')
    .select('user_id, status')
    .eq('slot_id', timeSlotData.timeSlotId);
  
  if (signupsError) {
    console.error('Error fetching signups:', signupsError);
  } else {
    console.log(`✅ Found ${signups?.length} signups for the time slot`);
    const confirmed = signups?.filter(s => s.status === 'confirmed').length || 0;
    console.log(`   - Confirmed: ${confirmed}`);
    
    const missingSignups = users?.filter(u => 
      !signups?.find(s => s.user_id === u.id)
    );
    if (missingSignups?.length) {
      console.log(`⚠️  Not signed up for time slot:`);
      missingSignups.forEach(u => console.log(`   - ${u.email}`));
    }
  }
  
  // 7. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   Total test users: ${users?.length || 0}`);
  console.log(`   Complete profiles: ${profiles?.length || 0}`);
  console.log(`   Complete preferences: ${preferences?.length || 0}`);
  console.log(`   Processed features: ${features?.filter(f => f.processing_status === 'completed').length || 0}`);
  console.log(`   Time slot signups: ${signups?.length || 0}`);
  
  // Check if ready for matching
  const readyForMatching = 
    users?.length === 20 &&
    profiles?.length >= 19 &&
    preferences?.length === 20 &&
    features?.filter(f => f.processing_status === 'completed').length >= 19;
  
  if (readyForMatching) {
    console.log('\n✅ Test data is READY for matching algorithm!');
  } else {
    console.log('\n⚠️  Test data is NOT complete. Please fix missing items above.');
  }
  
  return {
    users: users?.length || 0,
    profiles: profiles?.length || 0,
    preferences: preferences?.length || 0,
    features: features?.filter(f => f.processing_status === 'completed').length || 0,
    signups: signups?.length || 0,
    readyForMatching
  };
}

async function main() {
  const results = await verifyTestData();
  
  // Save verification results
  fs.writeFileSync(
    join(__dirname, 'test-data-verification.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📁 Verification results saved to test-data-verification.json');
}

main().catch(console.error);