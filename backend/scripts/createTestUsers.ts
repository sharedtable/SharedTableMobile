/**
 * Script to create test users with Privy authentication
 * This creates real Privy users and corresponding database records
 */

import { PrivyClient } from '@privy-io/server-auth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const privyAppId = process.env.PRIVY_APP_ID!;
const privyAppSecret = process.env.PRIVY_APP_SECRET!;

if (!supabaseUrl || !supabaseServiceKey || !privyAppId || !privyAppSecret) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const privy = new PrivyClient(privyAppId, privyAppSecret);

// Test user data with diverse preferences for matching algorithm
const TEST_USERS = [
  // Group 1: Tech professionals, vegetarian, casual dining
  {
    email: 'alice.chen@stanford.edu',
    firstName: 'Alice',
    lastName: 'Chen',
    nickname: 'Alice',
    birthDate: '1995-03-15',
    gender: 'female',
    zipCode: '94305',
    education: 'Masters',
    age: 28,
    interests: ['technology', 'hiking', 'photography'],
    dietaryRestrictions: ['vegetarian'],
    cuisinePreferences: ['italian', 'thai', 'mediterranean'],
    diningStyle: ['casual', 'trendy'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['technology', 'travel', 'startups'],
      atmosphere: 'lively'
    },
    personalityTraits: {
      extraversion: 4,
      openness: 5,
      adventurousness: 4
    }
  },
  {
    email: 'bob.kumar@stanford.edu',
    firstName: 'Bob',
    lastName: 'Kumar',
    nickname: 'Bob',
    birthDate: '1994-07-22',
    gender: 'male',
    zipCode: '94305',
    education: 'PhD',
    age: 29,
    interests: ['technology', 'cooking', 'yoga'],
    dietaryRestrictions: ['vegetarian', 'no_nuts'],
    cuisinePreferences: ['indian', 'italian', 'mexican'],
    diningStyle: ['casual', 'family_style'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['technology', 'philosophy', 'culture'],
      atmosphere: 'relaxed'
    },
    personalityTraits: {
      extraversion: 3,
      openness: 5,
      adventurousness: 3
    }
  },
  
  // Group 2: Business professionals, no restrictions, fine dining
  {
    email: 'carol.smith@stanford.edu',
    firstName: 'Carol',
    lastName: 'Smith',
    nickname: 'Carol',
    birthDate: '1990-11-08',
    gender: 'female',
    zipCode: '94301',
    education: 'MBA',
    age: 33,
    interests: ['business', 'wine', 'golf'],
    dietaryRestrictions: [],
    cuisinePreferences: ['french', 'japanese', 'steakhouse'],
    diningStyle: ['fine_dining', 'business'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['business', 'finance', 'travel'],
      atmosphere: 'sophisticated'
    },
    personalityTraits: {
      extraversion: 4,
      openness: 3,
      adventurousness: 3
    }
  },
  {
    email: 'david.johnson@stanford.edu',
    firstName: 'David',
    lastName: 'Johnson',
    nickname: 'Dave',
    birthDate: '1988-05-20',
    gender: 'male',
    zipCode: '94301',
    education: 'MBA',
    age: 35,
    interests: ['investing', 'tennis', 'wine'],
    dietaryRestrictions: [],
    cuisinePreferences: ['french', 'italian', 'american'],
    diningStyle: ['fine_dining', 'upscale'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['business', 'sports', 'current_events'],
      atmosphere: 'professional'
    },
    personalityTraits: {
      extraversion: 5,
      openness: 3,
      adventurousness: 2
    }
  },
  
  // Group 3: Creative professionals, various dietary needs
  {
    email: 'emma.garcia@stanford.edu',
    firstName: 'Emma',
    lastName: 'Garcia',
    nickname: 'Emma',
    birthDate: '1992-09-30',
    gender: 'female',
    zipCode: '94306',
    education: 'Bachelors',
    age: 31,
    interests: ['art', 'music', 'travel'],
    dietaryRestrictions: ['gluten_free'],
    cuisinePreferences: ['mexican', 'vietnamese', 'mediterranean'],
    diningStyle: ['trendy', 'casual'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['arts', 'culture', 'travel'],
      atmosphere: 'creative'
    },
    personalityTraits: {
      extraversion: 4,
      openness: 5,
      adventurousness: 5
    }
  },
  {
    email: 'frank.lee@stanford.edu',
    firstName: 'Frank',
    lastName: 'Lee',
    nickname: 'Frank',
    birthDate: '1993-02-14',
    gender: 'male',
    zipCode: '94306',
    education: 'Masters',
    age: 30,
    interests: ['music', 'film', 'writing'],
    dietaryRestrictions: ['pescatarian'],
    cuisinePreferences: ['japanese', 'korean', 'seafood'],
    diningStyle: ['trendy', 'authentic'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['arts', 'media', 'philosophy'],
      atmosphere: 'intimate'
    },
    personalityTraits: {
      extraversion: 3,
      openness: 5,
      adventurousness: 4
    }
  },
  
  // Additional users for matching algorithm (need at least 12)
  {
    email: 'grace.wang@stanford.edu',
    firstName: 'Grace',
    lastName: 'Wang',
    nickname: 'Grace',
    birthDate: '1996-06-18',
    gender: 'female',
    zipCode: '94305',
    education: 'PhD',
    age: 27,
    interests: ['science', 'hiking', 'reading'],
    dietaryRestrictions: ['vegan'],
    cuisinePreferences: ['chinese', 'thai', 'ethiopian'],
    diningStyle: ['casual', 'healthy'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['science', 'environment', 'books'],
      atmosphere: 'quiet'
    },
    personalityTraits: {
      extraversion: 2,
      openness: 4,
      adventurousness: 3
    }
  },
  {
    email: 'henry.taylor@stanford.edu',
    firstName: 'Henry',
    lastName: 'Taylor',
    nickname: 'Henry',
    birthDate: '1991-12-03',
    gender: 'male',
    zipCode: '94304',
    education: 'Masters',
    age: 32,
    interests: ['sports', 'cooking', 'travel'],
    dietaryRestrictions: [],
    cuisinePreferences: ['bbq', 'mexican', 'american'],
    diningStyle: ['casual', 'sports_bar'],
    socialPreferences: {
      groupSize: '5-6',
      conversationTopics: ['sports', 'travel', 'food'],
      atmosphere: 'energetic'
    },
    personalityTraits: {
      extraversion: 5,
      openness: 3,
      adventurousness: 4
    }
  },
  {
    email: 'iris.patel@stanford.edu',
    firstName: 'Iris',
    lastName: 'Patel',
    nickname: 'Iris',
    birthDate: '1994-04-25',
    gender: 'female',
    zipCode: '94304',
    education: 'Bachelors',
    age: 29,
    interests: ['dance', 'fashion', 'food'],
    dietaryRestrictions: ['halal'],
    cuisinePreferences: ['middle_eastern', 'indian', 'mediterranean'],
    diningStyle: ['trendy', 'authentic'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['culture', 'fashion', 'travel'],
      atmosphere: 'vibrant'
    },
    personalityTraits: {
      extraversion: 4,
      openness: 4,
      adventurousness: 4
    }
  },
  {
    email: 'jack.brown@stanford.edu',
    firstName: 'Jack',
    lastName: 'Brown',
    nickname: 'Jack',
    birthDate: '1989-08-11',
    gender: 'male',
    zipCode: '94303',
    education: 'MBA',
    age: 34,
    interests: ['finance', 'cars', 'whiskey'],
    dietaryRestrictions: ['keto'],
    cuisinePreferences: ['steakhouse', 'brazilian', 'american'],
    diningStyle: ['upscale', 'business'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['business', 'cars', 'investing'],
      atmosphere: 'sophisticated'
    },
    personalityTraits: {
      extraversion: 4,
      openness: 2,
      adventurousness: 2
    }
  },
  {
    email: 'kate.miller@stanford.edu',
    firstName: 'Kate',
    lastName: 'Miller',
    nickname: 'Kate',
    birthDate: '1997-01-07',
    gender: 'female',
    zipCode: '94303',
    education: 'Bachelors',
    age: 26,
    interests: ['fitness', 'nutrition', 'podcasts'],
    dietaryRestrictions: ['paleo'],
    cuisinePreferences: ['healthy', 'poke', 'salads'],
    diningStyle: ['healthy', 'casual'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['health', 'wellness', 'personal_development'],
      atmosphere: 'relaxed'
    },
    personalityTraits: {
      extraversion: 3,
      openness: 3,
      adventurousness: 3
    }
  },
  {
    email: 'liam.davis@stanford.edu',
    firstName: 'Liam',
    lastName: 'Davis',
    nickname: 'Liam',
    birthDate: '1995-10-29',
    gender: 'male',
    zipCode: '94302',
    education: 'PhD',
    age: 28,
    interests: ['gaming', 'anime', 'technology'],
    dietaryRestrictions: ['lactose_intolerant'],
    cuisinePreferences: ['ramen', 'korean', 'burgers'],
    diningStyle: ['casual', 'authentic'],
    socialPreferences: {
      groupSize: '4-5',
      conversationTopics: ['gaming', 'technology', 'pop_culture'],
      atmosphere: 'casual'
    },
    personalityTraits: {
      extraversion: 2,
      openness: 4,
      adventurousness: 3
    }
  }
];

