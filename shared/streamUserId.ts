// Shared utility to normalize Privy userId for Stream Chat
// Must match backend's normalization: replace non-alphanumeric chars with underscores
export function normalizeStreamUserId(privyUserId: string): string {
  // Replace any non-alphanumeric characters (except underscore and hyphen) with underscore
  // This MUST match the backend's normalization in backend/src/utils/streamUserId.ts
  return privyUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
}
