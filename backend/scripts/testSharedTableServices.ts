/**
 * Test script for SharedTable matching services
 * Tests the full pipeline of 5 microservices
 */

import * as dotenv from 'dotenv';

dotenv.config();

interface ServiceEndpoints {
  readonly dataProcessor: string;
  readonly userPreferences: string;
  readonly peopleMatcher: string;
  readonly groupAggregator: string;
  readonly restaurantMatcher: string;
}

const SERVICES: ServiceEndpoints = {
  dataProcessor: 'http://localhost:8000',
  userPreferences: 'http://localhost:8001',
  peopleMatcher: 'http://localhost:8002',
  groupAggregator: 'http://localhost:8004',
  restaurantMatcher: 'http://localhost:8005'
} as const;

interface HealthCheck {
  name: string;
  url: string;
}

/**
 * Check health status of all SharedTable services
 */
async function checkServiceHealth(): Promise<boolean> {
  console.log('🏥 Checking service health...\n');
  
  const healthChecks: readonly HealthCheck[] = [
    { name: 'Data Processor', url: `${SERVICES.dataProcessor}/api/v1/health` },
    { name: 'User Preferences', url: `${SERVICES.userPreferences}/health` },
    { name: 'People Matcher', url: `${SERVICES.peopleMatcher}/api/v1/health` },
    { name: 'Group Aggregator', url: `${SERVICES.groupAggregator}/health` },
    { name: 'Restaurant Matcher', url: `${SERVICES.restaurantMatcher}/health` }
  ];
  
  let allHealthy = true;
  
  for (const check of healthChecks) {
    try {
      const response = await fetch(check.url);
      if (response.ok) {
        console.log(`✅ ${check.name}: HEALTHY`);
      } else {
        console.log(`❌ ${check.name}: UNHEALTHY (status: ${response.status})`);
        allHealthy = false;
      }
    } catch (_error) {
      console.log(`❌ ${check.name}: OFFLINE`);
      allHealthy = false;
    }
  }
  
  console.log();
  return allHealthy;
}

interface UserPreferencesRequest {
  user_id: string;
  nationality_embedding: number[];
  food_craving_embedding: number[];
  cuisine_interests_item_1: number[];
  cuisine_interests_item_2: number[];
}

interface UserPreferencesResponse {
  user_id: string;
  food_preference_vector?: number[];
  vector_norm: number;
  components_used?: string[];
  processing_time_ms: number;
}

/**
 * Test the User Preferences Service
 */
async function testUserPreferencesService(): Promise<number[] | null> {
  console.log('🧪 Testing User Preferences Service...\n');
  
  // Create test data with properly named embeddings
  const testUser: UserPreferencesRequest = {
    user_id: 'test_user_1',
    nationality_embedding: new Array(768).fill(0).map(() => Math.random()),
    food_craving_embedding: new Array(768).fill(0).map(() => Math.random()),
    cuisine_interests_item_1: new Array(768).fill(0).map(() => Math.random()),
    cuisine_interests_item_2: new Array(768).fill(0).map(() => Math.random())
  };
  
  try {
    const response = await fetch(`${SERVICES.userPreferences}/process-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (response.ok) {
      const result = await response.json() as UserPreferencesResponse;
      console.log('✅ User preferences processed successfully');
      console.log(`   - User ID: ${result.user_id}`);
      console.log(`   - Vector dimension: ${result.food_preference_vector?.length || 0}`);
      console.log(`   - Vector norm: ${result.vector_norm}`);
      console.log(`   - Components used: ${result.components_used?.join(', ') || 'N/A'}`);
      console.log(`   - Processing time: ${result.processing_time_ms}ms\n`);
      return result.food_preference_vector || null;
    } else {
      console.log(`❌ Failed to process user preferences: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}\n`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error calling user preferences service: ${error}\n`);
    return null;
  }
}

interface Participant {
  user_id: string;
  name: string;
  dietary_restrictions: string[];
  budget: string;
  location: { lat: number; lng: number };
  preference_vector: number[];
}

interface Group {
  group_id: string;
  members: string[];
  size: number;
  compatibility_score: number;
}

