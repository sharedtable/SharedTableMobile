/**
 * Production-grade onboarding validation schemas
 * These schemas validate user input for the onboarding process
 * and map to the database user_profiles table
 */

import { z } from 'zod';

// Personal Information Validation
export const nameSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(30, 'Nickname must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9\s'-]+$/,
      'Nickname can only contain letters, numbers, spaces, hyphens, and apostrophes'
    ),
});

export const birthdaySchema = z.object({
  birthDate: z
    .date()
    .max(new Date(), 'Birth date cannot be in the future')
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 100;
    }, 'Age must be between 16 and 100 years'),
});

export const genderSchema = z.object({
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a gender option' }),
  }),
});

// Additional Personal Information
export const dependentsSchema = z.object({
  hasDependents: z.enum(['yes', 'no'], {
    errorMap: () => ({ message: 'Please select whether you have dependents' }),
  }),
});

export const workSchema = z.object({
  lineOfWork: z
    .string()
    .min(1, 'Please select your line of work')
    .max(100, 'Line of work must be less than 100 characters'),
});

export const ethnicitySchema = z.object({
  ethnicity: z
    .string()
    .min(1, 'Please select your ethnicity')
    .max(100, 'Ethnicity must be less than 100 characters'),
});

export const relationshipSchema = z.object({
  relationshipType: z
    .string()
    .min(1, 'Please select relationship type')
    .max(100, 'Relationship type must be less than 100 characters'),
  timeSinceLastRelationship: z
    .string()
    .min(1, 'Please select time since last relationship')
    .max(50, 'Time since must be less than 50 characters'),
});

// Academic Information
export const academicSchema = z.object({
  major: z.string().min(1, 'Major is required').max(100, 'Major must be less than 100 characters'),
  universityYear: z.enum(['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other'], {
    errorMap: () => ({ message: 'Please select your university year' }),
  }),
});

// Interests and Personality
export const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(3, 'Please select at least 3 interests')
    .max(10, 'Please select no more than 10 interests')
    .refine(
      (interests) => interests.every((interest) => interest.length <= 50),
      'Each interest must be less than 50 characters'
    ),
});

// Personality traits from sliders (each trait is a key-value pair stored as string)
export const personalitySchema = z.object({
  personalityTraits: z
    .array(z.string())
    .min(1, 'Please complete the personality assessment')
    .refine(
      (traits) => traits.length <= 10, // Max 8 sliders but allow some flexibility
      'Too many personality traits provided'
    )
    .refine(
      (traits) => traits.every((trait) => trait.includes(': ') && trait.split(': ').length === 2),
      'Invalid personality trait format'
    ),
});

// Lifestyle and Preferences (matching the actual screen)
export const lifestyleSchema = z.object({
  wantChildren: z.enum(['Yes', 'No', 'Maybe'], {
    errorMap: () => ({ message: 'Please select if you want children' }),
  }),
  smokingHabit: z.enum(['Rarely', 'Sometimes', 'Always'], {
    errorMap: () => ({ message: 'Please select your smoking/vaping habits' }),
  }),
});

// Additional lifestyle info for future use
export const additionalLifestyleSchema = z.object({
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .transform((val) => val || null),
  dietaryRestrictions: z
    .array(z.string())
    .max(10, 'Please select no more than 10 dietary restrictions')
    .optional()
    .transform((val) => (val?.length ? val : null)),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .transform((val) => val || null),
});

// Photo Upload
export const photoSchema = z.object({
  avatarUrl: z
    .string()
    .url('Please provide a valid image URL')
    .optional()
    .transform((val) => val || null),
});

// Complete onboarding data schema (simplified to only required fields)
export const completeOnboardingSchema = nameSchema
  .merge(birthdaySchema)
  .merge(genderSchema);

// Full onboarding data schema (all optional fields)
export const fullOnboardingSchema = nameSchema
  .merge(birthdaySchema)
  .merge(genderSchema)
  .merge(dependentsSchema)
  .merge(workSchema)
  .merge(ethnicitySchema)
  .merge(relationshipSchema)
  .merge(academicSchema)
  .merge(lifestyleSchema)
  .merge(interestsSchema)
  .merge(personalitySchema)
  .merge(photoSchema)
  .merge(additionalLifestyleSchema);

