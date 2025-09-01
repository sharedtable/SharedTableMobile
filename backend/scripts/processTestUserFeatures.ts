/**
 * Script to process all test users into embedding features
 * This will generate all the feature vectors needed for the matching algorithm
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
// import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini API configured');
} else {
  console.log('⚠️  Gemini API key not found - will use mock embeddings');
}

// Vocabularies for encoding
const VOCABULARIES = {
  datingPreferences: ['men', 'women', 'non-binary', 'all'],
  ethnicities: ['asian', 'black', 'hispanic', 'white', 'middle_eastern', 'native_american', 'pacific_islander', 'mixed', 'other'],
  relationshipTypes: ['casual_dating', 'serious_relationship', 'marriage', 'friendship', 'networking'],
  diningAtmospheres: ['casual', 'fine_dining', 'trendy', 'family_style', 'authentic', 'upscale', 'healthy', 'business', 'sports_bar', 'outdoor', 'quiet', 'farm_to_table'],
  socialMedia: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'youtube'],
  personalityRoles: ['leader', 'follower', 'mediator', 'innovator', 'analyzer', 'supporter', 'entertainer'],
  childrenPreference: ['yes', 'no', 'maybe', 'have_kids', 'no_preference'],
  relationshipStatus: ['single', 'divorced', 'widowed', 'separated', 'its_complicated'],
  gender: ['male', 'female', 'non-binary', 'prefer_not_to_say'],
  educationLevel: ['high_school', 'some_college', 'bachelors', 'masters', 'phd', 'mba', 'jd', 'md', 'other'],
  dietaryRestrictions: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'kosher', 'halal', 'pescatarian', 'keto', 'paleo', 'no_nuts', 'no_shellfish', 'lactose_intolerant'],
  cuisines: ['italian', 'thai', 'mediterranean', 'indian', 'mexican', 'french', 'japanese', 'steakhouse', 'vietnamese', 'chinese', 'korean', 'seafood', 'american', 'bbq', 'ethiopian', 'middle_eastern', 'brazilian', 'spanish', 'tapas', 'peruvian', 'sushi', 'healthy', 'poke', 'salads', 'ramen', 'burgers', 'farm_to_table']
};

// Education level mapping for normalization
const EDUCATION_LEVELS: { [key: string]: number } = {
  'high_school': 1,
  'some_college': 2,
  'bachelors': 3,
  'masters': 4,
  'phd': 5,
  'mba': 4,
  'jd': 5,
  'md': 5,
  'other': 1
};

// Social media frequency mapping
const _SOCIAL_MEDIA_FREQUENCY: { [key: string]: number } = {
  'never': 0,
  'monthly': 1,
  'weekly': 2,
  'few_times_week': 3,
  'daily': 4,
  'multiple_times_daily': 5
};

async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    // Return mock embedding for testing
    const mockEmbedding = new Array(1536).fill(0);
    // Add some variation based on text hash
    for (let i = 0; i < text.length; i++) {
      mockEmbedding[i % 1536] = (text.charCodeAt(i) % 100) / 100;
    }
    return mockEmbedding;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return mock embedding on error
    return new Array(1536).fill(0);
  }
}

function multiHotEncode(values: string[], vocabulary: string[]): number[] {
  const vector = new Array(vocabulary.length).fill(0);
  values.forEach(value => {
    const index = vocabulary.indexOf(value.toLowerCase().replace(/ /g, '_'));
    if (index !== -1) {
      vector[index] = 1;
    }
  });
  return vector;
}

function oneHotEncode(value: string, vocabulary: string[]): number[] {
  const vector = new Array(vocabulary.length).fill(0);
  const index = vocabulary.indexOf(value.toLowerCase().replace(/ /g, '_'));
  if (index !== -1) {
    vector[index] = 1;
  }
  return vector;
}

function normalizeOrdinal(value: number | string, mapping?: { [key: string]: number }, maxValue?: number): number {
  if (typeof value === 'number') {
    return maxValue ? value / maxValue : value / 10;
  }
  
  if (mapping && typeof value === 'string') {
    const mappedValue = mapping[value.toLowerCase()] || 0;
    const max = Math.max(...Object.values(mapping));
    return max > 0 ? mappedValue / max : 0;
  }
  
  return 0;
}

async function getCoordinatesFromZip(zipCode: string): Promise<{ lat: number, lng: number }> {
  // Stanford area coordinates as default
  const stanfordCoords = { lat: 37.4275, lng: -122.1697 };
  
  // Simple mapping for test zip codes
  const zipMapping: { [key: string]: { lat: number, lng: number } } = {
    '94301': { lat: 37.4419, lng: -122.1430 }, // Palo Alto
    '94302': { lat: 37.4180, lng: -122.1160 }, // East Palo Alto
    '94303': { lat: 37.4234, lng: -122.1068 }, // East Palo Alto
    '94304': { lat: 37.4331, lng: -122.1786 }, // Palo Alto North
    '94305': { lat: 37.4275, lng: -122.1697 }, // Stanford
    '94306': { lat: 37.4100, lng: -122.1400 }  // Palo Alto South
  };
  
  return zipMapping[zipCode] || stanfordCoords;
}

async function processUserFeatures(userId: string): Promise<any> {
  console.log(`Processing features for user ${userId}...`);
  
  // Fetch user data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!user || !profile || !preferences) {
    throw new Error(`Missing data for user ${userId}`);
  }
  
  const features: any = {
    userId,
    lastUpdated: new Date().toISOString(),
    featuresVersion: '1.0.0'
  };
  
  // Generate name embedding
  if (user.display_name) {
    console.log(`  Generating name embedding for "${user.display_name}"...`);
    features.nameEmbedding = await generateTextEmbedding(user.display_name);
  }
  
  // Process interests embeddings
  if (preferences.social_preferences?.interests) {
    features.interestsEmbeddings = {};
    for (const interest of preferences.social_preferences.interests) {
      console.log(`  Generating interest embedding for "${interest}"...`);
      features.interestsEmbeddings[interest] = await generateTextEmbedding(interest);
    }
  }
  
  // Process cuisine embeddings
  if (preferences.preferred_cuisines) {
    features.cuisineEmbeddings = {};
    for (const cuisine of preferences.preferred_cuisines) {
      console.log(`  Generating cuisine embedding for "${cuisine}"...`);
      features.cuisineEmbeddings[cuisine] = await generateTextEmbedding(cuisine);
    }
  }
  
  // Multi-hot encode dietary restrictions
  if (preferences.dietary_restrictions) {
    features.dietaryRestrictionsVector = multiHotEncode(
      preferences.dietary_restrictions,
      VOCABULARIES.dietaryRestrictions
    );
  }
  
  // Multi-hot encode dining atmospheres
  if (preferences.dining_atmospheres) {
    features.diningAtmospheresVector = multiHotEncode(
      preferences.dining_atmospheres,
      VOCABULARIES.diningAtmospheres
    );
  }
  
  // Multi-hot encode preferred cuisines
  if (preferences.preferred_cuisines) {
    features.preferredCuisinesVector = multiHotEncode(
      preferences.preferred_cuisines,
      VOCABULARIES.cuisines
    );
  }
  
  // One-hot encode gender
  if (profile.gender) {
    features.genderVector = oneHotEncode(
      profile.gender,
      VOCABULARIES.gender
    );
  }
  
  // One-hot encode education level
  if (profile.education_level) {
    features.educationVector = oneHotEncode(
      profile.education_level.toLowerCase(),
      VOCABULARIES.educationLevel
    );
    features.educationNormalized = normalizeOrdinal(
      profile.education_level,
      EDUCATION_LEVELS
    );
  }
  
  // Normalize social preferences
  if (preferences.social_preferences) {
    const socialPrefs = preferences.social_preferences;
    features.socialLevel = normalizeOrdinal(socialPrefs.social_level || 5, undefined, 10);
    features.adventureLevel = normalizeOrdinal(socialPrefs.adventure_level || 5, undefined, 10);
    features.formalityLevel = normalizeOrdinal(socialPrefs.formality_level || 5, undefined, 10);
  }
  
  // Process geographic data
  if (preferences.location_zip_code) {
    const coords = await getCoordinatesFromZip(preferences.location_zip_code);
    features.latitude = coords.lat;
    features.longitude = coords.lng;
  }
  
  // Process age data
  if (profile.birth_date) {
    const age = Math.floor(
      (Date.now() - new Date(profile.birth_date).getTime()) / 
      (365.25 * 24 * 60 * 60 * 1000)
    );
    features.age = age;
    features.ageMin = Math.max(18, age - 5);
    features.ageMax = age + 5;
  }
  
  // Add occupation text embedding
  if (profile.occupation) {
    console.log(`  Generating occupation embedding for "${profile.occupation}"...`);
    features.occupationEmbedding = await generateTextEmbedding(profile.occupation);
  }
  
  // Summary statistics
  features.featureStats = {
    totalEmbeddings: 
      (features.nameEmbedding ? 1 : 0) +
      (features.occupationEmbedding ? 1 : 0) +
      (features.interestsEmbeddings ? Object.keys(features.interestsEmbeddings).length : 0) +
      (features.cuisineEmbeddings ? Object.keys(features.cuisineEmbeddings).length : 0),
    totalVectors: 
      (features.dietaryRestrictionsVector ? 1 : 0) +
      (features.diningAtmospheresVector ? 1 : 0) +
      (features.preferredCuisinesVector ? 1 : 0) +
      (features.genderVector ? 1 : 0) +
      (features.educationVector ? 1 : 0),
    totalNormalizedValues: 
      (features.educationNormalized !== undefined ? 1 : 0) +
      (features.socialLevel !== undefined ? 1 : 0) +
      (features.adventureLevel !== undefined ? 1 : 0) +
      (features.formalityLevel !== undefined ? 1 : 0)
  };
  
  return features;
}

async function storeUserFeatures(features: any): Promise<void> {
  const { error } = await supabase
    .from('user_features')
    .upsert({
      user_id: features.userId,
      features: features,
      version: features.featuresVersion,
      processing_status: 'completed',
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
  
  if (error) {
    console.error('Error storing features:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Processing features for all test users...\n');
  
  // Load test users
  const testUsers = JSON.parse(
    fs.readFileSync(join(__dirname, 'test-users-created.json'), 'utf-8')
  );
  
  console.log(`Found ${testUsers.length} test users to process\n`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const { email, userId } of testUsers) {
    console.log(`\n📊 Processing ${email}...`);
    
    try {
      const features = await processUserFeatures(userId);
      await storeUserFeatures(features);
      
      results.push({
        email,
        userId,
        success: true,
        stats: features.featureStats
      });
      
      successCount++;
      console.log(`✅ Successfully processed features for ${email}`);
      console.log(`   Stats:`, features.featureStats);
      
    } catch (error) {
      console.error(`❌ Error processing ${email}:`, error);
      results.push({
        email,
        userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failCount++;
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Feature Processing Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${testUsers.length}`);
  
  // Save results
  fs.writeFileSync(
    join(__dirname, 'feature-processing-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📁 Results saved to feature-processing-results.json');
  
  // Verify in database
  const { data: storedFeatures, error: _error } = await supabase
    .from('user_features')
    .select('user_id, processing_status, version')
    .in('user_id', testUsers.map((u: any) => u.userId));
  
  if (storedFeatures) {
    console.log(`\n✅ Verified ${storedFeatures.length} feature sets in database`);
  }
}

main().catch(console.error);