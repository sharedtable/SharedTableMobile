/**
 * Simplified script to create test users directly in database
 * This bypasses Privy for testing purposes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

// Test user data
const TEST_USERS = [
  {
    email: 'alice.chen@test.stanford.edu',
    first_name: 'Alice',
    last_name: 'Chen',
    display_name: 'Alice Chen',
    birth_date: '1995-03-15',
    gender: 'female',
    education_level: 'Masters',
    occupation: 'Software Engineer',
    dietary_restrictions: ['vegetarian'],
    preferred_cuisines: ['italian', 'thai', 'mediterranean'],
    dining_atmospheres: ['casual', 'trendy'],
    location_zip_code: '94305',
    social_preferences: {
      interests: ['technology', 'hiking', 'photography'],
      social_level: 7,
      adventure_level: 8
    }
  },
  {
    email: 'bob.kumar@test.stanford.edu',
    first_name: 'Bob',
    last_name: 'Kumar',
    display_name: 'Bob Kumar',
    birth_date: '1994-07-22',
    gender: 'male',
    education_level: 'PhD',
    occupation: 'AI Researcher',
    dietary_restrictions: ['vegetarian', 'no_nuts'],
    preferred_cuisines: ['indian', 'italian', 'mexican'],
    dining_atmospheres: ['casual', 'family_style'],
    location_zip_code: '94305',
    social_preferences: {
      interests: ['technology', 'philosophy', 'cooking'],
      social_level: 6,
      adventure_level: 6
    }
  },
  {
    email: 'carol.smith@test.stanford.edu',
    first_name: 'Carol',
    last_name: 'Smith',
    display_name: 'Carol Smith',
    birth_date: '1990-11-08',
    gender: 'female',
    education_level: 'MBA',
    occupation: 'Investment Banker',
    dietary_restrictions: [],
    preferred_cuisines: ['french', 'japanese', 'steakhouse'],
    dining_atmospheres: ['fine_dining', 'business'],
    location_zip_code: '94301',
    social_preferences: {
      interests: ['business', 'wine', 'golf'],
      social_level: 8,
      adventure_level: 5
    }
  },
  {
    email: 'david.johnson@test.stanford.edu',
    first_name: 'David',
    last_name: 'Johnson',
    display_name: 'David Johnson',
    birth_date: '1988-05-20',
    gender: 'male',
    education_level: 'MBA',
    occupation: 'Venture Capitalist',
    dietary_restrictions: [],
    preferred_cuisines: ['french', 'italian', 'american'],
    dining_atmospheres: ['fine_dining', 'upscale'],
    location_zip_code: '94301',
    social_preferences: {
      interests: ['investing', 'tennis', 'wine'],
      social_level: 9,
      adventure_level: 4
    }
  },
  {
    email: 'emma.garcia@test.stanford.edu',
    first_name: 'Emma',
    last_name: 'Garcia',
    display_name: 'Emma Garcia',
    birth_date: '1992-09-30',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Graphic Designer',
    dietary_restrictions: ['gluten_free'],
    preferred_cuisines: ['mexican', 'vietnamese', 'mediterranean'],
    dining_atmospheres: ['trendy', 'casual'],
    location_zip_code: '94306',
    social_preferences: {
      interests: ['art', 'music', 'travel'],
      social_level: 8,
      adventure_level: 9
    }
  },
  {
    email: 'frank.lee@test.stanford.edu',
    first_name: 'Frank',
    last_name: 'Lee',
    display_name: 'Frank Lee',
    birth_date: '1993-02-14',
    gender: 'male',
    education_level: 'Masters',
    occupation: 'Film Director',
    dietary_restrictions: ['pescatarian'],
    preferred_cuisines: ['japanese', 'korean', 'seafood'],
    dining_atmospheres: ['trendy', 'authentic'],
    location_zip_code: '94306',
    social_preferences: {
      interests: ['film', 'music', 'writing'],
      social_level: 7,
      adventure_level: 8
    }
  },
  {
    email: 'grace.wang@test.stanford.edu',
    first_name: 'Grace',
    last_name: 'Wang',
    display_name: 'Grace Wang',
    birth_date: '1996-06-18',
    gender: 'female',
    education_level: 'PhD',
    occupation: 'Research Scientist',
    dietary_restrictions: ['vegan'],
    preferred_cuisines: ['chinese', 'thai', 'ethiopian'],
    dining_atmospheres: ['casual', 'healthy'],
    location_zip_code: '94305',
    social_preferences: {
      interests: ['science', 'environment', 'reading'],
      social_level: 5,
      adventure_level: 6
    }
  },
  {
    email: 'henry.taylor@test.stanford.edu',
    first_name: 'Henry',
    last_name: 'Taylor',
    display_name: 'Henry Taylor',
    birth_date: '1991-12-03',
    gender: 'male',
    education_level: 'Masters',
    occupation: 'Sports Manager',
    dietary_restrictions: [],
    preferred_cuisines: ['bbq', 'mexican', 'american'],
    dining_atmospheres: ['casual', 'sports_bar'],
    location_zip_code: '94304',
    social_preferences: {
      interests: ['sports', 'cooking', 'travel'],
      social_level: 9,
      adventure_level: 7
    }
  },
  {
    email: 'iris.patel@test.stanford.edu',
    first_name: 'Iris',
    last_name: 'Patel',
    display_name: 'Iris Patel',
    birth_date: '1994-04-25',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Fashion Designer',
    dietary_restrictions: ['halal'],
    preferred_cuisines: ['middle_eastern', 'indian', 'mediterranean'],
    dining_atmospheres: ['trendy', 'authentic'],
    location_zip_code: '94304',
    social_preferences: {
      interests: ['fashion', 'dance', 'culture'],
      social_level: 8,
      adventure_level: 7
    }
  },
  {
    email: 'jack.brown@test.stanford.edu',
    first_name: 'Jack',
    last_name: 'Brown',
    display_name: 'Jack Brown',
    birth_date: '1989-08-11',
    gender: 'male',
    education_level: 'MBA',
    occupation: 'Financial Advisor',
    dietary_restrictions: ['keto'],
    preferred_cuisines: ['steakhouse', 'brazilian', 'american'],
    dining_atmospheres: ['upscale', 'business'],
    location_zip_code: '94303',
    social_preferences: {
      interests: ['finance', 'cars', 'whiskey'],
      social_level: 7,
      adventure_level: 4
    }
  },
  {
    email: 'kate.miller@test.stanford.edu',
    first_name: 'Kate',
    last_name: 'Miller',
    display_name: 'Kate Miller',
    birth_date: '1997-01-07',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Fitness Instructor',
    dietary_restrictions: ['paleo'],
    preferred_cuisines: ['healthy', 'poke', 'salads'],
    dining_atmospheres: ['healthy', 'casual'],
    location_zip_code: '94303',
    social_preferences: {
      interests: ['fitness', 'nutrition', 'wellness'],
      social_level: 7,
      adventure_level: 6
    }
  },
  {
    email: 'liam.davis@test.stanford.edu',
    first_name: 'Liam',
    last_name: 'Davis',
    display_name: 'Liam Davis',
    birth_date: '1995-10-29',
    gender: 'male',
    education_level: 'PhD',
    occupation: 'Game Developer',
    dietary_restrictions: ['lactose_intolerant'],
    preferred_cuisines: ['ramen', 'korean', 'burgers'],
    dining_atmospheres: ['casual', 'authentic'],
    location_zip_code: '94302',
    social_preferences: {
      interests: ['gaming', 'anime', 'technology'],
      social_level: 5,
      adventure_level: 6
    }
  }
];

async function createUser(userData: any): Promise<string | null> {
  try {
    // Generate a test Privy ID for testing
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

async function main() {
  console.log('🚀 Creating test users (simplified version)...\n');
  
  const createdUsers: { email: string; userId: string }[] = [];
  
  for (const userData of TEST_USERS) {
    console.log(`\n📝 Processing ${userData.email}...`);
    
    const userId = await createUser(userData);
    if (!userId) continue;
    
    await createProfile(userData, userId);
    await createPreferences(userData, userId);
    
    createdUsers.push({ email: userData.email, userId });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test user creation complete!');
  console.log(`Created ${createdUsers.length} users`);
  
  // Save results
  fs.writeFileSync(
    join(__dirname, 'test-users-created.json'),
    JSON.stringify(createdUsers, null, 2)
  );
  
  console.log('📁 Saved to test-users-created.json');
}

main().catch(console.error);