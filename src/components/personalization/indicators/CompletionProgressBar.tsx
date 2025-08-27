/**
 * Production-grade completion progress indicator for personalization flow
 * Shows visual progress through personalization categories
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

export interface CategoryCompletion {
  dietary: boolean;
  cuisine: boolean;
  dining_style: boolean;
  social: boolean;
  foodie_profile: boolean;
}

interface CompletionProgressBarProps {
  completion: CategoryCompletion;
  currentCategory?: keyof CategoryCompletion;
  style?: ViewStyle;
  showLabels?: boolean;
  compact?: boolean;
}

interface CategoryInfo {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  key: keyof CategoryCompletion;
}

const CATEGORIES: CategoryInfo[] = [
  { label: 'Dietary', icon: 'nutrition', key: 'dietary' },
  { label: 'Cuisine', icon: 'restaurant', key: 'cuisine' },
  { label: 'Dining', icon: 'wine', key: 'dining_style' },
  { label: 'Social', icon: 'people', key: 'social' },
  { label: 'Profile', icon: 'person-circle', key: 'foodie_profile' },
];

export const CompletionProgressBar: React.FC<CompletionProgressBarProps> = ({
  completion,
  currentCategory,
  style,
  showLabels = true,
  compact = false,
}) => {
  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(completion).filter(Boolean).length;
    return Math.round((completedCount / CATEGORIES.length) * 100);
  }, [completion]);

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactProgressBar}>
          <View 
            style={[
              styles.compactProgressFill,
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.compactProgressText}>
          {completionPercentage}% Complete
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {completionPercentage}% Complete
        </Text>
      </View>

      {/* Category Icons */}
      <View style={styles.categoriesContainer}>
        {CATEGORIES.map((category, index) => {
          const isCompleted = completion[category.key];
          const isCurrent = currentCategory === category.key;
          const isPreviousCompleted = index > 0 && completion[CATEGORIES[index - 1].key];

          return (
            <View key={category.key} style={styles.categoryWrapper}>
              {index > 0 && (
                <View 
                  style={[
                    styles.connector,
                    isCompleted && isPreviousCompleted && styles.connectorCompleted
                  ]} 
                />
              )}
              
              <View style={styles.categoryItem}>
                <View
                  style={[
                    styles.iconCircle,
                    isCompleted && styles.iconCircleCompleted,
                    isCurrent && styles.iconCircleCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons 
                      name="checkmark" 
                      size={scaleWidth(20)} 
                      color={theme.colors.white} 
                    />
                  ) : (
                    <Ionicons
                      name={category.icon}
                      size={scaleWidth(20)}
                      color={isCurrent ? theme.colors.white : theme.colors.gray[400]}
                    />
                  )}
                </View>
                {showLabels && (
                  <Text 
                    style={[
                      styles.categoryLabel,
                      isCompleted && styles.categoryLabelCompleted,
                      isCurrent && styles.categoryLabelCurrent,
                    ]}
                    numberOfLines={1}
                  >
                    {category.label}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleHeight(20),
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(16),
  },
  compactProgressBar: {
    flex: 1,
    height: scaleHeight(6),
    backgroundColor: theme.colors.gray[200],
    borderRadius: scaleWidth(3),
    overflow: 'hidden',
    marginRight: scaleWidth(12),
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: scaleWidth(3),
  },
  compactProgressText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray[600],
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(20),
  },
  progressBar: {
    height: scaleHeight(8),
    backgroundColor: theme.colors.gray[200],
    borderRadius: scaleWidth(4),
    overflow: 'hidden',
    marginBottom: scaleHeight(8),
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: scaleWidth(4),
  },
  progressText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray[600],
    textAlign: 'center',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    position: 'relative',
  },
  categoryWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: scaleHeight(20),
    left: -scaleWidth(30),
    right: scaleWidth(30),
    height: 2,
    backgroundColor: theme.colors.gray[300],
    zIndex: -1,
  },
  connectorCompleted: {
    backgroundColor: theme.colors.primary[500],
  },
  categoryItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.gray[100],
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  iconCircleCompleted: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  iconCircleCurrent: {
    backgroundColor: theme.colors.primary[400],
    borderColor: theme.colors.primary[600],
    transform: [{ scale: 1.1 }],
  },
  categoryLabel: {
    fontSize: scaleFont(11),
    color: theme.colors.gray[500],
    fontWeight: '500',
  },
  categoryLabelCompleted: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  categoryLabelCurrent: {
    color: theme.colors.primary[700],
    fontWeight: '700',
  },
});