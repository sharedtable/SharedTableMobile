/**
 * Script to create 8 additional test users (13-20) to reach 20 total
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Additional 8 test users (13-20)
const ADDITIONAL_TEST_USERS = [
  {
    email: 'maya.rodriguez@test.stanford.edu',
    first_name: 'Maya',
    last_name: 'Rodriguez',
    display_name: 'Maya Rodriguez',
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
  {
    email: 'noah.thompson@test.stanford.edu',
    first_name: 'Noah',
    last_name: 'Thompson',
    display_name: 'Noah Thompson',
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
  {
    email: 'olivia.martinez@test.stanford.edu',
    first_name: 'Olivia',
    last_name: 'Martinez',
    display_name: 'Olivia Martinez',
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
  {
    email: 'peter.nguyen@test.stanford.edu',
    first_name: 'Peter',
    last_name: 'Nguyen',
    display_name: 'Peter Nguyen',
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
  {
    email: 'quinn.anderson@test.stanford.edu',
    first_name: 'Quinn',
    last_name: 'Anderson',
    display_name: 'Quinn Anderson',
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
  {
    email: 'rachel.kim@test.stanford.edu',
    first_name: 'Rachel',
    last_name: 'Kim',
    display_name: 'Rachel Kim',
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
  {
    email: 'samuel.wright@test.stanford.edu',
    first_name: 'Samuel',
    last_name: 'Wright',
    display_name: 'Samuel Wright',
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
  {
    email: 'tara.patel@test.stanford.edu',
    first_name: 'Tara',
    last_name: 'Patel',
    display_name: 'Tara Patel',
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
];

async function createUser(userData: any): Promise<string | null> {
  try {
    const testPrivyId = `did:privy:test_${userData.email.split('@')[0].replace('.', '_')}`;
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existing) {
      console.log(`ℹ️  User exists: ${userData.email}`);
      return existing.id;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
        external_auth_id: testPrivyId,
        auth_provider: 'email',
        status: 'active',
        email_verified_at: new Date().toISOString(),
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      return null;
    }

    console.log(`✅ Created user: ${userData.email}`);
    return newUser.id;
  } catch (error) {
    console.error(`❌ Unexpected error:`, error);
    return null;
  }
}

async function createProfile(userData: any, userId: string): Promise<boolean> {
  try {
    const birthDate = new Date(userData.birth_date);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        birth_date: userData.birth_date,
        age_years: age,
        gender: userData.gender,
        education_level: userData.education_level,
        occupation: userData.occupation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Profile error for ${userData.email}:`, error);
      return false;
    }

    console.log(`✅ Created profile for: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Profile error:`, error);
    return false;
  }
}

async function createPreferences(userData: any, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        dietary_restrictions: userData.dietary_restrictions,
        preferred_cuisines: userData.preferred_cuisines,
        dining_atmospheres: userData.dining_atmospheres,
        location_zip_code: userData.location_zip_code,
        max_travel_distance: 10,
        group_size_preference: 'small_group',
        preferred_times: ['evening'],
        preferred_days: ['friday', 'saturday'],
        social_preferences: userData.social_preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Preferences error for ${userData.email}:`, error);
      return false;
    }

    console.log(`✅ Created preferences for: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Preferences error:`, error);
    return false;
  }
}

async function addToTimeSlot(userId: string, timeSlotId: string): Promise<boolean> {
  try {
    // Check if already signed up
    const { data: existing } = await supabase
      .from('time_slot_signups')
      .select('id')
      .eq('user_id', userId)
      .eq('time_slot_id', timeSlotId)
      .single();

    if (existing) {
      console.log(`ℹ️  User already signed up for time slot`);
      return true;
    }

    // Add signup
    const { error } = await supabase
      .from('time_slot_signups')
      .insert({
        id: uuidv4(),
        time_slot_id: timeSlotId,
        user_id: userId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Time slot signup error:`, error);
      return false;
    }

    console.log(`✅ Added to time slot`);
    return true;
  } catch (error) {
    console.error(`❌ Time slot error:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating 8 additional test users (13-20)...\n');
  
  // Load existing time slot
  const timeSlotData = JSON.parse(
    fs.readFileSync(join(__dirname, 'time-slot-created.json'), 'utf-8')
  );
  const timeSlotId = timeSlotData.timeSlotId;
  
  const createdUsers: { email: string; userId: string }[] = [];
  
  // Load existing users
  const existingUsers = JSON.parse(
    fs.readFileSync(join(__dirname, 'test-users-created.json'), 'utf-8')
  );
  createdUsers.push(...existingUsers);
  
  for (const userData of ADDITIONAL_TEST_USERS) {
    console.log(`\n📝 Processing ${userData.email}...`);
    
    const userId = await createUser(userData);
    if (!userId) continue;
    
    await createProfile(userData, userId);
    await createPreferences(userData, userId);
    await addToTimeSlot(userId, timeSlotId);
    
    if (!existingUsers.find((u: any) => u.email === userData.email)) {
      createdUsers.push({ email: userData.email, userId });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Additional test user creation complete!');
  console.log(`Total users: ${createdUsers.length}`);
  
  // Update the saved file
  fs.writeFileSync(
    join(__dirname, 'test-users-created.json'),
    JSON.stringify(createdUsers, null, 2)
  );
  
  console.log('📁 Updated test-users-created.json');
}

main().catch(console.error);