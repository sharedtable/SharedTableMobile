import React, { memo } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  statusBarStyle?: 'light-content' | 'dark-content';
  testID?: string;
}

export const Screen = memo<ScreenProps>(
  ({
    children,
    scrollable = false,
    keyboardAvoiding = true,
    refreshing = false,
    onRefresh,
    backgroundColor = theme.colors.background.default,
    edges = ['top', 'bottom'],
    style,
    contentContainerStyle,
    statusBarStyle = 'dark-content',
    testID,
  }) => {
    const insets = useSafeAreaInsets();

    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor,
      paddingTop: edges.includes('top') ? insets.top : 0,
      paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: edges.includes('left') ? insets.left : 0,
      paddingRight: edges.includes('right') ? insets.right : 0,
      ...style,
    };

    const content = scrollable ? (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.main}
              colors={[theme.colors.primary.main]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.container, contentContainerStyle]}>{children}</View>
    );

    const wrappedContent = keyboardAvoiding ? (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {content}
      </KeyboardAvoidingView>
    ) : (
      content
    );

    return (
      <View style={containerStyle} testID={testID}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
        {wrappedContent}
      </View>
    );
  }
);

Screen.displayName = 'Screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
