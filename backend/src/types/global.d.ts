declare global {
  // eslint-disable-next-line no-var
  var pushTokens: Record<string, { token: string; updatedAt: string }> | undefined;
  // eslint-disable-next-line no-var
  var notifications: Record<string, Array<{
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
    read: boolean;
    createdAt: Date;
    priority?: 'high' | 'default' | 'low';
    channels?: string[];
  }>> | undefined;
}

export {};