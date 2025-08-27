/**
 * Production-grade category card component
 * Display preference categories with completion status
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCompleted: boolean;
  isLocked?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  icon,
  isCompleted,
  isLocked = false,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.container,
        isCompleted && styles.containerCompleted,
        isLocked && styles.containerLocked,
        pressed && !isLocked && styles.containerPressed,
        style,
      ]}
      disabled={isLocked}
    >
      <View style={styles.content}>
        <View 
          style={[
            styles.iconContainer,
            isCompleted && styles.iconContainerCompleted,
            isLocked && styles.iconContainerLocked,
          ]}
        >
          <Ionicons
            name={isLocked ? 'lock-closed' : icon}
            size={scaleWidth(28)}
            color={
              isLocked
                ? theme.colors.gray[400]
                : isCompleted
                ? theme.colors.white
                : theme.colors.primary[600]
            }
          />
        </View>

        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
              isLocked && styles.titleLocked,
            ]}
          >
            {title}
          </Text>
          <Text 
            style={[
              styles.description,
              isCompleted && styles.descriptionCompleted,
              isLocked && styles.descriptionLocked,
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={scaleWidth(24)}
                color={theme.colors.success[500]}
              />
            </View>
          ) : isLocked ? (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedText}>Locked</Text>
            </View>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={scaleWidth(24)}
              color={theme.colors.gray[400]}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerCompleted: {
    borderColor: theme.colors.success[300],
    backgroundColor: theme.colors.success[50],
  },
  containerLocked: {
    opacity: 0.7,
    backgroundColor: theme.colors.gray[50],
    borderColor: theme.colors.gray[300],
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(28),
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(16),
  },
  iconContainerCompleted: {
    backgroundColor: theme.colors.success[500],
  },
  iconContainerLocked: {
    backgroundColor: theme.colors.gray[200],
  },
  textContainer: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  titleCompleted: {
    color: theme.colors.success[700],
  },
  titleLocked: {
    color: theme.colors.gray[500],
  },
  description: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(20),
  },
  descriptionCompleted: {
    color: theme.colors.success[600],
  },
  descriptionLocked: {
    color: theme.colors.gray[400],
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    padding: scaleWidth(4),
  },
  lockedBadge: {
    backgroundColor: theme.colors.gray[200],
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  lockedText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: theme.colors.gray[600],
  },
});