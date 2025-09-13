import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    // @ts-ignore - Dynamic navigation requires runtime type checking
    navigationRef.navigate(name, params);
  }
}

export function navigateToChat(channelId?: string) {
  console.log('[NavigationService] Navigating to chat with channelId:', channelId);
  
  if (navigationRef.isReady()) {
    if (channelId) {
      // Navigate to specific channel
      navigationRef.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'Chat',
            params: {
              screen: 'Channel',
              params: { channelId },
            },
          },
        })
      );
    } else {
      // Navigate to chat list
      navigationRef.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'Chat',
          },
        })
      );
    }
  } else {
    console.warn('[NavigationService] Navigation not ready');
  }
}

export function reset(state: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}