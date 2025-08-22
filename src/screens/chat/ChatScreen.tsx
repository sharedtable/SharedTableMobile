import React from 'react';
import { StreamChatProvider, BasicChannelListScreen } from './StreamChatProvider';

export const ChatScreen: React.FC = () => {
  return (
    <StreamChatProvider>
      <BasicChannelListScreen />
    </StreamChatProvider>
  );
};
