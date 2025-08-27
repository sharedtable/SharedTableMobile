/**
 * Personalization Screens Export
 * Central export for all personalization-related screens
 */

export { DietaryPreferencesScreen } from './DietaryPreferencesScreen';
export { CuisinePreferencesScreen } from './CuisinePreferencesScreen';
export { DiningStyleScreen } from './DiningStyleScreen';
export { SocialPreferencesScreen } from './SocialPreferencesScreen';
export { FoodieProfileScreen } from './FoodieProfileScreen';

// Screen names for navigation
export const PersonalizationScreens = {
  DIETARY: 'DietaryPreferences',
  CUISINE: 'CuisinePreferences',
  DINING: 'DiningStyle',
  SOCIAL: 'SocialPreferences',
  PROFILE: 'FoodieProfile',
} as const;

export type PersonalizationScreenName = typeof PersonalizationScreens[keyof typeof PersonalizationScreens];