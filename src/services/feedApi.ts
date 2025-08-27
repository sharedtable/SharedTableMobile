import { api, ApiResponse } from './api';

interface ReactionData {
  id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

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
  user_data?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  engagement?: {
    likes: number;
    comments: number;
  };
  post?: Post;
  reaction_counts?: {
    like?: number;
    love?: number;
    fire?: number;
    yum?: number;
    clap?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: ReactionData[];
    love?: ReactionData[];
    fire?: ReactionData[];
    yum?: ReactionData[];
    clap?: ReactionData[];
  };
  user_reaction_type?: 'like' | 'love' | 'fire' | 'yum' | 'clap';
  first_comment?: {
    id: string;
    user: {
      username: string;
      name: string;
    };
    text: string;
    created_at: string;
  };
}

class FeedApi {

  async createPost(content: string, imageUrl?: string): Promise<ApiResponse> {
    return api.request('POST', '/feed/posts', { content, imageUrl });
  }

  async getTimeline(limit = 20, offset = 0): Promise<FeedActivity[]> {
    try {
      console.log('Fetching timeline with params:', { limit, offset });
      const response = await api.request<FeedActivity[]>('GET', '/feed/timeline', undefined, {
        params: { limit, offset }
      });
      console.log('Timeline response:', response);
      return response.data || [];
    } catch (error: any) {
      // If it's a 404, the endpoint doesn't exist yet
      if (error?.response?.status === 404) {
        console.log('Timeline API endpoint not available yet, returning empty array');
        return [];
      }
      console.error('Timeline fetch error:', error);
      // Return empty array to allow app to function without backend
      return [];
    }
  }

  async getDiscoverFeed(limit = 20, offset = 0): Promise<FeedActivity[]> {
    const response = await api.request<FeedActivity[]>('GET', '/feed/discover', null, {
      params: { limit, offset }
    });
    return response.data || [];
  }

  async likePost(postId: string): Promise<void> {
    try {
      await api.request('POST', `/feed/posts/${postId}/like`);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.log('Like API endpoint not available yet');
      } else {
        console.error('Error liking post:', error);
      }
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await api.request('DELETE', `/feed/posts/${postId}/like`);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.log('Unlike API endpoint not available yet');
      } else {
        console.error('Error unliking post:', error);
      }
    }
  }

  async commentOnPost(activityId: string, text: string): Promise<ApiResponse<Comment>> {
    try {
      return await api.request('POST', `/feed/posts/${activityId}/comment`, { text });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.log('Comment API endpoint not available yet');
        // Return a mock unsuccessful response
        return {
          success: false,
          error: 'API endpoint not available',
          data: undefined
        } as ApiResponse<Comment>;
      }
      throw error;
    }
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const response = await api.request<Comment[]>('GET', `/feed/posts/${postId}/comments`);
      return response.data || [];
    } catch (error: any) {
      // If it's a 404, the endpoint doesn't exist yet
      if (error?.response?.status === 404) {
        console.log('Comments API endpoint not available yet, returning empty array');
        return [];
      }
      console.error('Error fetching comments:', error);
      // Return empty array instead of throwing to allow fallback to local storage
      return [];
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.request('DELETE', `/feed/comments/${commentId}`);
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
      } as any); // React Native specific file upload format
      
      const response = await api.request<{ url: string }>('POST', '/upload/upload', formData, {
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
    const response = await api.request<{ token: string }>('GET', '/feed/token');
    return response.data?.token || '';
  }
}

export default new FeedApi();