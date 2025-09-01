/**
 * Fix profiles and preferences for the 8 additional test users
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

const ADDITIONAL_USER_DATA = {
  'maya.rodriguez@test.stanford.edu': {
    birth_date: '1993-05-12',
    gender: 'female',
    education_level: 'PhD',
    occupation: 'Neuroscientist',
    dietary_restrictions: ['kosher'],
    preferred_cuisines: ['mediterranean', 'middle_eastern', 'italian'],
    dining_atmospheres: ['upscale', 'authentic'],
    location_zip_code: '94305',
    social_preferences: {
      interests: ['science', 'art', 'classical_music'],
      social_level: 6,
      adventure_level: 5,
      formality_level: 7
    }
  },
  'noah.thompson@test.stanford.edu': {
    birth_date: '1991-09-28',
    gender: 'male',
    education_level: 'Masters',
    occupation: 'Product Manager',
    dietary_restrictions: [],
    preferred_cuisines: ['japanese', 'thai', 'peruvian'],
    dining_atmospheres: ['trendy', 'casual'],
    location_zip_code: '94301',
    social_preferences: {
      interests: ['technology', 'travel', 'photography'],
      social_level: 8,
      adventure_level: 9,
      formality_level: 5
    }
  },
  'olivia.martinez@test.stanford.edu': {
    birth_date: '1996-02-14',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Social Media Manager',
    dietary_restrictions: ['dairy_free'],
    preferred_cuisines: ['mexican', 'spanish', 'tapas'],
    dining_atmospheres: ['trendy', 'casual', 'outdoor'],
    location_zip_code: '94306',
    social_preferences: {
      interests: ['marketing', 'fashion', 'yoga'],
      social_level: 9,
      adventure_level: 7,
      formality_level: 4
    }
  },
  'peter.nguyen@test.stanford.edu': {
    birth_date: '1989-11-03',
    gender: 'male',
    education_level: 'MBA',
    occupation: 'Strategy Consultant',
    dietary_restrictions: [],
    preferred_cuisines: ['vietnamese', 'french', 'seafood'],
    dining_atmospheres: ['fine_dining', 'business'],
    location_zip_code: '94301',
    social_preferences: {
      interests: ['business', 'chess', 'wine_tasting'],
      social_level: 7,
      adventure_level: 5,
      formality_level: 8
    }
  },
  'quinn.anderson@test.stanford.edu': {
    birth_date: '1994-07-19',
    gender: 'non-binary',
    education_level: 'Masters',
    occupation: 'UX Designer',
    dietary_restrictions: ['vegetarian', 'gluten_free'],
    preferred_cuisines: ['indian', 'ethiopian', 'farm_to_table'],
    dining_atmospheres: ['healthy', 'authentic', 'casual'],
    location_zip_code: '94304',
    social_preferences: {
      interests: ['design', 'sustainability', 'hiking'],
      social_level: 6,
      adventure_level: 8,
      formality_level: 3
    }
  },
  'rachel.kim@test.stanford.edu': {
    birth_date: '1992-12-25',
    gender: 'female',
    education_level: 'JD',
    occupation: 'Corporate Lawyer',
    dietary_restrictions: ['no_shellfish'],
    preferred_cuisines: ['korean', 'italian', 'steakhouse'],
    dining_atmospheres: ['upscale', 'business', 'fine_dining'],
    location_zip_code: '94301',
    social_preferences: {
      interests: ['law', 'politics', 'running'],
      social_level: 6,
      adventure_level: 4,
      formality_level: 9
    }
  },
  'samuel.wright@test.stanford.edu': {
    birth_date: '1995-03-08',
    gender: 'male',
    education_level: 'PhD',
    occupation: 'Robotics Engineer',
    dietary_restrictions: ['halal'],
    preferred_cuisines: ['middle_eastern', 'indian', 'bbq'],
    dining_atmospheres: ['casual', 'authentic', 'family_style'],
    location_zip_code: '94305',
    social_preferences: {
      interests: ['robotics', 'gaming', 'basketball'],
      social_level: 5,
      adventure_level: 6,
      formality_level: 3
    }
  },
  'tara.patel@test.stanford.edu': {
    birth_date: '1990-06-30',
    gender: 'female',
    education_level: 'MD',
    occupation: 'Physician',
    dietary_restrictions: ['vegetarian'],
    preferred_cuisines: ['indian', 'mediterranean', 'sushi'],
    dining_atmospheres: ['healthy', 'upscale', 'quiet'],
    location_zip_code: '94304',
    social_preferences: {
      interests: ['medicine', 'meditation', 'painting'],
      social_level: 5,
      adventure_level: 4,
      formality_level: 7
    }
  }
};

async function fixProfiles() {
  console.log('📝 Fixing profiles for additional users...\n');
  
  for (const [email, data] of Object.entries(ADDITIONAL_USER_DATA)) {
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      continue;
    }
    
    // Update or create profile (don't include age_years - it's generated)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        birth_date: data.birth_date,
        gender: data.gender,
        education_level: data.education_level,
        occupation: data.occupation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      console.log(`⚠️  Profile error for ${email}:`, profileError.message);
    } else {
      console.log(`✅ Fixed profile for ${email}`);
    }
  }
}

async function fixPreferences() {
  console.log('\n📝 Fixing preferences for additional users...\n');
  
  for (const [email, data] of Object.entries(ADDITIONAL_USER_DATA)) {
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!user) continue;
    
    // Update preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        dietary_restrictions: data.dietary_restrictions,
        preferred_cuisines: data.preferred_cuisines,
        dining_atmospheres: data.dining_atmospheres,
        location_zip_code: data.location_zip_code,
        max_travel_distance: 10,
        group_size_preference: 'small_group',
        preferred_times: ['evening'],
        preferred_days: ['friday', 'saturday'],
        social_preferences: data.social_preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (prefError) {
      console.log(`⚠️  Preferences error for ${email}:`, prefError.message);
    } else {
      console.log(`✅ Fixed preferences for ${email}`);
    }
  }
}

async function addToTimeSlot() {
  console.log('\n📝 Adding users to time slot...\n');
  
  // Load time slot data
  const timeSlotData = JSON.parse(
    fs.readFileSync(join(__dirname, 'time-slot-created.json'), 'utf-8')
  );
  const timeSlotId = timeSlotData.timeSlotId;
  
  for (const email of Object.keys(ADDITIONAL_USER_DATA)) {
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!user) continue;
    
    // Check if already signed up (using the correct table name)
    const { data: existing } = await supabase
      .from('slot_signups')
      .select('id')
      .eq('user_id', user.id)
      .eq('slot_id', timeSlotId)
      .single();

    if (existing) {
      console.log(`ℹ️  ${email} already signed up`);
      continue;
    }

    // Add signup
    const { error } = await supabase
      .from('slot_signups')
      .insert({
        slot_id: timeSlotId,
        user_id: user.id,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log(`⚠️  Signup error for ${email}:`, error.message);
    } else {
      console.log(`✅ Added ${email} to time slot`);
    }
  }
}

async function main() {
  console.log('🔧 Fixing profiles and preferences for additional test users...\n');
  
  await fixProfiles();
  await fixPreferences();
  await addToTimeSlot();
  
  console.log('\n✨ Done! Check your database to verify.')
}

main().catch(console.error);