import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type QuestType = 'biweekly' | 'monthly' | null;

interface QuestData {
  type: QuestType;
  title: string;
  progress: {
    current: number;
    total: number;
  };
  daysRemaining: string;
}

export const ActiveQuestCard: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // Mock data - replace with real data from hooks
  // Change this to test different states: 'biweekly', 'monthly', or null
  const [activeQuest] = useState<QuestData | null>({
    type: 'biweekly',
    title: '1:1 Dining Experience',
    progress: {
      current: 3,
      total: 5,
    },
    daysRemaining: '6d',
  });
  
  const handlePress = () => {
    // Navigate to My Quest tab in Dashboard
    navigation.navigate('Dashboard', { initialTab: 'quest' });
  };
  
  // No active quest state
  if (!activeQuest) {
    return (
      <Pressable style={[styles.container, styles.noQuestContainer]} onPress={handlePress}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Active Quest</Text>
        </View>
        
        <View style={styles.noQuestContent}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="compass-outline" size={40} color={theme.colors.text.disabled} />
          </View>
          <Text style={styles.noQuestTitle}>No Active Quest</Text>
          <Text style={styles.noQuestSubtitle}>Select a quest to get started</Text>
        </View>
      </Pressable>
    );
  }
  
  const progressPercentage = (activeQuest.progress.current / activeQuest.progress.total) * 100;
  const questColor = activeQuest.type === 'monthly' ? '#EF5350' : '#8B7AE8';
  const questBgColor = activeQuest.type === 'monthly' ? '#FFEBEE' : '#F3F0FF';
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Active Quest</Text>
      </View>
      
      <Pressable 
        style={[styles.questCard, { backgroundColor: questBgColor }]} 
        onPress={handlePress}
      >
        <View style={styles.questCardContent}>
          <View style={[styles.iconContainer, { backgroundColor: questColor }]}>
            <Ionicons 
              name={activeQuest.type === 'monthly' ? 'heart' : 'shield'} 
              size={20} 
              color={theme.colors.white} 
            />
          </View>
          
          <View style={styles.questInfo}>
            <View style={styles.questHeader}>
              <Text style={[styles.questTitle, { color: questColor }]}>
                {activeQuest.title}
              </Text>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.timeText}>{activeQuest.daysRemaining}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { 
                width: `${progressPercentage}%`,
                backgroundColor: questColor 
              }]} 
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>
              {activeQuest.progress.current}/{activeQuest.progress.total}
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(progressPercentage)} %
            </Text>
          </View>
        </View>
      </Pressable>
      
      {/* Show both quest slots if user wants to have both types active */}
      {activeQuest.type === 'biweekly' && (
        <Pressable 
          style={[styles.questCard, styles.secondaryQuestCard, { backgroundColor: '#FFEBEE' }]} 
          onPress={handlePress}
        >
          <View style={styles.questCardContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#EF5350' }]}>
              <Ionicons name="heart" size={20} color={theme.colors.white} />
            </View>
            
            <View style={styles.questInfo}>
              <View style={styles.questHeader}>
                <Text style={[styles.questTitle, { color: '#EF5350' }]}>
                  1:1 Dining Experience
                </Text>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.timeText}>28d</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { 
                  width: '50%',
                  backgroundColor: '#EF5350' 
                }]} 
              />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>3/5</Text>
              <Text style={styles.progressPercent}>50 %</Text>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scaleHeight(16),
  },
  header: {
    marginBottom: scaleHeight(12),
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  questCard: {
    borderRadius: scaleWidth(20),
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 232, 0.3)',
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  secondaryQuestCard: {
    marginTop: scaleHeight(-4),
  },
  questCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  iconContainer: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  questInfo: {
    flex: 1,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(12),
  },
  timeText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    marginLeft: scaleWidth(3),
  },
  progressSection: {
    paddingLeft: scaleWidth(48),
  },
  progressBar: {
    height: scaleHeight(6),
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: scaleWidth(3),
    marginBottom: scaleHeight(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scaleWidth(3),
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  progressPercent: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '700',
  },
  // No quest styles
  noQuestContainer: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    padding: scaleWidth(20),
  },
  noQuestContent: {
    alignItems: 'center',
    paddingVertical: scaleHeight(20),
  },
  emptyIconContainer: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    borderWidth: 2,
    borderColor: theme.colors.ui.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  noQuestTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  noQuestSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
});