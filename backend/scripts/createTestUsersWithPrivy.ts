/**
 * Script to create test users with real Privy authentication
 * Creates users with complete profiles and preferences for matching algorithm testing
 */

import { PrivyClient } from '@privy-io/server-auth';
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
const privyAppId = process.env.PRIVY_APP_ID!;
const privyAppSecret = process.env.PRIVY_APP_SECRET!;

if (!supabaseUrl || !supabaseServiceKey || !privyAppId || !privyAppSecret) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, PRIVY_APP_ID, PRIVY_APP_SECRET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const privy = new PrivyClient(privyAppId, privyAppSecret);

// Test user data - 12+ users with diverse preferences for matching algorithm
const TEST_USERS = [
  // Group 1: Tech professionals, vegetarian preferences
  {
    email: 'alice.chen@test.stanford.edu',
    first_name: 'Alice',
    last_name: 'Chen',
    display_name: 'Alice Chen',
    // Profile fields
    birth_date: '1995-03-15',
    gender: 'female',
    education_level: 'Masters',
    occupation: 'Software Engineer',
    // Preferences fields (matching actual schema)
    dietary_restrictions: ['vegetarian'],
    preferred_cuisines: ['italian', 'thai', 'mediterranean'],
    dining_atmospheres: ['casual', 'trendy'],
    location_zip_code: '94305',
    max_travel_distance: 10,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['friday', 'saturday'],
    social_preferences: {
      interests: ['technology', 'hiking', 'photography'],
      languages: ['english', 'mandarin'],
      social_level: 7,
      adventure_level: 8,
      formality_level: 4,
      goals: ['networking', 'friendship']
    },
    foodie_profile: {
      bio: 'Love exploring new cuisines and meeting interesting people',
      foodie_tags: ['adventurous_eater', 'wine_enthusiast'],
      favorite_food: 'Authentic Italian pasta',
      cooking_skill: 'intermediate'
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
    max_travel_distance: 10,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['thursday', 'friday', 'saturday'],
    social_preferences: {
      interests: ['technology', 'philosophy', 'cooking'],
      languages: ['english', 'hindi'],
      social_level: 6,
      adventure_level: 6,
      formality_level: 3,
      goals: ['networking', 'friendship']
    },
    foodie_profile: {
      bio: 'PhD student who loves cooking and discussing ideas over food',
      foodie_tags: ['home_chef', 'spice_lover'],
      favorite_food: 'Homemade curry',
      cooking_skill: 'advanced'
    }
  },
  
  // Group 2: Business professionals, fine dining
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
    max_travel_distance: 15,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['wednesday', 'thursday', 'saturday'],
    social_preferences: {
      interests: ['business', 'wine', 'golf'],
      languages: ['english'],
      social_level: 8,
      adventure_level: 5,
      formality_level: 8,
      goals: ['networking', 'business']
    },
    foodie_profile: {
      bio: 'MBA grad who appreciates fine dining and business networking',
      foodie_tags: ['wine_connoisseur', 'fine_dining'],
      favorite_food: 'Wagyu steak',
      cooking_skill: 'beginner'
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
    max_travel_distance: 20,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['tuesday', 'wednesday', 'thursday'],
    social_preferences: {
      interests: ['investing', 'tennis', 'wine'],
      languages: ['english', 'french'],
      social_level: 9,
      adventure_level: 4,
      formality_level: 9,
      goals: ['networking', 'business']
    },
    foodie_profile: {
      bio: 'VC partner who enjoys business dinners and wine tastings',
      foodie_tags: ['wine_expert', 'business_dining'],
      favorite_food: 'French cuisine',
      cooking_skill: 'intermediate'
    }
  },
  
  // Group 3: Creative professionals
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
    max_travel_distance: 12,
    group_size_preference: 'small_group',
    preferred_times: ['evening', 'lunch'],
    preferred_days: ['friday', 'saturday', 'sunday'],
    social_preferences: {
      interests: ['art', 'music', 'travel'],
      languages: ['english', 'spanish'],
      social_level: 8,
      adventure_level: 9,
      formality_level: 3,
      goals: ['friendship', 'creative_collaboration']
    },
    foodie_profile: {
      bio: 'Creative soul who loves trying new restaurants and meeting artists',
      foodie_tags: ['adventurous_eater', 'instagram_foodie'],
      favorite_food: 'Street tacos',
      cooking_skill: 'intermediate'
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
    max_travel_distance: 15,
    group_size_preference: 'small_group',
    preferred_times: ['evening', 'late_night'],
    preferred_days: ['thursday', 'friday', 'saturday'],
    social_preferences: {
      interests: ['film', 'music', 'writing'],
      languages: ['english', 'korean'],
      social_level: 7,
      adventure_level: 8,
      formality_level: 4,
      goals: ['friendship', 'creative_collaboration']
    },
    foodie_profile: {
      bio: 'Film director who appreciates authentic Asian cuisine',
      foodie_tags: ['sushi_lover', 'authentic_seeker'],
      favorite_food: 'Omakase sushi',
      cooking_skill: 'beginner'
    }
  },
  
  // Additional users for algorithm (need 12+)
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
    max_travel_distance: 8,
    group_size_preference: 'small_group',
    preferred_times: ['lunch', 'evening'],
    preferred_days: ['saturday', 'sunday'],
    social_preferences: {
      interests: ['science', 'environment', 'reading'],
      languages: ['english', 'mandarin'],
      social_level: 5,
      adventure_level: 6,
      formality_level: 3,
      goals: ['friendship', 'intellectual_discussion']
    },
    foodie_profile: {
      bio: 'Environmental scientist passionate about sustainable food',
      foodie_tags: ['vegan', 'sustainable_dining'],
      favorite_food: 'Plant-based bowls',
      cooking_skill: 'advanced'
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
    max_travel_distance: 10,
    group_size_preference: 'medium_group',
    preferred_times: ['evening'],
    preferred_days: ['friday', 'saturday', 'sunday'],
    social_preferences: {
      interests: ['sports', 'cooking', 'travel'],
      languages: ['english'],
      social_level: 9,
      adventure_level: 7,
      formality_level: 2,
      goals: ['friendship', 'sports_buddies']
    },
    foodie_profile: {
      bio: 'Sports enthusiast who loves BBQ and game day food',
      foodie_tags: ['bbq_lover', 'sports_dining'],
      favorite_food: 'Texas BBQ',
      cooking_skill: 'intermediate'
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
    max_travel_distance: 12,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['thursday', 'friday', 'saturday'],
    social_preferences: {
      interests: ['fashion', 'dance', 'culture'],
      languages: ['english', 'gujarati'],
      social_level: 8,
      adventure_level: 7,
      formality_level: 6,
      goals: ['friendship', 'cultural_exchange']
    },
    foodie_profile: {
      bio: 'Fashion designer who loves authentic cultural cuisine',
      foodie_tags: ['authentic_seeker', 'cultural_dining'],
      favorite_food: 'Biryani',
      cooking_skill: 'advanced'
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
    max_travel_distance: 15,
    group_size_preference: 'small_group',
    preferred_times: ['evening'],
    preferred_days: ['tuesday', 'wednesday', 'thursday'],
    social_preferences: {
      interests: ['finance', 'cars', 'whiskey'],
      languages: ['english'],
      social_level: 7,
      adventure_level: 4,
      formality_level: 8,
      goals: ['networking', 'business']
    },
    foodie_profile: {
      bio: 'Finance professional who appreciates a good steak and whiskey',
      foodie_tags: ['steak_lover', 'whiskey_enthusiast'],
      favorite_food: 'Dry-aged ribeye',
      cooking_skill: 'intermediate'
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
    max_travel_distance: 8,
    group_size_preference: 'small_group',
    preferred_times: ['lunch', 'early_evening'],
    preferred_days: ['monday', 'wednesday', 'saturday'],
    social_preferences: {
      interests: ['fitness', 'nutrition', 'wellness'],
      languages: ['english'],
      social_level: 7,
      adventure_level: 6,
      formality_level: 2,
      goals: ['friendship', 'wellness_community']
    },
    foodie_profile: {
      bio: 'Fitness enthusiast focused on healthy, clean eating',
      foodie_tags: ['health_conscious', 'clean_eating'],
      favorite_food: 'Acai bowls',
      cooking_skill: 'intermediate'
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
    max_travel_distance: 10,
    group_size_preference: 'small_group',
    preferred_times: ['evening', 'late_night'],
    preferred_days: ['friday', 'saturday'],
    social_preferences: {
      interests: ['gaming', 'anime', 'technology'],
      languages: ['english', 'japanese'],
      social_level: 5,
      adventure_level: 6,
      formality_level: 2,
      goals: ['friendship', 'gaming_community']
    },
    foodie_profile: {
      bio: 'Game dev who loves authentic ramen and late-night food runs',
      foodie_tags: ['ramen_enthusiast', 'late_night_eater'],
      favorite_food: 'Tonkotsu ramen',
      cooking_skill: 'beginner'
    }
  }
];

async function createPrivyUser(email: string): Promise<{ id: string } | null> {
  try {
    // Create user in Privy
    const user = await privy.createUser({
      createAccessToken: true,
      linkedAccounts: [
        {
          type: 'email',
          address: email,
          verifiedAt: new Date().toISOString()
        }
      ]
    });
    
    console.log(`✅ Created Privy user: ${email} (ID: ${user.id})`);
    return user;
  } catch (error: any) {
    // Check if user already exists
    if (error.message?.includes('already exists') || error.response?.status === 409) {
      try {
        // Try to get existing user by email
        const users = await privy.getUsers({ email });
        if (users && users.length > 0) {
          console.log(`ℹ️  Privy user exists: ${email} (ID: ${users[0].id})`);
          return users[0];
        }
      } catch (searchError) {
        console.error(`❌ Error searching for ${email}:`, searchError);
      }
    }
    console.error(`❌ Error with Privy user ${email}:`, error.message || error);
    return null;
  }
}

async function createDatabaseUser(userData: any, privyUserId: string): Promise<string | null> {
  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (existing) {
      console.log(`ℹ️  Database user exists: ${userData.email}`);
      return existing.id;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
        external_auth_id: privyUserId,
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
      console.error(`❌ Database error for ${userData.email}:`, error);
      return null;
    }

    console.log(`✅ Created database user: ${userData.email}`);
    return newUser.id;
  } catch (error) {
    console.error(`❌ Unexpected error:`, error);
    return null;
  }
}

async function createUserProfile(userData: any, userId: string): Promise<boolean> {
  try {
    // Calculate age from birth date
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

async function createUserPreferences(userData: any, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        dietary_restrictions: userData.dietary_restrictions,
        preferred_cuisines: userData.preferred_cuisines,
        dining_atmospheres: userData.dining_atmospheres,
        location_zip_code: userData.location_zip_code,
        max_travel_distance: userData.max_travel_distance,
        group_size_preference: userData.group_size_preference,
        preferred_times: userData.preferred_times,
        preferred_days: userData.preferred_days,
        social_preferences: userData.social_preferences,
        foodie_profile: userData.foodie_profile,
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
  console.log('🚀 Starting test user creation...\n');
  console.log(`Creating ${TEST_USERS.length} test users with complete profiles\n`);
  
  const createdUsers: { email: string; userId: string; privyId: string }[] = [];
  
  for (const userData of TEST_USERS) {
    console.log(`\n📝 Processing ${userData.email}...`);
    
    // 1. Create Privy user
    const privyUser = await createPrivyUser(userData.email);
    if (!privyUser) {
      console.log(`⚠️  Skipping ${userData.email} - Privy issue`);
      continue;
    }
    
    // 2. Create database user
    const userId = await createDatabaseUser(userData, privyUser.id);
    if (!userId) {
      console.log(`⚠️  Skipping ${userData.email} - Database issue`);
      continue;
    }
    
    // 3. Create profile
    await createUserProfile(userData, userId);
    
    // 4. Create preferences
    await createUserPreferences(userData, userId);
    
    createdUsers.push({ 
      email: userData.email, 
      userId,
      privyId: privyUser.id 
    });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test user creation complete!');
  console.log('='.repeat(60));
  console.log(`Successfully created/verified ${createdUsers.length} users\n`);
  
  // Save results to file
  const outputPath = join(__dirname, 'test-users-created.json');
  fs.writeFileSync(outputPath, JSON.stringify(createdUsers, null, 2));
  console.log(`📁 User data saved to: ${outputPath}\n`);
  
  console.log('Next steps:');
  console.log('1. Run createTimeSlot.ts to create a test time slot');
  console.log('2. Run signupTestUsers.ts to sign up users for the time slot');
  console.log('3. Trigger the matching algorithm via the API');
}

// Run the script
main().catch(console.error);