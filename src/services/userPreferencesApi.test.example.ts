/**
 * Example test file showing stage-by-stage preference saving
 * This demonstrates how each personalization screen should save data
 */

import { userPreferencesAPI } from './userPreferencesApi';

// Mock user ID (would come from auth in real app)
const mockUserId = 'test-user-123';

/**
 * Stage 1: Dietary Preferences Screen
 * User selects dietary restrictions, alcohol preferences, and spice tolerance
 */
async function testDietaryStage() {
  console.log('📝 Testing Stage 1: Dietary Preferences');
  
  const dietaryData = {
    dietary_restrictions: ['vegetarian', 'gluten_free'],
    alcohol_preferences: 'wine_only',
    spice_tolerance: 7,
  };
  
  const result = await userPreferencesAPI.saveDietaryPreferences(
    mockUserId,
    dietaryData
  );
  
  console.log('Stage 1 saved:', result);
}

/**
 * Stage 2: Cuisine Preferences Screen
 * User selects favorite cuisines and indicates love/like levels
 */
async function testCuisineStage() {
  console.log('📝 Testing Stage 2: Cuisine Preferences');
  
  const cuisineData = {
    cuisine_preferences: ['Italian', 'Japanese', 'Mexican', 'Thai'],
    cuisine_love_levels: {
      'Italian': 'love' as const,
      'Japanese': 'love' as const,
      'Mexican': 'like' as const,
      'Thai': 'like' as const,
    },
    cuisine_avoid: ['Fast Food'],
  };
  
  const result = await userPreferencesAPI.saveCuisinePreferences(
    mockUserId,
    cuisineData
  );
  
  console.log('Stage 2 saved:', result);
}

/**
 * Stage 3: Dining Style Preferences Screen
 * User sets location, budget, atmosphere preferences
 */
async function testDiningStyleStage() {
  console.log('📝 Testing Stage 3: Dining Style Preferences');
  
  const diningData = {
    dining_atmospheres: ['casual', 'trendy', 'romantic'],
    dining_occasions: ['weekend_brunch', 'weekday_dinner'],
    preferred_price_range: [20, 60] as [number, number],
    group_size_preference: 'small_group',
    zip_code: '94305',
    max_travel_distance: 15,
  };
  
  const result = await userPreferencesAPI.saveDiningStylePreferences(
    mockUserId,
    diningData
  );
  
  console.log('Stage 3 saved:', result);
}

/**
 * Stage 4: Social Preferences Screen
 * User indicates social style, interests, and goals
 */
async function testSocialStage() {
  console.log('📝 Testing Stage 4: Social Preferences');
  
  const socialData = {
    social_level: 8,
    adventure_level: 7,
    formality_level: 5,
    interests: ['Technology', 'Travel', 'Food & Wine', 'Fitness'],
    goals: ['Make new friends', 'Network professionally', 'Explore new cuisines'],
    languages: ['English', 'Spanish'],
    social_media: {
      instagram: '@foodie_user',
      linkedin: 'linkedin.com/in/user',
    },
  };
  
  const result = await userPreferencesAPI.saveSocialPreferences(
    mockUserId,
    socialData
  );
  
  console.log('Stage 4 saved:', result);
}

/**
 * Stage 5: Foodie Profile Screen (Final)
 * User completes their profile with bio and fun facts
 */
async function testFoodieProfileStage() {
  console.log('📝 Testing Stage 5: Foodie Profile');
  
  const foodieData = {
    bio: 'Passionate foodie who loves exploring hidden gems and trying new cuisines. Always up for a culinary adventure!',
    fun_fact: 'I once ate at 5 different restaurants in one day in Tokyo',
    favorite_food: 'Fresh pasta with truffle sauce',
    food_bucket_list: 'Dine at a 3-Michelin star restaurant in France',
    cooking_skill: 'intermediate',
    foodie_tags: ['adventurous_eater', 'wine_enthusiast', 'brunch_lover'],
    hobbies: ['Cooking', 'Wine tasting', 'Food photography'],
  };
  
  const result = await userPreferencesAPI.saveFoodieProfile(
    mockUserId,
    foodieData
  );
  
  console.log('Stage 5 saved (onboarding complete):', result);
}

/**
 * Test retrieving all preferences
 */
async function testGetPreferences() {
  console.log('📖 Testing Get Preferences');
  
  const preferences = await userPreferencesAPI.getUserPreferences(mockUserId);
  console.log('Retrieved preferences:', preferences);
  
  // Check completion percentage
  const completion = await userPreferencesAPI.getCompletionPercentage(mockUserId);
  console.log(`Completion percentage: ${completion}%`);
  
  // Check individual stage completion
  const stages = [
    'dietary', 'cuisine', 'dining_style', 'social', 'foodie_profile'
  ] as const;
  
  for (const stage of stages) {
    const isComplete = await userPreferencesAPI.hasCompletedStage(
      mockUserId, 
      stage
    );
    console.log(`Stage ${stage} complete:`, isComplete);
  }
}

/**
 * Run all tests in sequence
 */
export async function runAllTests() {
  try {
    // Test saving each stage sequentially
    await testDietaryStage();
    await testCuisineStage();
    await testDiningStyleStage();
    await testSocialStage();
    await testFoodieProfileStage();
    
    // Test retrieving all data
    await testGetPreferences();
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Usage in your app:
// import { runAllTests } from './userPreferencesApi.test.example';
// runAllTests();