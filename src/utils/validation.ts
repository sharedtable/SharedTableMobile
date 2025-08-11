import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .refine((email) => email.endsWith('@stanford.edu'), 'Must be a Stanford email address');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Phone validation
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Signup form schema
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema.optional(),
  major: z.string().optional(),
  year: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  interests: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
});

// Booking form schema
export const bookingSchema = z.object({
  eventId: z.string(),
  guestCount: z.number().min(1).max(4),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().max(200).optional(),
});

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return errors;
};

// Helper to validate form data
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatValidationErrors(error) };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
