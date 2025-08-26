/**
 * Stream Chat Type Definitions
 * Custom types for Stream Chat integration
 */

import type { 
  ChannelMemberResponse,
  UserResponse as StreamUserResponse,
  MessageResponse,
} from 'stream-chat';

// Extend Stream's UserResponse to include our custom fields
export interface ExtendedUserResponse extends StreamUserResponse {
  email?: string;
  phone?: string;
  displayInfo?: string;
  subtitle?: string;
}

// Custom channel data
export interface CustomChannelData {
  name?: string;
  image?: string;
  description?: string;
  created_by_name?: string;
}

// Channel member with extended user
export interface ExtendedChannelMember extends Omit<ChannelMemberResponse, 'user'> {
  user?: ExtendedUserResponse;
  user_id: string;
}

// Message with extended user
export interface ExtendedMessage extends Omit<MessageResponse, 'user'> {
  user?: ExtendedUserResponse;
}

// Channel with custom data
export type CustomChannel = unknown; // Stream Chat's Channel type - should be imported from stream-chat

// Channel sort options
export const channelSort = {
  last_message_at: -1 as const,
};

// User type for channel list
export interface ChannelUser {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

// Channel preview props
export interface ChannelPreviewProps {
  channel: CustomChannel;
  onSelect?: (channel: CustomChannel) => void;
  latestMessagePreview?: string;
  unread?: number;
}

// Message context type
export interface MessageContextValue {
  message?: ExtendedMessage;
}

// Channel state
export interface ChannelState {
  messages?: ExtendedMessage[];
  members?: Record<string, ExtendedChannelMember>;
  unreadCount?: number;
}