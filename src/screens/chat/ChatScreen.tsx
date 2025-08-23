import React from 'react';
import { StreamChatProvider } from './StreamChatProvider';
import { ChatNavigator } from './ChatNavigator';

export const ChatScreen: React.FC = () => {
  return (
    <StreamChatProvider>
      <ChatNavigator />
    </StreamChatProvider>
  );
};