interface _PeopleMatcherResponse {
  groups?: Group[];
  unmatched_users?: string[];
}

/**
 * Test the People Matcher Service
 */
async function testPeopleMatcherService(preferenceVector: number[]): Promise<Group[] | null> {
  console.log('🧪 Testing People Matcher Service...\n');
  
  // Create 12 test participants (minimum required)
  const participants: Participant[] = [];
  for (let i = 0; i < 12; i++) {
    participants.push({
      user_id: `test_user_${i + 1}`,
      name: `Test User ${i + 1}`,
      dietary_restrictions: i % 3 === 0 ? ['vegetarian'] : [],
      budget: ['low', 'medium', 'high'][i % 3],
      location: { lat: 37.7749 + (Math.random() - 0.5) * 0.1, lng: -122.4194 + (Math.random() - 0.5) * 0.1 },
      preference_vector: i === 0 ? preferenceVector : new Array(768).fill(0).map(() => Math.random())
    });
  }
  
  try {
    const response = await fetch(`${SERVICES.peopleMatcher}/api/v1/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ People matched successfully');
      console.log(`   - Groups formed: ${result.groups?.length || 0}`);
      console.log(`   - Unmatched users: ${result.unmatched_users?.length || 0}`);
      
      result.groups?.forEach((group, index) => {
        console.log(`   - Group ${index + 1}: ${group.size} members, compatibility: ${group.compatibility_score}`);
      });
      console.log();
      return result.groups;
    } else {
      console.log(`❌ Failed to match people: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}\n`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error calling people matcher service: ${error}\n`);
    return null;
  }
}

interface GroupAggregatorRequest {
  group_id: string;
  members: Array<{
    user_id: string;
    dietary_restrictions: string[];
    budget: string;
    preference_vector: number[];
  }>;
}

interface GroupAggregatorResponse {
  group_id: string;
  member_count: number;
  budget_range?: { min: number; max: number };
  dietary_restrictions?: string[];
  aggregated_preference_vector: number[];
}

/**
 * Test the Group Aggregator Service
 */
async function testGroupAggregatorService(groups: Group[] | null): Promise<GroupAggregatorResponse | null> {
  console.log('🧪 Testing Group Aggregator Service...\n');
  
  if (!groups || groups.length === 0) {
    console.log('⚠️  No groups to aggregate\n');
    return null;
  }
  
  const firstGroup = groups[0];
  const groupData: GroupAggregatorRequest = {
    group_id: firstGroup.group_id,
    members: firstGroup.members.map((userId, index) => ({
      user_id: userId,
      dietary_restrictions: index % 2 === 0 ? ['vegetarian'] : [],
      budget: 'medium',
      preference_vector: new Array(768).fill(0).map(() => Math.random())
    }))
  };
  
  try {
    const response = await fetch(`${SERVICES.groupAggregator}/aggregate-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData)
    });
    
    if (response.ok) {
      const result = await response.json() as GroupAggregatorResponse;
      console.log('✅ Group preferences aggregated successfully');
      console.log(`   - Group ID: ${result.group_id}`);
      console.log(`   - Member count: ${result.member_count}`);
      console.log(`   - Budget range: $${result.budget_range?.min || 0}-${result.budget_range?.max || 0}`);
      console.log(`   - Dietary restrictions: ${result.dietary_restrictions?.join(', ') || 'None'}\n`);
      return result;
    } else {
      console.log(`❌ Failed to aggregate group preferences: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}\n`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error calling group aggregator service: ${error}\n`);
    return null;
  }
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

interface RestaurantMatch {
  group_id: string;
  restaurant_id: string;
  restaurant_name: string;
  similarity_score: number;
  distance_km: number;
  match_reasons?: string[];
}

interface RestaurantMatcherResponse {
  matches?: RestaurantMatch[];
  unmatched_groups?: string[];
}

/**
 * Test the Restaurant Matcher Service
 */
