import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
dotenv.config();

export const STREAM_API_KEY = process.env.STREAM_API_KEY;
export const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  throw new Error('Missing Stream API credentials in environment variables');
}

export const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
