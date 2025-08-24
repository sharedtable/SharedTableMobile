import { api, ApiResponse } from './api';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  users?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface FeedActivity {
  id: string;
  actor: string;
  verb: string;
  object: string;
  time: string;
  content?: string;
  image_url?: string;
  user_data?: any;
  engagement?: {
    likes: number;
    comments: number;
  };
  post?: Post;
  reaction_counts?: {
    like?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: any[];
  };
}

class FeedApi {

  async createPost(content: string, imageUrl?: string): Promise<ApiResponse> {
    return api.request('POST', '/feed/posts', { content, imageUrl });
  }

  async getTimeline(limit = 20, offset = 0): Promise<FeedActivity[]> {
    try {
      console.log('Fetching timeline with params:', { limit, offset });
      const response = await api.request('GET', '/feed/timeline', undefined, {
        params: { limit, offset }
      });
      console.log('Timeline response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Timeline fetch error:', error);
      throw error;
    }
  }

  async getDiscoverFeed(limit = 20, offset = 0): Promise<FeedActivity[]> {
    const response = await api.request('GET', '/feed/discover', null, {
      params: { limit, offset }
    });
    return response.data || [];
  }

  async likePost(postId: string): Promise<void> {
    await api.request('POST', `/feed/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<void> {
    await api.request('DELETE', `/feed/posts/${postId}/like`);
  }

  async commentOnPost(activityId: string, text: string): Promise<any> {
    return api.request('POST', `/feed/posts/${activityId}/comment`, { text });
  }

  async followUser(userId: string): Promise<void> {
    await api.request('POST', `/feed/users/${userId}/follow`);
  }

  async unfollowUser(userId: string): Promise<void> {
    await api.request('DELETE', `/feed/users/${userId}/follow`);
  }

  async uploadImage(uri: string): Promise<string> {
    try {
      console.log('Starting image upload for URI:', uri);
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
      
      const response = await api.request('POST', '/upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.success && response.data?.url) {
        console.log('Image uploaded successfully:', response.data.url);
        return response.data.url;
      }
      
      throw new Error('Failed to upload image');
    } catch (error) {
      console.error('Image upload error:', error);
      // Fallback to local URI if upload fails
      return uri;
    }
  }

  async getFeedToken(): Promise<string> {
    const response = await api.request('GET', '/feed/token');
    return response.data?.token;
  }
}

export default new FeedApi();