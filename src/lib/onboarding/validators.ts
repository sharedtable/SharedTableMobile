/**
 * Production-grade validation utilities for onboarding
 */

import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Comprehensive validation utilities
 */
export class OnboardingValidators {
  /**
   * Validate name fields
   */
  static validateName(value: string, fieldName: string = 'Name'): string | null {
    if (!value || value.trim().length === 0) {
      return `${fieldName} is required`;
    }

    if (value.trim().length < VALIDATION_RULES.NAME.MIN_LENGTH) {
      return ERROR_MESSAGES.MIN_LENGTH(VALIDATION_RULES.NAME.MIN_LENGTH);
    }

    if (value.trim().length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      return ERROR_MESSAGES.MAX_LENGTH(VALIDATION_RULES.NAME.MAX_LENGTH);
    }

    if (!VALIDATION_RULES.NAME.PATTERN.test(value.trim())) {
      return ERROR_MESSAGES.INVALID_NAME;
    }

    return null;
  }

  /**
   * Validate birth date and age
   */
  static validateBirthDate(dateString: string): string | null {
    if (!dateString) {
      return 'Birth date is required';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return ERROR_MESSAGES.INVALID_DATE;
    }

    const age = this.calculateAge(date);
    if (age < VALIDATION_RULES.AGE.MIN) {
      return ERROR_MESSAGES.INVALID_AGE;
    }

    if (age > VALIDATION_RULES.AGE.MAX) {
      return 'Please enter a valid birth date';
    }

    return null;
  }

  /**
   * Calculate age from birth date
   */
  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate email
   */
  static validateEmail(email: string): string | null {
    if (!email) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }

    return null;
  }

  /**
   * Validate zip code
   */
  static validateZipCode(zipCode: string): string | null {
    if (!zipCode) {
      return null; // Zip code is optional
    }

    if (!VALIDATION_RULES.ZIP_CODE.PATTERN.test(zipCode)) {
      return ERROR_MESSAGES.INVALID_ZIP;
    }

    return null;
  }

  /**
   * Validate budget
   */
  static validateBudget(budget: number): string | null {
    if (budget < VALIDATION_RULES.BUDGET.MIN) {
      return `Budget must be at least $${VALIDATION_RULES.BUDGET.MIN}`;
    }

    if (budget > VALIDATION_RULES.BUDGET.MAX) {
      return `Budget cannot exceed $${VALIDATION_RULES.BUDGET.MAX}`;
    }

    return null;
  }

  /**
   * Validate travel distance
   */
  static validateTravelDistance(distance: number): string | null {
    if (distance < VALIDATION_RULES.TRAVEL_DISTANCE.MIN) {
      return `Distance must be at least ${VALIDATION_RULES.TRAVEL_DISTANCE.MIN} miles`;
    }

    if (distance > VALIDATION_RULES.TRAVEL_DISTANCE.MAX) {
      return `Distance cannot exceed ${VALIDATION_RULES.TRAVEL_DISTANCE.MAX} miles`;
    }

    return null;
  }

  /**
   * Validate array selection limits
   */
  static validateArrayLimit(
    items: any[],
    maxItems: number,
    _fieldName: string
  ): string | null {
    if (items.length > maxItems) {
      return ERROR_MESSAGES.MAX_ITEMS(maxItems);
    }

    return null;
  }

  /**
   * Validate required selection
   */
  static validateRequired(
    value: any,
    fieldName: string
  ): string | null {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }

    if (Array.isArray(value) && value.length === 0) {
      return `Please select at least one ${fieldName.toLowerCase()}`;
    }

    return null;
  }

  /**
   * Validate text length
   */
  static validateTextLength(
    text: string,
    minLength: number,
    maxLength: number,
    _fieldName: string
  ): string | null {
    if (!text) {
      return null; // Assume optional if not checking required
    }

    if (text.length < minLength) {
      return ERROR_MESSAGES.MIN_LENGTH(minLength);
    }

    if (text.length > maxLength) {
      return ERROR_MESSAGES.MAX_LENGTH(maxLength);
    }

    return null;
  }

  /**
   * Validate complete step data
   */
  static validateStep(step: string, data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};

    switch (step) {
      case 'name':
        if (data.firstName) {
          const firstNameError = this.validateName(data.firstName, 'First name');
          if (firstNameError) errors.firstName = firstNameError;
        }
        if (data.lastName) {
          const lastNameError = this.validateName(data.lastName, 'Last name');
          if (lastNameError) errors.lastName = lastNameError;
        }
        break;

      case 'birthday':
        if (data.birthDate) {
          const birthDateError = this.validateBirthDate(data.birthDate);
          if (birthDateError) errors.birthDate = birthDateError;
        }
        break;

      case 'gender':
        if (!data.gender) {
          errors.gender = 'Please select a gender option';
        }
        break;

      case 'foodPreferences2':
        if (data.zipCode) {
          const zipError = this.validateZipCode(data.zipCode);
          if (zipError) errors.zipCode = zipError;
        }
        if (data.travelDistance !== undefined) {
          const distanceError = this.validateTravelDistance(data.travelDistance);
          if (distanceError) errors.travelDistance = distanceError;
        }
        break;

      case 'interests':
        if (data.interests) {
          const interestsError = this.validateArrayLimit(
            data.interests,
            VALIDATION_RULES.ARRAY_MAX_ITEMS.INTERESTS,
            'Interests'
          );
          if (interestsError) errors.interests = interestsError;
        }
        break;

      case 'hobbies':
        if (data.hobbies) {
          const hobbiesError = this.validateArrayLimit(
            data.hobbies,
            VALIDATION_RULES.ARRAY_MAX_ITEMS.HOBBIES,
            'Hobbies'
          );
          if (hobbiesError) errors.hobbies = hobbiesError;
        }
        break;

      case 'personality':
        if (data.roles) {
          const rolesError = this.validateArrayLimit(
            data.roles,
            VALIDATION_RULES.ARRAY_MAX_ITEMS.ROLES,
            'Roles'
          );
          if (rolesError) errors.roles = rolesError;
        }
        break;

      // Add more step-specific validations as needed
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      // Remove leading/trailing whitespace
      value = value.trim();
      
      // Remove any HTML/script tags
      value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      value = value.replace(/<[^>]+>/g, '');
      
      // Limit consecutive spaces
      value = value.replace(/\s+/g, ' ');
    }
    
    return value;
  }

  /**
   * Validate and sanitize all step data
   */
  static validateAndSanitize(
    step: string,
    data: Record<string, any>
  ): { isValid: boolean; sanitizedData: Record<string, any>; errors: Record<string, string> } {
    // Sanitize all input
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        sanitizedData[key] = value.map(item => this.sanitizeInput(item));
      } else {
        sanitizedData[key] = this.sanitizeInput(value);
      }
    }

    // Validate
    const validation = this.validateStep(step, sanitizedData);

    return {
      isValid: validation.isValid,
      sanitizedData,
      errors: validation.errors,
    };
  }
}