/**
 * Integration service for SharedTable Matching Algorithm
 * Orchestrates calls to the 5 microservices for group matching
 */

import axios, { AxiosError } from 'axios';
import { supabaseService as supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Service URLs - these run on fixed ports
const SERVICE_URLS = {
  dataProcessor: 'http://localhost:8000',
  userPreferences: 'http://localhost:8001',
  peopleMatcher: 'http://localhost:8002',
  groupAggregator: 'http://localhost:8004',
  restaurantMatcher: 'http://localhost:8005'
} as const;

// Type definitions
interface ProcessedUser {
  user_id: string;
  name: string;
  dietary_restrictions: string[];
  budget: 'low' | 'medium' | 'high';
  location: { lat: number; lng: number };
  preference_vector: number[];
}

interface Group {
  group_id: string;
  members: string[];
  size: number;
  compatibility_score: number;
}

interface Restaurant {
  restaurant_id: string;
  name: string;
  cuisine_vector: number[];
  dietary_options: string[];
  price_range: { min: number; max: number };
  location: { lat: number; lng: number };
  capacity: number;
  rating: number;
}

interface GroupProfile {
  group_id: string;
  aggregated_preference_vector: number[];
  dietary_restrictions: string[];
  budget_range: { min: number; max: number };
  member_count: number;
}

interface RestaurantMatch {
  group_id: string;
  restaurant_id: string;
  restaurant_name: string;
  similarity_score: number;
  distance_km: number;
  match_reasons: string[];
}

interface MatchingResult {
  success: boolean;
  groups: Group[];
  matches: RestaurantMatch[];
  unmatchedGroups?: number;
  error?: string;
}

interface HealthStatus {
  [key: string]: boolean;
}

interface UserFeatureData {
  locationNormalized?: number;
  ethnicityVector?: number[];
  cuisineTypesVector?: number[];
  socialLevel?: number;
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  [key: string]: unknown;
}

interface UserData {
  id: string;
  display_name?: string;
  user_features?: {
    features: Record<string, unknown>;
  };
  user_profiles?: {
    location?: string;
    ethnicity?: string;
    food_preferences?: {
      favorite_cuisines?: string[];
    };
    dietary_restrictions?: string[];
    preferred_price_range?: [number, number];
    zipcode?: string;
  };
}

/**
 * Service for integrating with SharedTable matching microservices
 */
export class SharedTableMatchingService {
  /**
   * Initialize the matching job service
   */
  static initialize(): void {
    logger.info('Initializing SharedTable Matching Service');
    // Any initialization logic can go here
    // For now, just log that we're ready
  }

  /**
   * Shutdown the matching job service gracefully
   */
  static shutdown(): void {
    logger.info('Shutting down SharedTable Matching Service');
    // Any cleanup logic can go here
    // For now, just log that we're shutting down
  }

  /**
   * Check if all services are healthy
   */
  static async checkServicesHealth(): Promise<HealthStatus> {
    const health: HealthStatus = {};
    
    const checks = [
      { name: 'dataProcessor', url: `${SERVICE_URLS.dataProcessor}/api/v1/health` },
      { name: 'userPreferences', url: `${SERVICE_URLS.userPreferences}/health` },
      { name: 'peopleMatcher', url: `${SERVICE_URLS.peopleMatcher}/api/v1/health` },
      { name: 'groupAggregator', url: `${SERVICE_URLS.groupAggregator}/health` },
      { name: 'restaurantMatcher', url: `${SERVICE_URLS.restaurantMatcher}/health` }
    ];
    
    for (const check of checks) {
      try {
        const response = await axios.get(check.url, { timeout: 2000 });
        health[check.name] = response.status === 200;
      } catch (_error) {
        health[check.name] = false;
        logger.warn(`Service ${check.name} is not responding`);
      }
    }
    
    return health;
  }
  
  /**
   * Convert our user features to 768-dimensional embeddings
   * The service expects specific named embeddings for food preferences
   */
  static async convertToEmbeddings(userId: string): Promise<Record<string, unknown>> {
    // Fetch user data with features
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        user_features(features),
        user_profiles(*)
      `)
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      throw new Error(`User ${userId} not found: ${error?.message}`);
    }
    
    const userData = user as UserData;
    const features = userData.user_features?.features || {};
    const preferences = userData.user_profiles;
    
    // Helper to generate consistent 768-dim embeddings
    const generateEmbedding = (seed: string, baseValues: number[] = []): number[] => {
      const embedding = new Array(768).fill(0);
      
      // Use a simple hash to generate consistent values
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Fill with consistent values between 0.1 and 0.5
      const baseValue = 0.1 + (Math.abs(hash) % 40) / 100;
      for (let i = 0; i < 768; i++) {
        embedding[i] = baseValue + (Math.sin(i * 0.1) * 0.05);
        embedding[i] = Math.max(0.05, Math.min(0.55, embedding[i]));
      }
      
      // Override with actual values if provided
      baseValues.forEach((val, idx) => {
        if (idx < 768 && typeof val === 'number' && !isNaN(val)) {
          embedding[idx] = Math.max(0.05, Math.min(0.95, val));
        }
      });
      
      return embedding;
    };
    
    // Build the request object for the service
    const result: Record<string, unknown> = {
      user_id: userId
    };
    
    // Map our features to the expected embedding names
    
    // 1. Nationality embedding (based on location from profile)
    const featureData = features as UserFeatureData;
    if (preferences?.location || featureData.locationNormalized) {
      result.nationality_embedding = generateEmbedding(
        `nationality_${preferences?.location || 'US'}`,
        featureData.locationNormalized ? [featureData.locationNormalized] : []
      );
    }
    
    // 2. Ethnicity embedding (based on cultural preferences in profile)
    if (preferences?.ethnicity || featureData.ethnicityVector) {
      result.ethnicity_embedding = generateEmbedding(
        `ethnicity_${preferences?.ethnicity || 'diverse'}`,
        featureData.ethnicityVector || []
      );
    }
    
    // 3. Food craving embedding (based on cuisine preferences)
    if (featureData.cuisineTypesVector || preferences?.food_preferences?.favorite_cuisines) {
      result.food_craving_embedding = generateEmbedding(
        `craving_${userId}`,
        featureData.cuisineTypesVector || []
      );
    }
    
    // 4. Cuisine interests (up to 5 items based on favorite cuisines)
    const favCuisines = preferences?.food_preferences?.favorite_cuisines || [];
    const cuisineTypes = ['Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian'];
    
    for (let i = 0; i < Math.min(5, Math.max(favCuisines.length, 2)); i++) {
      const cuisineName = favCuisines[i] || cuisineTypes[i];
      result[`cuisine_interests_item_${i + 1}`] = generateEmbedding(
        `cuisine_${cuisineName}_${i}`,
        []
      );
    }
    
    // Ensure at least one embedding is provided
    if (!result.nationality_embedding && 
        !result.ethnicity_embedding && 
        !result.food_craving_embedding && 
        !result.cuisine_interests_item_1) {
      // Provide a default embedding based on all available features
      result.food_craving_embedding = generateEmbedding(
        `default_${userId}`,
        [
          featureData.socialLevel || 0.5,
          featureData.openness || 0.5,
          featureData.conscientiousness || 0.5,
          featureData.extraversion || 0.5,
          featureData.agreeableness || 0.5
        ]
      );
    }
    
    return result;
  }
  
  /**
   * Step 1: Process user preferences to get preference vectors
   */
  static async processUserPreferences(userIds: string[]): Promise<Map<string, number[]>> {
    logger.info(`Processing preferences for ${userIds.length} users`);
    
    const preferenceVectors = new Map<string, number[]>();
    
    // Process each user
    for (const userId of userIds) {
      try {
        // Convert our features to embeddings
        const embeddings = await this.convertToEmbeddings(userId);
        
        // Call the user preferences service
        const response = await axios.post(
          `${SERVICE_URLS.userPreferences}/process-user`,
          embeddings
        );
        
        if (response.data?.preference_vector) {
          preferenceVectors.set(userId, response.data.preference_vector);
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error(`Error processing user ${userId}:`, axiosError.message);
      }
    }
    
    return preferenceVectors;
  }
  
  /**
   * Step 2: Match people into groups
   */
  static async matchPeople(
    userIds: string[],
    preferenceVectors: Map<string, number[]>
  ): Promise<Group[]> {
    logger.info(`Matching ${userIds.length} people into groups`);
    
    // Prepare participants data
    const participants: ProcessedUser[] = [];
    
    for (const userId of userIds) {
      const preferenceVector = preferenceVectors.get(userId);
      if (!preferenceVector) continue;
      
      // Fetch user data
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      const { data: preferences } = await supabase
        .from('onboarding_profiles')
        .select('dietary_restrictions, preferred_price_range, zipcode')
        .eq('user_id', userId)
        .single();
      
      // Determine budget from price range
      let budget: 'low' | 'medium' | 'high' = 'medium';
      if (preferences?.preferred_price_range) {
        const maxPrice = preferences.preferred_price_range[1];
        if (maxPrice <= 30) budget = 'low';
        else if (maxPrice <= 60) budget = 'medium';
        else budget = 'high';
      }
      
      // Get location coordinates
      const location = await this.getLocationForZip(preferences?.zipcode || '94305');
      
      participants.push({
        user_id: userId,
        name: user?.display_name || 'Unknown',
        dietary_restrictions: preferences?.dietary_restrictions || [],
        budget,
        location,
        preference_vector: preferenceVector
      });
    }
    
    // Call people matcher service
    const response = await axios.post(
      `${SERVICE_URLS.peopleMatcher}/api/v1/match`,
      { participants }
    );
    
    return response.data.groups || [];
  }
  
  /**
   * Step 3: Aggregate group preferences
   */
  static async aggregateGroupPreferences(
    groups: Group[],
    preferenceVectors: Map<string, number[]>
  ): Promise<Map<string, GroupProfile>> {
    logger.info(`Aggregating preferences for ${groups.length} groups`);
    
    const groupProfiles = new Map<string, GroupProfile>();
    
    for (const group of groups) {
      // Prepare member data
      const members = [];
      
      for (const userId of group.members) {
        const preferenceVector = preferenceVectors.get(userId);
        if (!preferenceVector) continue;
        
        const { data: preferences } = await supabase
          .from('onboarding_profiles')
          .select('dietary_restrictions, preferred_price_range')
          .eq('user_id', userId)
          .single();
        
        let budget: 'low' | 'medium' | 'high' = 'medium';
        if (preferences?.preferred_price_range) {
          const maxPrice = preferences.preferred_price_range[1];
          if (maxPrice <= 30) budget = 'low';
          else if (maxPrice <= 60) budget = 'medium';
          else budget = 'high';
        }
        
        members.push({
          user_id: userId,
          dietary_restrictions: preferences?.dietary_restrictions || [],
          budget,
          preference_vector: preferenceVector
        });
      }
      
      // Call group aggregator service
      const response = await axios.post(
        `${SERVICE_URLS.groupAggregator}/aggregate-group`,
        {
          group_id: group.group_id,
          members
        }
      );
      
      groupProfiles.set(group.group_id, response.data);
    }
    
    return groupProfiles;
  }
  
  /**
   * Step 4: Match groups to restaurants
   */
  static async matchToRestaurants(
    groups: Group[],
    groupProfiles: Map<string, GroupProfile>
  ): Promise<{ matches: RestaurantMatch[]; unmatched_groups: string[] }> {
    logger.info(`Matching ${groups.length} groups to restaurants`);
    
    // Prepare group data
    const groupData = [];
    
    for (const group of groups) {
      const profile = groupProfiles.get(group.group_id);
      if (!profile) continue;
      
      // Get average location of group members
      const locations = await Promise.all(
        group.members.map(async (userId) => {
          const { data: prefs } = await supabase
            .from('onboarding_profiles')
            .select('zipcode')
            .eq('user_id', userId)
            .single();
          
          return this.getLocationForZip(prefs?.zipcode || '94305');
        })
      );
      
      const avgLocation = {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
      };
      
      groupData.push({
        group_id: group.group_id,
        preference_vector: profile.aggregated_preference_vector,
        dietary_restrictions: profile.dietary_restrictions,
        budget_range: profile.budget_range,
        location: avgLocation
      });
    }
    
    // Get restaurants from our database or use mock data
    const restaurants = await this.getRestaurantsWithVectors();
    
    // Call restaurant matcher service
    const response = await axios.post(
      `${SERVICE_URLS.restaurantMatcher}/match-groups`,
      {
        groups: groupData,
        restaurants,
        max_distance_km: 10.0
      }
    );
    
    return response.data;
  }
  
  /**
   * Main orchestration function - runs the complete matching pipeline
   */
  static async runCompleteMatching(timeSlotId: string): Promise<MatchingResult> {
    try {
      // Check services health
      const health = await this.checkServicesHealth();
      const allHealthy = Object.values(health).every((h) => h);
      
      if (!allHealthy) {
        const unhealthy = Object.entries(health)
          .filter(([, h]) => !h)
          .map(([name]) => name);
        
        throw new Error(`Services not available: ${unhealthy.join(', ')}`);
      }
      
      // Get users signed up for the time slot
      const { data: signups, error: signupError } = await supabase
        .from('dinner_bookings')
        .select('user_id')
        .eq('timeslot_id', timeSlotId)
        .eq('status', 'confirmed');
      
      if (signupError) {
        throw new Error(`Failed to fetch signups: ${signupError.message}`);
      }
      
      if (!signups || signups.length < 12) {
        throw new Error(`Need at least 12 participants, found ${signups?.length || 0}`);
      }
      
      const userIds = signups.map((s: { user_id: string }) => s.user_id);
      
      // Step 1: Process user preferences
      const preferenceVectors = await this.processUserPreferences(userIds);
      
      // Step 2: Match people into groups
      const groups = await this.matchPeople(userIds, preferenceVectors);
      
      // Step 3: Aggregate group preferences
      const groupProfiles = await this.aggregateGroupPreferences(groups, preferenceVectors);
      
      // Step 4: Match to restaurants
      const restaurantMatches = await this.matchToRestaurants(groups, groupProfiles);
      
      // Store results in database
      await this.storeMatchingResults(timeSlotId, groups, restaurantMatches);
      
      return {
        success: true,
        groups,
        matches: restaurantMatches.matches || [],
        unmatchedGroups: restaurantMatches.unmatched_groups?.length || 0
      };
      
    } catch (error) {
      logger.error('Matching pipeline error:', error);
      return {
        success: false,
        groups: [],
        matches: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Helper: Get location coordinates for zip code
   */
  private static async getLocationForZip(zipCode: string): Promise<{ lat: number; lng: number }> {
    // Simple mapping for test zip codes
    const zipMapping: { [key: string]: { lat: number; lng: number } } = {
      '94301': { lat: 37.4419, lng: -122.1430 },
      '94302': { lat: 37.4180, lng: -122.1160 },
      '94303': { lat: 37.4234, lng: -122.1068 },
      '94304': { lat: 37.4331, lng: -122.1786 },
      '94305': { lat: 37.4275, lng: -122.1697 },
      '94306': { lat: 37.4100, lng: -122.1400 }
    };
    
    return zipMapping[zipCode] || { lat: 37.4275, lng: -122.1697 };
  }
  
  /**
   * Helper: Get restaurants with cuisine vectors
   */
  private static async getRestaurantsWithVectors(): Promise<Restaurant[]> {
    // For now, return mock restaurants with random vectors
    // In production, these would come from a restaurant embedding service
    
    const mockRestaurants: Restaurant[] = [
      {
        restaurant_id: 'rest_1',
        name: 'The Italian Kitchen',
        cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
        dietary_options: ['vegetarian', 'vegan', 'gluten-free'],
        price_range: { min: 20, max: 40 },
        location: { lat: 37.4275, lng: -122.1697 },
        capacity: 30,
        rating: 4.5
      },
      {
        restaurant_id: 'rest_2',
        name: 'Sushi Paradise',
        cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
        dietary_options: ['pescatarian', 'gluten-free'],
        price_range: { min: 30, max: 60 },
        location: { lat: 37.4419, lng: -122.1430 },
        capacity: 25,
        rating: 4.7
      },
      {
        restaurant_id: 'rest_3',
        name: 'The Steakhouse',
        cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
        dietary_options: ['keto', 'paleo'],
        price_range: { min: 40, max: 80 },
        location: { lat: 37.4180, lng: -122.1160 },
        capacity: 40,
        rating: 4.6
      },
      {
        restaurant_id: 'rest_4',
        name: 'Mediterranean Delights',
        cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
        dietary_options: ['vegetarian', 'vegan', 'halal', 'kosher'],
        price_range: { min: 25, max: 45 },
        location: { lat: 37.4331, lng: -122.1786 },
        capacity: 35,
        rating: 4.8
      },
      {
        restaurant_id: 'rest_5',
        name: 'Thai Fusion',
        cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
        dietary_options: ['vegetarian', 'vegan', 'gluten-free'],
        price_range: { min: 15, max: 35 },
        location: { lat: 37.4100, lng: -122.1400 },
        capacity: 28,
        rating: 4.4
      }
    ];
    
    return mockRestaurants;
  }
  
  /**
   * Helper: Store matching results in database
   */
  private static async storeMatchingResults(
    timeSlotId: string,
    groups: Group[],
    restaurantMatches: { matches?: RestaurantMatch[] }
  ): Promise<void> {
    // Store groups
    for (const group of groups) {
      const { data: dinnerGroup, error: groupError } = await supabase
        .from('dinner_groups')
        .insert({
          slot_id: timeSlotId,
          group_size: group.size,
          compatibility_score: group.compatibility_score,
          status: 'matched',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (groupError) {
        logger.error(`Failed to create dinner group: ${groupError.message}`);
        continue;
      }
      
      if (dinnerGroup) {
        // Store group members
        for (const userId of group.members) {
          const { error: memberError } = await supabase
            .from('group_members')
            .insert({
              dinner_group_id: dinnerGroup.id,
              user_id: userId,
              signup_id: timeSlotId, // This should be the actual signup ID
              status: 'assigned'
            });
            
          if (memberError) {
            logger.error(`Failed to add group member: ${memberError.message}`);
          }
        }
        
        // Store restaurant assignment if matched
        const match = restaurantMatches.matches?.find(
          (m) => m.group_id === group.group_id
        );
        
        if (match) {
          const { error: updateError } = await supabase
            .from('dinner_groups')
            .update({
              restaurant_id: match.restaurant_id,
              restaurant_name: match.restaurant_name,
              match_score: match.similarity_score
            })
            .eq('id', dinnerGroup.id);
            
          if (updateError) {
            logger.error(`Failed to update restaurant assignment: ${updateError.message}`);
          }
        }
      }
    }
  }
}