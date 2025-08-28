declare global {
  var pushTokens: Record<string, { token: string; updatedAt: string }> | undefined;
}

export {};