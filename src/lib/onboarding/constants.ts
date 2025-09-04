/**
 * Onboarding constants and configuration
 * Production-grade constants for type safety and maintainability
 */

// Onboarding step names
export const ONBOARDING_STEPS = {
  // Mandatory steps
  NAME: 'name',
  BIRTHDAY: 'birthday',
  GENDER: 'gender',
  
  // Optional steps
  EDUCATION: 'education',
  WORK: 'work',
  ETHNICITY: 'ethnicity',
  PERSONALITY: 'personality',
  LIFESTYLE: 'lifestyle',
  FOOD_PREFERENCES_1: 'foodPreferences1',
  FOOD_PREFERENCES_2: 'foodPreferences2',
  FOOD_PREFERENCES_3: 'foodPreferences3',
  FOOD_PREFERENCES_4: 'foodPreferences4',
  INTERESTS: 'interests',
  HOBBIES: 'hobbies',
  HOPING_TO_MEET: 'hopingToMeet',
  INTERESTING_FACT: 'interestingFact',
} as const;

export type OnboardingStepType = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

// Navigation route names
export const ONBOARDING_ROUTES = {
  // Mandatory routes
  NAME: 'OnboardingName',
  BIRTHDAY: 'OnboardingBirthday',
  GENDER: 'OnboardingGender',
  
  // Optional routes
  EDUCATION: 'Education',
  WORK: 'Work',
  BACKGROUND: 'Background',
  PERSONALITY: 'Personality',
  LIFESTYLE: 'Lifestyle',
  FOOD_PREFERENCES_1: 'FoodPreferences1',
  FOOD_PREFERENCES_2: 'FoodPreferences2',
  FOOD_PREFERENCES_3: 'FoodPreferences3',
  FOOD_PREFERENCES_4: 'FoodPreferences4',
  INTERESTS: 'Interests',
  HOBBIES: 'Hobbies',
  HOPING_TO_MEET: 'HopingToMeet',
  INTERESTING_FACT: 'InterestingFact',
} as const;

// Step configuration
export const MANDATORY_STEPS = [
  ONBOARDING_STEPS.NAME,
  ONBOARDING_STEPS.BIRTHDAY,
  ONBOARDING_STEPS.GENDER,
] as const;

export const OPTIONAL_STEPS = [
  ONBOARDING_STEPS.EDUCATION,
  ONBOARDING_STEPS.WORK,
  ONBOARDING_STEPS.ETHNICITY,
  ONBOARDING_STEPS.PERSONALITY,
  ONBOARDING_STEPS.LIFESTYLE,
  ONBOARDING_STEPS.FOOD_PREFERENCES_1,
  ONBOARDING_STEPS.FOOD_PREFERENCES_2,
  ONBOARDING_STEPS.FOOD_PREFERENCES_3,
  ONBOARDING_STEPS.FOOD_PREFERENCES_4,
  ONBOARDING_STEPS.INTERESTS,
  ONBOARDING_STEPS.HOBBIES,
  ONBOARDING_STEPS.HOPING_TO_MEET,
  ONBOARDING_STEPS.INTERESTING_FACT,
] as const;

// Validation rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  NICKNAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 30,
  },
  AGE: {
    MIN: 18,
    MAX: 120,
  },
  ZIP_CODE: {
    PATTERN: /^\d{5}(-\d{4})?$/,
  },
  BUDGET: {
    MIN: 10,
    MAX: 500,
  },
  TRAVEL_DISTANCE: {
    MIN: 0.5,
    MAX: 50,
  },
  ARRAY_MAX_ITEMS: {
    INTERESTS: 10,
    HOBBIES: 10,
    CUISINES: 3,
    PERSONALITY_TRAITS: 5,
    ROLES: 3,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_NAME: 'Please enter a valid name',
  INVALID_EMAIL: 'Please enter a valid email',
  INVALID_AGE: 'You must be 18 or older to use this app',
  INVALID_ZIP: 'Please enter a valid zip code',
  MAX_ITEMS: (max: number) => `You can select up to ${max} items`,
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  SAVE_FAILED: 'Failed to save your information. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_DATE: 'Please enter a valid date',
} as const;

// API endpoints
export const ONBOARDING_ENDPOINTS = {
  SAVE_STEP: '/api/onboarding-simple/save',
  COMPLETE: '/api/onboarding-simple/complete',
  RESUME_INFO: '/api/onboarding-simple/resume-info',
  STATUS: '/api/onboarding/status',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  LAST_SAVED_STEP: 'last_saved_step',
  TEMP_DATA: 'onboarding_temp_data',
} as const;

// Timing constants (in milliseconds)
export const TIMING = {
  DEBOUNCE_DELAY: 500,
  API_TIMEOUT: 15000,
  RETRY_DELAY: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  AUTO_SAVE_DELAY: 2000,
} as const;