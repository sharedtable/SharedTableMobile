import { StreamChat, Channel, Event } from 'stream-chat';
import { api } from './api';

interface StreamAttachment {
  type: string;
  url?: string;
  name?: string;
  file_size?: number;
  mime_type?: string;
}

class StreamService {
  private client: StreamChat | null = null;
  private userId: string | null = null;
  private feedChannel: Channel | null = null;
  private notificationChannel: Channel | null = null;
  private eventSubscriptions: Map<string, () => void> = new Map();

  // Initialize Stream client
  async initialize(userId: string) {
    try {
      // Get Stream token from backend
      const { token } = await api.getChatUserToken();
      
      // Initialize Stream client
      this.client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY || '');
      this.userId = userId;

      // Connect user
      await this.client.connectUser(
        {
          id: userId,
          name: 'User Name', // Get from user profile
        },
        token
      );

      // Set up channels
      await this.setupChannels();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Stream service initialized successfully');
    } catch (error) {
      console.error('Error initializing Stream service:', error);
      throw error;
    }
  }

  // Set up feed and notification channels
  private async setupChannels() {
    if (!this.client || !this.userId) return;

    try {
      // Main feed channel for real-time updates
      this.feedChannel = this.client.channel('messaging', 'main-feed', {
        members: [this.userId],
      });
      await this.feedChannel.watch();

      // Personal notification channel
      this.notificationChannel = this.client.channel('messaging', `notifications-${this.userId}`, {
        members: [this.userId],
      });
      await this.notificationChannel.watch();
    } catch (error) {
      console.error('Error setting up channels:', error);
    }
  }

  // Set up real-time event listeners
  private setupEventListeners() {
    if (!this.client) return;

    // Listen for new posts in feed
    this.client.on('message.new', this.handleNewPost);
    
    // Listen for reactions
    this.client.on('reaction.new', this.handleNewReaction);
    this.client.on('reaction.deleted', this.handleDeletedReaction);
    
    // Listen for comments (replies)
    this.client.on('message.updated', this.handleUpdatedMessage);
    
    // Listen for notifications
    this.client.on('notification.added_to_channel', this.handleNotification);
    
    // Listen for user status changes
    this.client.on('user.presence.changed', this.handlePresenceChange);
  }

  // Handle new post in feed
  private handleNewPost = (event: Event) => {
    if (event.message && event.channel_type === 'messaging') {
      const callback = this.eventSubscriptions.get('new_post');
      if (callback) {
        callback();
      }
    }
  };

  // Handle new reaction
  private handleNewReaction = (_event: Event) => {
    const callback = this.eventSubscriptions.get('new_reaction');
    if (callback) {
      callback();
    }
  };

  // Handle deleted reaction
  private handleDeletedReaction = (_event: Event) => {
    const callback = this.eventSubscriptions.get('deleted_reaction');
    if (callback) {
      callback();
    }
  };

  // Handle updated message (edits)
  private handleUpdatedMessage = (_event: Event) => {
    const callback = this.eventSubscriptions.get('message_updated');
    if (callback) {
      callback();
    }
  };

  // Handle notifications
  private handleNotification = (_event: Event) => {
    const callback = this.eventSubscriptions.get('notification');
    if (callback) {
      callback();
    }
  };

  // Handle presence changes
  private handlePresenceChange = (_event: Event) => {
    const callback = this.eventSubscriptions.get('presence_change');
    if (callback) {
      callback();
    }
  };

  // Subscribe to events
  subscribe(eventType: string, callback: () => void) {
    this.eventSubscriptions.set(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventSubscriptions.delete(eventType);
    };
  }

  // Create a new post
  async createPost(postData: {
    type: string;
    content?: string;
    images?: string[];
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    tags?: string[];
    mentions?: string[];
    attachments?: StreamAttachment[];
  }) {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      const message = await this.feedChannel.sendMessage({
        text: postData.content || '',
        attachments: postData.attachments || [],
        // Custom data would go in message.set() or other methods
        // type: postData.type,
        // images: postData.images,
        // location: postData.location,
        // tags: postData.tags,
        // mentions: postData.mentions,
      });

      return message;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Add reaction to a post
  async addReaction(messageId: string, reactionType: string) {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      await this.feedChannel.sendReaction(messageId, {
        type: reactionType,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from a post
  async removeReaction(messageId: string, reactionType: string) {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      await this.feedChannel.deleteReaction(messageId, reactionType);
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Add comment to a post
  async addComment(postId: string, comment: string) {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      const message = await this.feedChannel.sendMessage({
        text: comment,
        parent_id: postId,
      });

      return message;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get feed messages with pagination
  async getFeedMessages(limit = 20, offset = 0) {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      const response = await this.feedChannel.query({
        messages: { limit, offset },
        watch: true,
      });

      return response.messages || [];
    } catch (error) {
      console.error('Error fetching feed messages:', error);
      throw error;
    }
  }

  // Get notifications
  async getNotifications(limit = 20, offset = 0) {
    if (!this.notificationChannel) {
      throw new Error('Notification channel not initialized');
    }

    try {
      const response = await this.notificationChannel.query({
        messages: { limit, offset },
        watch: true,
      });

      return response.messages || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(_notificationId: string) {
    if (!this.notificationChannel) {
      throw new Error('Notification channel not initialized');
    }

    try {
      await this.notificationChannel.markRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Send notification to user
  async sendNotification(userId: string, notification: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    if (!this.client) {
      throw new Error('Stream client not initialized');
    }

    try {
      const channel = this.client.channel('messaging', `notifications-${userId}`);
      await channel.sendMessage({
        text: notification.body,
        // Custom notification data would go in message.set() or other methods
        // type: notification.type,
        // title: notification.title,
        // data: notification.data,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Follow/unfollow user
  async toggleFollow(targetUserId: string, follow: boolean) {
    if (!this.client || !this.userId) {
      throw new Error('Stream client not initialized');
    }

    try {
      if (follow) {
        // Follow user - subscribe to their feed
        const targetChannel = this.client.channel('messaging', `user-feed-${targetUserId}`);
        await targetChannel.addMembers([this.userId]);
      } else {
        // Unfollow user - unsubscribe from their feed
        const targetChannel = this.client.channel('messaging', `user-feed-${targetUserId}`);
        await targetChannel.removeMembers([this.userId]);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }

  // Get user's followers
  async getFollowers(userId: string) {
    if (!this.client) {
      throw new Error('Stream client not initialized');
    }

    try {
      const channel = this.client.channel('messaging', `user-feed-${userId}`);
      const { members } = await channel.queryMembers({});
      return members;
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  }

  // Get user's following
  async getFollowing(userId: string) {
    if (!this.client) {
      throw new Error('Stream client not initialized');
    }

    try {
      // Query channels where user is a member
      const filter = { type: 'messaging', members: { $in: [userId] } };
      const channels = await this.client.queryChannels(filter);
      
      const following = channels
        .filter(ch => ch.id?.startsWith('user-feed-'))
        .map(ch => ch.id?.replace('user-feed-', ''));
      
      return following;
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  }

  // Search posts
  async searchPosts(query: string, filters?: Record<string, unknown>) {
    if (!this.client) {
      throw new Error('Stream client not initialized');
    }

    try {
      const response = await this.client.search(
        { type: 'messaging' },
        query,
        {
          limit: 20,
          ...filters,
        }
      );

      return response.results;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  // Get trending topics/tags
  async getTrendingTags(_limit = 10) {
    // This would typically query your backend for trending tags
    // For now, return mock data
    return [
      { tag: 'foodie', count: 1234 },
      { tag: 'homecooking', count: 987 },
      { tag: 'restaurant', count: 765 },
      { tag: 'recipe', count: 543 },
      { tag: 'brunch', count: 321 },
    ];
  }

  // Upload media
  async uploadMedia(uri: string, type: 'image' | 'video') {
    if (!this.feedChannel) {
      throw new Error('Feed channel not initialized');
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: type === 'image' ? 'image/jpeg' : 'video/mp4',
        name: `upload.${type === 'image' ? 'jpg' : 'mp4'}`,
      } as any); // React Native specific file upload format

      // Upload to Stream CDN - needs proper file handling
      // const response = await this.feedChannel.sendFile(formData);
      // return response.file;
      return ''; // Placeholder - proper file upload needs to be implemented
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Disconnect Stream client
  async disconnect() {
    if (this.client) {
      await this.client.disconnectUser();
      this.client = null;
      this.userId = null;
      this.feedChannel = null;
      this.notificationChannel = null;
      this.eventSubscriptions.clear();
    }
  }
}

// Export singleton instance
export const streamService = new StreamService();