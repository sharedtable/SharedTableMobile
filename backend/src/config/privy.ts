import { PrivyClient } from '@privy-io/server-auth';
import dotenv from 'dotenv';

dotenv.config();

const privyAppId = process.env.PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;

if (!privyAppId || !privyAppSecret) {
  throw new Error('Missing Privy configuration. Please set PRIVY_APP_ID and PRIVY_APP_SECRET');
}

export const privyClient = new PrivyClient(privyAppId, privyAppSecret);