async function createPrivyUser(email: string) {
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
    if (error.message?.includes('already exists')) {
      // Try to get the existing user
      try {
        const users = await privy.getUsers({ email });
        if (users && users.length > 0) {
          console.log(`ℹ️  Privy user already exists: ${email} (ID: ${users[0].id})`);
          return users[0];
        }
      } catch (searchError) {
        console.error(`❌ Error searching for existing user ${email}:`, searchError);
      }
    }
    console.error(`❌ Error creating Privy user ${email}:`, error);
    return null;
  }
}

async function createDatabaseUser(userData: any, privyUserId: string) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', privyUserId)
      .single();

    if (existingUser) {
      console.log(`ℹ️  Database user already exists: ${userData.email}`);
      return existingUser.id;
    }

    // Create user in database
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: privyUserId,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        is_onboarded: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating database user ${userData.email}:`, error);
      return null;
    }

    console.log(`✅ Created database user: ${userData.email}`);
    return newUser.id;
  } catch (error) {
    console.error(`❌ Unexpected error creating database user:`, error);
    return null;
  }
}

async function createUserProfile(userData: any, userId: string) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      console.log(`ℹ️  Profile already exists for: ${userData.email}`);
      return true;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        age: userData.age,
        gender: userData.gender,
        education: userData.education,
        interests: userData.interests,
        zip_code: userData.zipCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Error creating profile for ${userData.email}:`, error);
      return false;
    }

    console.log(`✅ Created profile for: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error creating profile:`, error);
    return false;
  }
}

