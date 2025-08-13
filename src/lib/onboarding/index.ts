/**
 * Production-grade onboarding system
 * Complete onboarding solution with database integration
 */

// Export validation schemas and types
export {
  nameSchema,
  birthdaySchema,
  genderSchema,
  academicSchema,
  interestsSchema,
  personalitySchema,
  lifestyleSchema,
  photoSchema,
  completeOnboardingSchema,
  onboardingStepSchemas,
  validateOnboardingStep,
  onboardingOptions,
} from './validation';

export type {
  NameData,
  BirthdayData,
  GenderData,
  AcademicData,
  InterestsData,
  PersonalityData,
  LifestyleData,
  PhotoData,
  CompleteOnboardingData,
  OnboardingStep,
} from './validation';

// Export service
export { OnboardingService, OnboardingError } from './service';
export type { OnboardingProgress } from './service';

// Export context and provider
export { OnboardingProvider, useOnboarding } from './context';
