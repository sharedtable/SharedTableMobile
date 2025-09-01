declare global {
  // eslint-disable-next-line no-var
  var pushTokens: Record<string, { token: string; updatedAt: string }> | undefined;
}

export {};