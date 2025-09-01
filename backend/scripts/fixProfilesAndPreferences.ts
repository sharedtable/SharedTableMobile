/**
 * Script to fix profiles and preferences for test users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_DATA = {
  'alice.chen@test.stanford.edu': {
    birth_date: '1995-03-15',
    gender: 'female',
    education_level: 'Masters',
    occupation: 'Software Engineer',
    dietary_restrictions: ['vegetarian'],
    preferred_cuisines: ['italian', 'thai', 'mediterranean'],
    dining_atmospheres: ['casual', 'trendy']
  },
  'bob.kumar@test.stanford.edu': {
    birth_date: '1994-07-22',
    gender: 'male',
    education_level: 'PhD',
    occupation: 'AI Researcher',
    dietary_restrictions: ['vegetarian', 'no_nuts'],
    preferred_cuisines: ['indian', 'italian', 'mexican'],
    dining_atmospheres: ['casual', 'family_style']
  },
  'carol.smith@test.stanford.edu': {
    birth_date: '1990-11-08',
    gender: 'female',
    education_level: 'MBA',
    occupation: 'Investment Banker',
    dietary_restrictions: [],
    preferred_cuisines: ['french', 'japanese', 'steakhouse'],
    dining_atmospheres: ['fine_dining', 'business']
  },
  'david.johnson@test.stanford.edu': {
    birth_date: '1988-05-20',
    gender: 'male',
    education_level: 'MBA',
    occupation: 'Venture Capitalist',
    dietary_restrictions: [],
    preferred_cuisines: ['french', 'italian', 'american'],
    dining_atmospheres: ['fine_dining', 'upscale']
  },
  'emma.garcia@test.stanford.edu': {
    birth_date: '1992-09-30',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Graphic Designer',
    dietary_restrictions: ['gluten_free'],
    preferred_cuisines: ['mexican', 'vietnamese', 'mediterranean'],
    dining_atmospheres: ['trendy', 'casual']
  },
  'frank.lee@test.stanford.edu': {
    birth_date: '1993-02-14',
    gender: 'male',
    education_level: 'Masters',
    occupation: 'Film Director',
    dietary_restrictions: ['pescatarian'],
    preferred_cuisines: ['japanese', 'korean', 'seafood'],
    dining_atmospheres: ['trendy', 'authentic']
  },
  'grace.wang@test.stanford.edu': {
    birth_date: '1996-06-18',
    gender: 'female',
    education_level: 'PhD',
    occupation: 'Research Scientist',
    dietary_restrictions: ['vegan'],
    preferred_cuisines: ['chinese', 'thai', 'ethiopian'],
    dining_atmospheres: ['casual', 'healthy']
  },
  'henry.taylor@test.stanford.edu': {
    birth_date: '1991-12-03',
    gender: 'male',
    education_level: 'Masters',
    occupation: 'Sports Manager',
    dietary_restrictions: [],
    preferred_cuisines: ['bbq', 'mexican', 'american'],
    dining_atmospheres: ['casual', 'sports_bar']
  },
  'iris.patel@test.stanford.edu': {
    birth_date: '1994-04-25',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Fashion Designer',
    dietary_restrictions: ['halal'],
    preferred_cuisines: ['middle_eastern', 'indian', 'mediterranean'],
    dining_atmospheres: ['trendy', 'authentic']
  },
  'jack.brown@test.stanford.edu': {
    birth_date: '1989-08-11',
    gender: 'male',
    education_level: 'MBA',
    occupation: 'Financial Advisor',
    dietary_restrictions: ['keto'],
    preferred_cuisines: ['steakhouse', 'brazilian', 'american'],
    dining_atmospheres: ['upscale', 'business']
  },
  'kate.miller@test.stanford.edu': {
    birth_date: '1997-01-07',
    gender: 'female',
    education_level: 'Bachelors',
    occupation: 'Fitness Instructor',
    dietary_restrictions: ['paleo'],
    preferred_cuisines: ['healthy', 'poke', 'salads'],
    dining_atmospheres: ['healthy', 'casual']
  },
  'liam.davis@test.stanford.edu': {
    birth_date: '1995-10-29',
    gender: 'male',
    education_level: 'PhD',
    occupation: 'Game Developer',
    dietary_restrictions: ['lactose_intolerant'],
    preferred_cuisines: ['ramen', 'korean', 'burgers'],
    dining_atmospheres: ['casual', 'authentic']
  }
};

async function fixProfiles() {
  console.log('📝 Fixing user profiles...\n');
  
  for (const [email, data] of Object.entries(USER_DATA)) {
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
    
    // Update or create profile (age_years is calculated automatically)
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
  console.log('\n📝 Fixing user preferences...\n');
  
  for (const [email, data] of Object.entries(USER_DATA)) {
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!user) continue;
    
    // Update preferences - user_id is TEXT in the schema
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        dietary_restrictions: data.dietary_restrictions,
        preferred_cuisines: data.preferred_cuisines,
        dining_atmospheres: data.dining_atmospheres,
        location_zip_code: '94305',
        max_travel_distance: 10,
        group_size_preference: 'small_group',
        preferred_times: ['evening'],
        preferred_days: ['friday', 'saturday'],
        social_preferences: {
          interests: ['dining', 'socializing'],
          social_level: 7,
          adventure_level: 7,
          formality_level: 5
        },
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

async function main() {
  console.log('🔧 Fixing profiles and preferences for test users...\n');
  
  await fixProfiles();
  await fixPreferences();
  
  console.log('\n✨ Done! Check your database to verify.');
}

main().catch(console.error);