/**
 * Process features specifically for Quinn Anderson
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

// Vocabularies for encoding
const VOCABULARIES = {
  diningAtmospheres: ['casual', 'fine_dining', 'trendy', 'family_style', 'authentic', 'upscale', 'healthy', 'business', 'sports_bar', 'outdoor', 'quiet', 'farm_to_table'],
  gender: ['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'],
  educationLevel: ['high_school', 'some_college', 'bachelors', 'masters', 'phd', 'mba', 'jd', 'md', 'other'],
  dietaryRestrictions: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'kosher', 'halal', 'pescatarian', 'keto', 'paleo', 'no_nuts', 'no_shellfish', 'lactose_intolerant'],
  cuisines: ['italian', 'thai', 'mediterranean', 'indian', 'mexican', 'french', 'japanese', 'steakhouse', 'vietnamese', 'chinese', 'korean', 'seafood', 'american', 'bbq', 'ethiopian', 'middle_eastern', 'brazilian', 'spanish', 'tapas', 'peruvian', 'sushi', 'healthy', 'poke', 'salads', 'ramen', 'burgers', 'farm_to_table']
};

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

function generateMockEmbedding(text: string): number[] {
  // Generate deterministic mock embedding based on text
  const mockEmbedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    mockEmbedding[i % 1536] = (text.charCodeAt(i) % 100) / 100;
  }
  return mockEmbedding;
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
  const normalizedValue = value.toLowerCase().replace(/ /g, '_');
  const index = vocabulary.indexOf(normalizedValue);
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

async function processQuinnFeatures() {
  console.log('📊 Processing features for Quinn Anderson...\n');
  
  // Get Quinn's data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'quinn.anderson@test.stanford.edu')
    .single();
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!profile || !preferences) {
    console.log('❌ Missing profile or preferences');
    return;
  }
  
  console.log('✅ Found user data');
  console.log(`   Name: ${user.display_name}`);
  console.log(`   Gender: ${profile.gender}`);
  console.log(`   Education: ${profile.education_level}`);
  console.log(`   Occupation: ${profile.occupation}`);
  
  const features: any = {
    userId: user.id,
    lastUpdated: new Date().toISOString(),
    featuresVersion: '1.0.0'
  };
  
  // Generate name embedding
  console.log(`\n📝 Generating embeddings...`);
  features.nameEmbedding = generateMockEmbedding(user.display_name || 'Quinn Anderson');
  
  // Process interests embeddings
  if (preferences.social_preferences?.interests) {
    features.interestsEmbeddings = {};
    for (const interest of preferences.social_preferences.interests) {
      console.log(`   - Interest: ${interest}`);
      features.interestsEmbeddings[interest] = generateMockEmbedding(interest);
    }
  }
  
  // Process cuisine embeddings
  if (preferences.preferred_cuisines) {
    features.cuisineEmbeddings = {};
    for (const cuisine of preferences.preferred_cuisines) {
      console.log(`   - Cuisine: ${cuisine}`);
      features.cuisineEmbeddings[cuisine] = generateMockEmbedding(cuisine);
    }
  }
  
  // Multi-hot encode dietary restrictions
  if (preferences.dietary_restrictions) {
    features.dietaryRestrictionsVector = multiHotEncode(
      preferences.dietary_restrictions,
      VOCABULARIES.dietaryRestrictions
    );
    console.log(`   - Dietary restrictions vector: ${preferences.dietary_restrictions.join(', ')}`);
  }
  
  // Multi-hot encode dining atmospheres
  if (preferences.dining_atmospheres) {
    features.diningAtmospheresVector = multiHotEncode(
      preferences.dining_atmospheres,
      VOCABULARIES.diningAtmospheres
    );
    console.log(`   - Dining atmospheres vector: ${preferences.dining_atmospheres.join(', ')}`);
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
    console.log(`   - Gender vector encoded: ${profile.gender}`);
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
    console.log(`   - Education normalized: ${profile.education_level}`);
  }
  
  // Normalize social preferences
  if (preferences.social_preferences) {
    const socialPrefs = preferences.social_preferences;
    features.socialLevel = normalizeOrdinal(socialPrefs.social_level || 6, undefined, 10);
    features.adventureLevel = normalizeOrdinal(socialPrefs.adventure_level || 8, undefined, 10);
    features.formalityLevel = normalizeOrdinal(socialPrefs.formality_level || 3, undefined, 10);
    console.log(`   - Social levels: ${socialPrefs.social_level}/10, ${socialPrefs.adventure_level}/10, ${socialPrefs.formality_level}/10`);
  }
  
  // Process geographic data
  if (preferences.location_zip_code) {
    // Use fixed coordinates for test
    const coords = { lat: 37.4331, lng: -122.1786 }; // Palo Alto North
    features.latitude = coords.lat;
    features.longitude = coords.lng;
    console.log(`   - Location: ${preferences.location_zip_code} (${coords.lat}, ${coords.lng})`);
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
    console.log(`   - Age: ${age} (range: ${features.ageMin}-${features.ageMax})`);
  }
  
  // Add occupation embedding
  if (profile.occupation) {
    features.occupationEmbedding = generateMockEmbedding(profile.occupation);
    console.log(`   - Occupation: ${profile.occupation}`);
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
  
  console.log('\n📊 Feature Statistics:');
  console.log(`   - Total embeddings: ${features.featureStats.totalEmbeddings}`);
  console.log(`   - Total vectors: ${features.featureStats.totalVectors}`);
  console.log(`   - Total normalized values: ${features.featureStats.totalNormalizedValues}`);
  
  // Store features in database
  console.log('\n💾 Storing features in database...');
  const { error } = await supabase
    .from('user_features')
    .upsert({
      user_id: user.id,
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
    console.log('❌ Error storing features:', error.message);
  } else {
    console.log('✅ Features stored successfully!');
  }
}

async function main() {
  await processQuinnFeatures();
  
  // Verify all 20 users now have features
  console.log('\n📊 Final verification...');
  const { data: features } = await supabase
    .from('user_features')
    .select('user_id, processing_status')
    .eq('processing_status', 'completed');
  
  console.log(`✅ Total users with completed features: ${features?.length}/20`);
  
  if (features?.length === 20) {
    console.log('\n🎉 ALL 20 TEST USERS NOW HAVE PROCESSED FEATURES!');
    console.log('🚀 Ready to run the matching algorithm!');
  }
}

main().catch(console.error);