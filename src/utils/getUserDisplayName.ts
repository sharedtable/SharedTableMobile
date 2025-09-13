/**
 * Utility function to get a consistent display name for the user
 * Priority: nickname > first name > full name > email prefix > fallback
 */

interface UserWithDisplayInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export function getUserDisplayName(
  user: UserWithDisplayInfo | null | undefined,
  fallback: string = 'User'
): string {
  if (!user) return fallback;

  // First priority: nickname (what user wants to be called)
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }

  // Second priority: first name from full name
  if (user.name?.trim()) {
    const firstName = user.name.trim().split(' ')[0];
    if (firstName) return firstName;
  }

  // Third priority: firstName field directly
  if (user.firstName?.trim()) {
    return user.firstName.trim();
  }

  // Fourth priority: email prefix
  if (user.email?.trim()) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix) return emailPrefix;
  }

  // Fifth priority: phone number (formatted for display)
  const phone = user.phone || user.phoneNumber;
  if (phone?.trim()) {
    // Format phone number for display (show last 4 digits)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `User ****${cleaned.slice(-4)}`;
    }
    return phone.trim();
  }

  // Fallback
  return fallback;
}

export function getFullName(user: UserWithDisplayInfo | null | undefined): string | null {
  if (!user) return null;

  // Try full name field first
  if (user.name?.trim()) {
    return user.name.trim();
  }

  // Build from firstName and lastName
  if (user.firstName?.trim() || user.lastName?.trim()) {
    const parts = [
      user.firstName?.trim(),
      user.lastName?.trim()
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  return null;
}