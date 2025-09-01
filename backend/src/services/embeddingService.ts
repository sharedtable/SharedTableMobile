/**
 * Real-time embedding generation service
 * Processes user data into features as they complete their profiles
 */

import axios from 'axios';
import { supabase } from '../config/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface UserFeatures {
  userId: string;
  // Text embeddings (1536-dimensional)
  nameEmbedding?: number[];
  interestsEmbeddings?: { [key: string]: number[] };
  cuisineEmbeddings?: { [key: string]: number[] };
  
  // Multi-hot encoded vectors
  datingPreferencesVector?: number[];
  ethnicityPreferencesVector?: number[];
  relationshipTypesVector?: number[];
  diningAtmospheresVector?: number[];
  socialMediaVector?: number[];
  personalityRolesVector?: number[];
  
  // One-hot encoded vectors
  childrenPreferenceVector?: number[];
  relationshipStatusVector?: number[];
  genderVector?: number[];
  
  // Normalized ordinals (0-1 scale)
  educationNormalized?: number;
  socialMediaFrequencyNormalized?: number;
  spicyFoodPreference?: number;
  alcoholPreference?: number;
  diningAdventurousness?: number;
  conversationInitiation?: number;
  compromiseWillingness?: number;
  newExperiencesSeeking?: number;
  earlyBirdNightOwl?: number;
  activityLevel?: number;
  punctuality?: number;
  
  // Geographic features
  latitude?: number;
  longitude?: number;
  
  // Derived features
  ageMin?: number;
  ageMax?: number;
  
  // Metadata
  lastUpdated: string;
  featuresVersion: string;
}

// Vocabularies for multi-hot and one-hot encoding
const VOCABULARIES = {
  datingPreferences: [
    'men', 'women', 'non-binary', 'all'
  ],
  ethnicities: [
    'asian', 'black', 'hispanic', 'white', 'middle_eastern', 
    'native_american', 'pacific_islander', 'mixed', 'other'
  ],
  relationshipTypes: [
    'casual_dating', 'serious_relationship', 'marriage', 
    'friendship', 'networking'
  ],
  diningAtmospheres: [
    'casual', 'fine_dining', 'trendy', 'family_style', 
    'authentic', 'upscale', 'healthy', 'business', 'sports_bar'
  ],
  socialMedia: [
    'instagram', 'facebook', 'twitter', 'linkedin', 
    'tiktok', 'snapchat', 'youtube'
  ],
  personalityRoles: [
    'leader', 'follower', 'mediator', 'innovator', 
    'analyzer', 'supporter', 'entertainer'
  ],
  childrenPreference: [
    'yes', 'no', 'maybe', 'have_kids', 'no_preference'
  ],
  relationshipStatus: [
    'single', 'divorced', 'widowed', 'separated', 'its_complicated'
  ],
  gender: [
    'male', 'female', 'non-binary', 'prefer_not_to_say'
  ]
};

// Education level mapping for normalization
const EDUCATION_LEVELS = {
  'high_school': 1,
  'some_college': 2,
  'bachelors': 3,
  'masters': 4,
  'phd': 5,
  'other': 1
};

// Social media frequency mapping
const SOCIAL_MEDIA_FREQUENCY = {
  'never': 0,
  'monthly': 1,
  'weekly': 2,
  'few_times_week': 3,
  'daily': 4,
  'multiple_times_daily': 5
};

export class EmbeddingService {
  private genAI: GoogleGenerativeAI | null = null;
  private dataProcessorUrl: string;
  
  constructor() {
    this.dataProcessorUrl = process.env.DATA_PROCESSOR_URL || 'http://localhost:8001';
    
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }
  
