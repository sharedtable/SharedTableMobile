// Shared utility to normalize Privy userId for Stream Chat (removes did:privy: prefix)
export function normalizeStreamUserId(privyUserId: string): string {
  return privyUserId.replace(/^did:privy:/, '');
}
