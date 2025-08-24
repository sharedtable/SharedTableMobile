import { connect, StreamClient, EnrichedActivity } from 'getstream';
import dotenv from 'dotenv';

dotenv.config();

let streamClient: StreamClient | null = null;

export const getStreamClient = (): StreamClient => {
  if (!streamClient) {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      throw new Error('Stream API credentials not configured');
    }
    
    streamClient = connect(apiKey, apiSecret, undefined, { browser: false });
  }
  
  return streamClient;
};

export const getUserFeedToken = (userId: string): string => {
  const client = getStreamClient();
  return client.createUserToken(userId);
};

export interface PostActivity {
  actor: string;
  verb: 'post';
  object: string;
  foreign_id: string;
  time: string;
  content?: string;
  image_url?: string;
  user_data?: {
    id: string;
    name: string;
    avatar?: string;
  };
  engagement?: {
    likes: number;
    comments: number;
  };
}

export const createPost = async (
  userId: string,
  postId: string,
  content: string,
  imageUrl?: string,
  userData?: any
): Promise<any> => {
  const client = getStreamClient();
  const userFeed = client.feed('user', userId);
  
  const activity: PostActivity = {
    actor: `user:${userId}`,
    verb: 'post',
    object: `post:${postId}`,
    foreign_id: `post:${postId}`,
    time: new Date().toISOString(),
    content,
    image_url: imageUrl,
    user_data: userData,
    engagement: {
      likes: 0,
      comments: 0
    }
  };
  
  const result = await userFeed.addActivity(activity);
  
  // Also add to timeline feed for followers
  const timelineFeed = client.feed('timeline', userId);
  await timelineFeed.addActivity(activity);
  
  return result;
};

export const getUserTimeline = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<EnrichedActivity[]> => {
  const client = getStreamClient();
  const timelineFeed = client.feed('timeline', userId);
  
  const result = await timelineFeed.get({
    limit,
    offset,
    enrich: true
  });
  
  return result.results as EnrichedActivity[];
};

export const getGlobalFeed = async (
  limit = 20,
  offset = 0
): Promise<EnrichedActivity[]> => {
  const client = getStreamClient();
  const globalFeed = client.feed('timeline', 'global');
  
  const result = await globalFeed.get({
    limit,
    offset,
    enrich: true
  });
  
  return result.results as EnrichedActivity[];
};

export const followUser = async (
  followerId: string,
  followingId: string
): Promise<void> => {
  const client = getStreamClient();
  const timelineFeed = client.feed('timeline', followerId);
  
  await timelineFeed.follow('user', followingId);
};

export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<void> => {
  const client = getStreamClient();
  const timelineFeed = client.feed('timeline', followerId);
  
  await timelineFeed.unfollow('user', followingId);
};

export const likePost = async (
  userId: string,
  activityId: string
): Promise<void> => {
  const client = getStreamClient();
  await client.reactions.add('like', activityId, {
    user_id: userId
  });
};

export const unlikePost = async (
  userId: string,
  reactionId: string
): Promise<void> => {
  const client = getStreamClient();
  await client.reactions.delete(reactionId);
};

export const addComment = async (
  userId: string,
  activityId: string,
  text: string
): Promise<any> => {
  const client = getStreamClient();
  return await client.reactions.add('comment', activityId, {
    user_id: userId,
    text
  });
};