  /**
   * Generate text embedding using Google Gemini
   */
  private async generateTextEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      console.warn('Gemini API not configured, returning zero vector');
      return new Array(1536).fill(0);
    }
    
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return new Array(1536).fill(0);
    }
  }
  
  /**
   * Multi-hot encode a list of values
   */
  private multiHotEncode(
    values: string[], 
    vocabulary: string[]
  ): number[] {
    const vector = new Array(vocabulary.length).fill(0);
    values.forEach(value => {
      const index = vocabulary.indexOf(value.toLowerCase());
      if (index !== -1) {
        vector[index] = 1;
      }
    });
    return vector;
  }
  
  /**
   * One-hot encode a single value
   */
  private oneHotEncode(
    value: string, 
    vocabulary: string[]
  ): number[] {
    const vector = new Array(vocabulary.length).fill(0);
    const index = vocabulary.indexOf(value.toLowerCase());
    if (index !== -1) {
      vector[index] = 1;
    }
    return vector;
  }
  
  /**
   * Normalize ordinal value to 0-1 range
   */
  private normalizeOrdinal(
    value: number | string, 
    mapping?: { [key: string]: number },
    maxValue?: number
  ): number {
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
  
  /**
   * Get geocoordinates from zip code
   */
  private async getCoordinatesFromZip(zipCode: string): Promise<{ lat: number, lng: number }> {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      // Default to Stanford area
      return { lat: 37.4275, lng: -122.1697 };
    }
    
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: zipCode,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        }
      );
      
      if (response.data.results?.[0]?.geometry?.location) {
        return response.data.results[0].geometry.location;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return { lat: 37.4275, lng: -122.1697 };
  }
  
  /**
   * Process user profile data into features
   */
  async processUserProfile(userId: string): Promise<UserFeatures> {
    // Fetch user data from database
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
    
    const { data: user } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();
    
    const features: UserFeatures = {
      userId,
      lastUpdated: new Date().toISOString(),
      featuresVersion: '1.0.0'
    };
    
    // Generate name embedding
    if (user?.display_name) {
      features.nameEmbedding = await this.generateTextEmbedding(user.display_name);
    }
    
    // Process interests embeddings
    if (preferences?.social_preferences?.interests) {
      features.interestsEmbeddings = {};
      for (const interest of preferences.social_preferences.interests) {
        features.interestsEmbeddings[interest] = await this.generateTextEmbedding(interest);
      }
    }
    
    // Process cuisine embeddings
    if (preferences?.preferred_cuisines) {
      features.cuisineEmbeddings = {};
      for (const cuisine of preferences.preferred_cuisines) {
        features.cuisineEmbeddings[cuisine] = await this.generateTextEmbedding(cuisine);
      }
    }
    
    // Multi-hot encode preferences
    if (preferences?.dining_atmospheres) {
      features.diningAtmospheresVector = this.multiHotEncode(
        preferences.dining_atmospheres,
        VOCABULARIES.diningAtmospheres
      );
    }
    
    // One-hot encode categorical data
    if (profile?.gender) {
      features.genderVector = this.oneHotEncode(
        profile.gender,
        VOCABULARIES.gender
      );
    }
    
    if (profile?.relationship_status) {
      features.relationshipStatusVector = this.oneHotEncode(
        profile.relationship_status,
        VOCABULARIES.relationshipStatus
      );
    }
    
    // Normalize ordinal data
    if (profile?.education_level) {
      features.educationNormalized = this.normalizeOrdinal(
        profile.education_level,
        EDUCATION_LEVELS
      );
    }
    
    if (preferences?.social_preferences) {
      const socialPrefs = preferences.social_preferences;
      features.socialMediaFrequencyNormalized = this.normalizeOrdinal(
        socialPrefs.social_media_frequency || 'weekly',
        SOCIAL_MEDIA_FREQUENCY
      );
      features.activityLevel = this.normalizeOrdinal(socialPrefs.activity_level || 5, undefined, 10);
      features.conversationInitiation = this.normalizeOrdinal(socialPrefs.social_level || 5, undefined, 10);
      features.newExperiencesSeeking = this.normalizeOrdinal(socialPrefs.adventure_level || 5, undefined, 10);
    }
    
    // Process geographic data
    if (preferences?.location_zip_code) {
      const coords = await this.getCoordinatesFromZip(preferences.location_zip_code);
      features.latitude = coords.lat;
      features.longitude = coords.lng;
    }
    
    // Process age data
    if (profile?.birth_date) {
      const age = Math.floor(
        (Date.now() - new Date(profile.birth_date).getTime()) / 
        (365.25 * 24 * 60 * 60 * 1000)
      );
      features.ageMin = age - 2; // Default range
      features.ageMax = age + 2;
    }
    
    return features;
  }
  
  /**
   * Store generated features in database
   */
  async storeUserFeatures(features: UserFeatures): Promise<void> {
    const { error } = await supabase
      .from('user_features')
      .upsert({
        user_id: features.userId,
        features: features,
        version: features.featuresVersion,
        created_at: features.lastUpdated,
        updated_at: features.lastUpdated
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error storing user features:', error);
      throw error;
    }
  }
  
  /**
   * Process all users for a time slot (batch processing)
   */
  async processTimeSlotUsers(timeSlotId: string): Promise<void> {
    // Get all users signed up for this time slot
    const { data: signups } = await supabase
      .from('time_slot_signups')
      .select('user_id')
      .eq('time_slot_id', timeSlotId);
    
    if (!signups || signups.length === 0) {
      throw new Error('No users found for time slot');
    }
    
    // Process each user's features
    const processingPromises = signups.map(async (signup) => {
      try {
        const features = await this.processUserProfile(signup.user_id);
        await this.storeUserFeatures(features);
        return { userId: signup.user_id, success: true };
      } catch (error) {
        console.error(`Error processing user ${signup.user_id}:`, error);
        return { userId: signup.user_id, success: false, error };
      }
    });
    
    const results = await Promise.all(processingPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Processed ${successful} users successfully, ${failed} failed`);
  }
  
  /**
   * Call data processor service for batch processing
   */
  async callDataProcessor(userData: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.dataProcessorUrl}/api/v1/process-dataframe`,
        {
          data: userData,
          output_format: 'json',
          include_vocabs: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error calling data processor:', error);
      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();