async function createUserPreferences(userData: any, userId: string) {
  try {
    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingPrefs) {
      console.log(`ℹ️  Preferences already exist for: ${userData.email}`);
      return true;
    }

    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        dietary_restrictions: userData.dietaryRestrictions,
        cuisine_preferences: userData.cuisinePreferences,
        dining_style: userData.diningStyle,
        social_preferences: userData.socialPreferences,
        personality_traits: userData.personalityTraits,
        location_preferences: {
          preferred_zip_codes: [userData.zipCode],
          max_distance_miles: 10
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Error creating preferences for ${userData.email}:`, error);
      return false;
    }

    console.log(`✅ Created preferences for: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error creating preferences:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting test user creation...\n');
  
  const createdUsers: { email: string; userId: string }[] = [];
  
  for (const userData of TEST_USERS) {
    console.log(`\n📝 Processing ${userData.email}...`);
    
    // 1. Create Privy user
    const privyUser = await createPrivyUser(userData.email);
    if (!privyUser) {
      console.log(`⚠️  Skipping ${userData.email} - Privy creation failed`);
      continue;
    }
    
    // 2. Create database user
    const userId = await createDatabaseUser(userData, privyUser.id);
    if (!userId) {
      console.log(`⚠️  Skipping ${userData.email} - Database user creation failed`);
      continue;
    }
    
    // 3. Create profile
    await createUserProfile(userData, userId);
    
    // 4. Create preferences
    await createUserPreferences(userData, userId);
    
    createdUsers.push({ email: userData.email, userId });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✨ Test user creation complete!');
  console.log(`Created/verified ${createdUsers.length} users`);
  console.log('\nUser IDs for reference:');
  createdUsers.forEach(user => {
    console.log(`  ${user.email}: ${user.userId}`);
  });
  
  // Save user IDs to a file for use by other scripts
  const fs = await import('fs');
  fs.writeFileSync(
    join(__dirname, 'test-user-ids.json'),
    JSON.stringify(createdUsers, null, 2)
  );
  console.log('\n📁 User IDs saved to test-user-ids.json');
}

// Run the script
main().catch(console.error);