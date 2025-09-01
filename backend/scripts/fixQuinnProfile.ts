/**
 * Fix Quinn Anderson's profile and process their features
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGenderEnum() {
  console.log('🔍 Checking database gender enum values...\n');
  
  // Query to check the enum values
  const { data, error } = await supabase
    .rpc('get_enum_values', { 
      enum_name: 'gender' 
    })
    .single();
  
  if (error) {
    // Try alternative approach - check existing values
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('gender')
      .limit(10);
    
    if (profiles) {
      const uniqueGenders = [...new Set(profiles.map(p => p.gender).filter(Boolean))];
      console.log('Found existing gender values in database:', uniqueGenders);
    }
  } else {
    console.log('Gender enum values:', data);
  }
}

async function fixQuinnProfile() {
  console.log('\n📝 Fixing Quinn Anderson profile...\n');
  
  // Get Quinn's user ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'quinn.anderson@test.stanford.edu')
    .single();
  
  if (!user) {
    console.log('❌ Quinn Anderson not found');
    return;
  }
  
  console.log(`Found Quinn with ID: ${user.id}`);
  
  // First, let's check what gender values are valid
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (existingProfile) {
    console.log('Existing profile found:', existingProfile);
  }
  
  // Try to create/update profile with 'prefer_not_to_say' or check other valid options
  const profileData = {
    user_id: user.id,
    birth_date: '1994-07-19',
    gender: 'prefer_not_to_say', // Try this first, or we can use 'other' if available
    education_level: 'Masters',
    occupation: 'UX Designer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Try to upsert the profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(profileData, {
      onConflict: 'user_id'
    });
  
  if (profileError) {
    console.log('⚠️  Error with prefer_not_to_say:', profileError.message);
    
    // Try with 'other' if prefer_not_to_say doesn't work
    profileData.gender = 'other';
    const { error: profileError2 } = await supabase
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'user_id'
      });
    
    if (profileError2) {
      console.log('⚠️  Error with other:', profileError2.message);
      
      // Try with 'female' as a fallback (just to get the profile created)
      profileData.gender = 'female';
      const { error: profileError3 } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });
      
      if (profileError3) {
        console.log('❌ Could not create profile:', profileError3.message);
        return false;
      } else {
        console.log('✅ Profile created with gender: female (fallback)');
      }
    } else {
      console.log('✅ Profile created with gender: other');
    }
  } else {
    console.log('✅ Profile created with gender: prefer_not_to_say');
  }
  
  return true;
}

async function processQuinnFeatures() {
  console.log('\n📊 Processing Quinn\'s features...\n');
  
  // Get Quinn's user ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'quinn.anderson@test.stanford.edu')
    .single();
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  // Trigger feature processing by updating preferences
  const { error } = await supabase
    .from('user_preferences')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);
  
  if (error) {
    console.log('⚠️  Error triggering feature processing:', error.message);
  } else {
    console.log('✅ Feature processing triggered for Quinn');
  }
  
  // Also add directly to processing queue if the table exists
  const { error: queueError } = await supabase
    .from('feature_processing_queue')
    .insert({
      user_id: user.id,
      trigger_source: 'manual_fix',
      priority: 1,
      status: 'pending'
    });
  
  if (!queueError) {
    console.log('✅ Added to feature processing queue with high priority');
  }
}

async function addQuinnToTimeSlot() {
  console.log('\n📝 Adding Quinn to time slot...\n');
  
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'quinn.anderson@test.stanford.edu')
    .single();
  
  if (!user) return;
  
  // Get time slot ID
  const fs = await import('fs');
  const timeSlotData = JSON.parse(
    fs.readFileSync(join(__dirname, 'time-slot-created.json'), 'utf-8')
  );
  
  // Check the correct column name by trying both
  const signupData: any = {
    user_id: user.id,
    status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Try with slot_id first
  signupData.slot_id = timeSlotData.timeSlotId;
  
  const { error: error1 } = await supabase
    .from('slot_signups')
    .insert(signupData);
  
  if (error1) {
    console.log('⚠️  Error with slot_id:', error1.message);
    
    // Try with time_slot_id
    delete signupData.slot_id;
    signupData.time_slot_id = timeSlotData.timeSlotId;
    
    const { error: error2 } = await supabase
      .from('slot_signups')
      .insert(signupData);
    
    if (error2) {
      console.log('❌ Could not add to time slot:', error2.message);
    } else {
      console.log('✅ Added Quinn to time slot');
    }
  } else {
    console.log('✅ Added Quinn to time slot');
  }
}

async function main() {
  console.log('🔧 Fixing Quinn Anderson\'s data...\n');
  
  // Check gender enum values
  await checkGenderEnum();
  
  // Fix profile
  const profileFixed = await fixQuinnProfile();
  
  if (profileFixed) {
    // Process features
    await processQuinnFeatures();
    
    // Add to time slot
    await addQuinnToTimeSlot();
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);