// Individual step validation schemas
export const onboardingStepSchemas = {
  name: nameSchema,
  birthday: birthdaySchema,
  gender: genderSchema,
  dependents: dependentsSchema,
  work: workSchema,
  ethnicity: ethnicitySchema,
  relationship: relationshipSchema,
  lifestyle: lifestyleSchema,
  interests: interestsSchema,
  personality: personalitySchema,
  photo: photoSchema,
} as const;

// Types for onboarding data
export type NameData = z.infer<typeof nameSchema>;
export type BirthdayData = z.infer<typeof birthdaySchema>;
export type GenderData = z.infer<typeof genderSchema>;
export type DependentsData = z.infer<typeof dependentsSchema>;
export type WorkData = z.infer<typeof workSchema>;
export type EthnicityData = z.infer<typeof ethnicitySchema>;
export type RelationshipData = z.infer<typeof relationshipSchema>;
export type AcademicData = z.infer<typeof academicSchema>;
export type LifestyleData = z.infer<typeof lifestyleSchema>;
export type InterestsData = z.infer<typeof interestsSchema>;
export type PersonalityData = z.infer<typeof personalitySchema>;
export type PhotoData = z.infer<typeof photoSchema>;

export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

// Extended type for backward compatibility with old onboarding screens
export type ExtendedOnboardingData = CompleteOnboardingData & {
  major?: string;
  interests?: string[];
  hasDependents?: 'yes' | 'no';
  lineOfWork?: string;
  ethnicity?: string;
  relationshipType?: string;
  wantChildren?: 'Yes' | 'No' | 'Maybe';
  smokingHabit?: 'Rarely' | 'Sometimes' | 'Always';
  timeSinceLastRelationship?: string;
  personalityTraits?: string[];
  avatarUrl?: string | null;
  bio?: string | null;
  dietaryRestrictions?: string[] | null;
  location?: string | null;
  universityYear?: string;
};

// Validation step type
export type OnboardingStep = keyof typeof onboardingStepSchemas;

// Helper function to validate onboarding step data
export const validateOnboardingStep = <T extends OnboardingStep>(
  step: T,
  data: unknown
): {
  success: boolean;
  data?: z.infer<(typeof onboardingStepSchemas)[T]>;
  errors?: Record<string, string>;
} => {
  try {
    const schema = onboardingStepSchemas[step];
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Predefined options for dropdowns/selections
export const onboardingOptions = {
  genders: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ] as const,

  universityYears: [
    { value: 'freshman', label: 'Freshman' },
    { value: 'sophomore', label: 'Sophomore' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
    { value: 'graduate', label: 'Graduate Student' },
    { value: 'other', label: 'Other' },
  ] as const,

  commonInterests: [
    'Reading',
    'Music',
    'Sports',
    'Cooking',
    'Travel',
    'Art',
    'Photography',
    'Gaming',
    'Dancing',
    'Hiking',
    'Movies',
    'Technology',
    'Fashion',
    'Fitness',
    'Writing',
    'Learning Languages',
    'Volunteering',
    'Networking',
    'Meditation',
    'Board Games',
  ] as const,

  personalityTraits: [
    'Outgoing',
    'Introverted',
    'Creative',
    'Analytical',
    'Empathetic',
    'Adventurous',
    'Organized',
    'Spontaneous',
    'Ambitious',
    'Relaxed',
    'Intellectual',
    'Practical',
    'Optimistic',
    'Thoughtful',
    'Humorous',
  ] as const,

  commonDietaryRestrictions: [
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Dairy-free',
    'Nut allergies',
    'Shellfish allergies',
    'Halal',
    'Kosher',
    'Low sodium',
    'Keto',
    'Paleo',
    'No restrictions',
  ] as const,

  stanfordMajors: [
    'Computer Science',
    'Engineering',
    'Business',
    'Economics',
    'Biology',
    'Psychology',
    'Political Science',
    'International Relations',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'History',
    'Philosophy',
    'Art & Art History',
    'Music',
    'Communications',
    'Anthropology',
    'Sociology',
    'Environmental Studies',
    'Pre-Med',
    'Pre-Law',
    'Undeclared',
    'Other',
  ] as const,
} as const;
