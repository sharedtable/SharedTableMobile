/**
 * Date helper utilities for safe date parsing and formatting
 */

/**
 * Safely parse a date from various input formats
 * @param dateInput - Date, string, number or undefined
 * @returns Valid Date object or current date as fallback
 */
export function safeParseDate(dateInput: Date | string | number | null | undefined): Date {
  // If already a valid Date object, return it
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }

  // If null or undefined, return current date
  if (dateInput == null) {
    return new Date();
  }

  try {
    // Try to parse the date
    const parsed = new Date(dateInput);
    
    // Check if the parsed date is valid
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateInput, error);
  }

  // Return current date as fallback
  return new Date();
}

/**
 * Format a date safely with fallback
 * @param dateInput - Date to format
 * @param formatter - Function to format the date
 * @param fallback - Fallback string if formatting fails
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  dateInput: Date | string | number | null | undefined,
  formatter: (date: Date) => string,
  fallback: string = 'Recently'
): string {
  try {
    const date = safeParseDate(dateInput);
    return formatter(date);
  } catch (error) {
    console.warn('Failed to format date:', dateInput, error);
    return fallback;
  }
}