async function testRestaurantMatcherService(groupPreferences: GroupAggregatorResponse | null): Promise<RestaurantMatcherResponse | null> {
  console.log('🧪 Testing Restaurant Matcher Service...\n');
  
  if (!groupPreferences) {
    console.log('⚠️  No group preferences to match\n');
    return null;
  }
  
  // Create test restaurants
  const restaurants: Restaurant[] = [
    {
      restaurant_id: 'rest_1',
      name: 'The Green Table',
      cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
      dietary_options: ['vegetarian', 'vegan', 'gluten-free'],
      price_range: { min: 15, max: 40 },
      location: { lat: 37.7750, lng: -122.4180 },
      capacity: 20,
      rating: 4.5
    },
    {
      restaurant_id: 'rest_2',
      name: 'Pasta Palace',
      cuisine_vector: new Array(768).fill(0).map(() => Math.random()),
      dietary_options: ['vegetarian'],
      price_range: { min: 20, max: 50 },
      location: { lat: 37.7760, lng: -122.4170 },
      capacity: 30,
      rating: 4.2
    }
  ];
  
  const matchRequest = {
    groups: [{
      group_id: groupPreferences.group_id,
      preference_vector: groupPreferences.aggregated_preference_vector,
      dietary_restrictions: groupPreferences.dietary_restrictions,
      budget_range: groupPreferences.budget_range,
      location: { lat: 37.7749, lng: -122.4194 }
    }],
    restaurants,
    max_distance_km: 5.0
  };
  
  try {
    const response = await fetch(`${SERVICES.restaurantMatcher}/match-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchRequest)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Restaurant matched successfully');
      
      result.matches?.forEach((match) => {
        console.log(`   - Group ${match.group_id} → ${match.restaurant_name}`);
        console.log(`     Similarity: ${match.similarity_score}, Distance: ${match.distance_km}km`);
        console.log(`     Reasons: ${match.match_reasons?.join(', ')}`);
      });
      
      if (result.unmatched_groups?.length > 0) {
        console.log(`   - Unmatched groups: ${result.unmatched_groups.length}`);
      }
      console.log();
      return result;
    } else {
      console.log(`❌ Failed to match restaurants: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}\n`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error calling restaurant matcher service: ${error}\n`);
    return null;
  }
}

/**
 * Run the complete SharedTable services pipeline test
 */
async function runFullPipeline(): Promise<void> {
  console.log('🚀 Running Full SharedTable Pipeline Test\n');
  console.log('=' .repeat(50) + '\n');
  
  // Step 1: Check service health
  const allHealthy = await checkServiceHealth();
  
  if (!allHealthy) {
    console.log('⚠️  Warning: Some services are not healthy. Tests may fail.\n');
    console.log('To start the services, run:');
    console.log('cd /Users/jingzhougaryxue/CascadeProjects/SharedTableMatchingAlgorithm');
    console.log('python3 start_services.py\n');
  }
  
  console.log('=' .repeat(50) + '\n');
  
  // Step 2: Test User Preferences Service
  const preferenceVector = await testUserPreferencesService();
  
  if (!preferenceVector) {
    console.log('❌ Pipeline stopped: User preferences service failed\n');
    return;
  }
  
  // Step 3: Test People Matcher Service
  const groups = await testPeopleMatcherService(preferenceVector);
  
  if (!groups) {
    console.log('❌ Pipeline stopped: People matcher service failed\n');
    return;
  }
  
  // Step 4: Test Group Aggregator Service
  const groupPreferences = await testGroupAggregatorService(groups);
  
  if (!groupPreferences) {
    console.log('❌ Pipeline stopped: Group aggregator service failed\n');
    return;
  }
  
  // Step 5: Test Restaurant Matcher Service
  const restaurantMatches = await testRestaurantMatcherService(groupPreferences);
  
  if (!restaurantMatches) {
    console.log('❌ Pipeline stopped: Restaurant matcher service failed\n');
    return;
  }
  
  console.log('=' .repeat(50) + '\n');
  console.log('✅ Full pipeline test completed successfully!\n');
  console.log('Summary:');
  console.log(`  - Users processed: 12`);
  console.log(`  - Groups formed: ${groups.length}`);
  console.log(`  - Restaurants matched: ${restaurantMatches.matches?.length || 0}`);
}

// Run the test
runFullPipeline().catch(console.error);