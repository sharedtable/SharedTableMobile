/**
 * Normalize Stream Chat user ID to ensure consistency
 * Stream Chat doesn't allow certain characters in user IDs
 */
export function normalizeStreamUserId(userId: string): string {
  // Replace any non-alphanumeric characters (except underscore and hyphen) with underscore
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_');
}