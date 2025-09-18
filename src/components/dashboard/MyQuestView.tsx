import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type QuestType = 'biweekly' | 'monthly';
type QuestDifficulty = 1 | 2 | 3 | 4 | 5;

interface ActiveQuestData {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  progress: {
    current: number;
    total: number;
  };
  daysRemaining: number;
}

export const MyQuestView: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showQuestSelection, setShowQuestSelection] = useState(false);
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [selectedQuestType, setSelectedQuestType] = useState<QuestType | null>(null);
  const [_selectedDifficulty, setSelectedDifficulty] = useState<QuestDifficulty | null>(null);
  
  // Mock active quest - replace with real data
  const [activeQuest, setActiveQuest] = useState<ActiveQuestData | null>({
    id: '1',
    type: 'biweekly',
    title: '1:1 Dining Experience',
    description: 'Go on intimate one-on-one dinner dates over two weeks',
    difficulty: 3,
    progress: {
      current: 3,
      total: 5,
    },
    daysRemaining: 6,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleChooseQuest = (type: QuestType) => {
    setSelectedQuestType(type);
    setShowQuestSelection(false);
    setShowDifficultySelection(true);
  };

  const handleChooseDifficulty = (difficulty: QuestDifficulty) => {
    setSelectedDifficulty(difficulty);
    setShowDifficultySelection(false);
    // Here you would create the new quest
    setActiveQuest({
      id: '2',
      type: selectedQuestType!,
      title: selectedQuestType === 'biweekly' ? '1:1 Dining Experience' : 'Culinary Explorer',
      description: selectedQuestType === 'biweekly' 
        ? 'Go on intimate one-on-one dinner dates over two weeks'
        : 'Try 5 different cuisine types this month',
      difficulty,
      progress: { current: 0, total: 5 },
      daysRemaining: selectedQuestType === 'biweekly' ? 14 : 30,
    });
  };

  const getDifficultyColor = (level: QuestDifficulty) => {
    switch (level) {
      case 1:
      case 2:
        return '#4CAF50'; // Green
      case 3:
        return '#FFA726'; // Orange
      case 4:
      case 5:
        return '#EF5350'; // Red
      default:
        return theme.colors.text.secondary;
    }
  };

  const getDifficultyLabel = (level: QuestDifficulty) => {
    if (level <= 2) return 'Easy';
    if (level === 3) return 'Medium';
    return 'Hard';
  };

  if (showQuestSelection) {
    const isMonthly = selectedQuestType === 'monthly';
    const primaryColor = isMonthly ? '#EF5350' : '#8B7AE8';
    
    return (
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => setShowQuestSelection(false)}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            Choose Your {isMonthly ? 'Monthly' : 'Biweekly'} Quest
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>
          Pick 1 of 2 available quests to focus on, then select difficulty
        </Text>

        {/* Quest Options based on type */}
        {isMonthly ? (
          <>
            {/* Monthly Quest Option 1 */}
            <Pressable 
              style={styles.questCard}
              onPress={() => handleChooseQuest('monthly')}
            >
              <View style={[styles.questIcon, { backgroundColor: primaryColor }]}>
                <Ionicons name="flame" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>Culinary Explorer</Text>
                  <Text style={styles.questOption}>Option 1</Text>
                </View>
                <Text style={styles.questDescription}>
                  Try 5 different cuisine types this month
                </Text>
                <Pressable style={[styles.chooseButton, { backgroundColor: primaryColor }]}>
                  <Ionicons name="play" size={16} color={theme.colors.white} />
                  <Text style={styles.chooseButtonText}>Choose & Set Difficulty</Text>
                </Pressable>
              </View>
            </Pressable>

            {/* Monthly Quest Option 2 */}
            <Pressable 
              style={styles.questCard}
              onPress={() => handleChooseQuest('monthly')}
            >
              <View style={[styles.questIcon, { backgroundColor: primaryColor }]}>
                <Ionicons name="people" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>Social Butterfly</Text>
                  <Text style={styles.questOption}>Option 2</Text>
                </View>
                <Text style={styles.questDescription}>
                  Host or attend 8 dining events this month
                </Text>
                <Pressable style={[styles.chooseButton, { backgroundColor: primaryColor }]}>
                  <Ionicons name="play" size={16} color={theme.colors.white} />
                  <Text style={styles.chooseButtonText}>Choose & Set Difficulty</Text>
                </Pressable>
              </View>
            </Pressable>
          </>
        ) : (
          <>
            {/* Biweekly Quest Option 1 */}
            <Pressable 
              style={styles.questCard}
              onPress={() => handleChooseQuest('biweekly')}
            >
              <View style={[styles.questIcon, { backgroundColor: primaryColor }]}>
                <Ionicons name="restaurant" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>1:1 Dining Experience</Text>
                  <Text style={styles.questOption}>Option 1</Text>
                </View>
                <Text style={styles.questDescription}>
                  Go on intimate one-on-one dinner{'\n'}dates over two weeks
                </Text>
                <Pressable style={[styles.chooseButton, { backgroundColor: primaryColor }]}>
                  <Ionicons name="play" size={16} color={theme.colors.white} />
                  <Text style={styles.chooseButtonText}>Choose & Set Difficulty</Text>
                </Pressable>
              </View>
            </Pressable>

            {/* Biweekly Quest Option 2 */}
            <Pressable 
              style={styles.questCard}
              onPress={() => handleChooseQuest('biweekly')}
            >
              <View style={[styles.questIcon, { backgroundColor: primaryColor }]}>
                <Ionicons name="globe" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>Dining Network</Text>
                  <Text style={styles.questOption}>Option 2</Text>
                </View>
                <Text style={styles.questDescription}>
                  Build your dining network over two{'\n'}weeks
                </Text>
                <Pressable style={[styles.chooseButton, { backgroundColor: primaryColor }]}>
                  <Ionicons name="play" size={16} color={theme.colors.white} />
                  <Text style={styles.chooseButtonText}>Choose & Set Difficulty</Text>
                </Pressable>
              </View>
            </Pressable>
          </>
        )}

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>
    );
  }

  if (showDifficultySelection) {
    return (
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => setShowDifficultySelection(false)}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Choose Difficulty</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>1:1 Dining Experience</Text>

        {/* Difficulty Options */}
        {[2, 3, 5].map((level) => (
          <Pressable 
            key={level}
            style={[
              styles.difficultyCard,
              { borderColor: getDifficultyColor(level as QuestDifficulty) }
            ]}
            onPress={() => handleChooseDifficulty(level as QuestDifficulty)}
          >
            <View style={styles.difficultyHeader}>
              <Text style={[styles.difficultyNumber, { color: getDifficultyColor(level as QuestDifficulty) }]}>
                {level}
              </Text>
              <Text style={styles.difficultyPoints}>⭐ {250 * level}</Text>
            </View>
            <Text style={[styles.difficultyLabel, { color: getDifficultyColor(level as QuestDifficulty) }]}>
              {level} ~ {getDifficultyLabel(level as QuestDifficulty)}
            </Text>
          </Pressable>
        ))}

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary.main]}
          tintColor={theme.colors.primary.main}
        />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Earn rewards with events!</Text>
        <Text style={styles.welcomeSubtitle}>
          Complete quests and tasks to unlock rewards. New ones appear every month and every two weeks!
        </Text>
      </View>

      {/* Choose Your Quest Section */}
      {!activeQuest ? (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="compass" size={20} color={theme.colors.text.primary} />
            </View>
            <Text style={styles.sectionTitle}>Choose Your Biweekly Quest</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Pick 1 of 2 available quests to focus on, then select difficulty
          </Text>

          <Pressable 
            style={styles.primaryButton}
            onPress={() => {
              setSelectedQuestType('biweekly');
              setShowQuestSelection(true);
            }}
          >
            <Ionicons name="play" size={20} color={theme.colors.white} />
            <Text style={styles.primaryButtonText}>Choose & Set Difficulty</Text>
          </Pressable>

          {/* Monthly Quest Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color={theme.colors.text.primary} />
            </View>
            <Text style={styles.sectionTitle}>Choose Your Monthly Quest</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Pick 1 of 2 available quests to focus on, then select difficulty
          </Text>

          <Pressable 
            style={[styles.primaryButton, styles.redButton]}
            onPress={() => {
              setSelectedQuestType('monthly');
              setShowQuestSelection(true);
            }}
          >
            <Ionicons name="play" size={20} color={theme.colors.white} />
            <Text style={styles.primaryButtonText}>Choose & Set Difficulty</Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* Active Quest */}
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.text.primary} />
            </View>
            <Text style={styles.sectionTitle}>Active Quest</Text>
            <Pressable style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset (5)</Text>
              <Ionicons name="refresh" size={16} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.activeQuestCard}>
            <View style={[styles.questIcon, { backgroundColor: '#8B7AE8' }]}>
              <Ionicons name="shield" size={24} color={theme.colors.white} />
            </View>
            <View style={styles.questContent}>
              <View style={styles.questHeader}>
                <Text style={styles.questTitle}>{activeQuest.title}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>⭐ {activeQuest.difficulty * 100}</Text>
                  <Text style={styles.timeRemaining}>{activeQuest.daysRemaining}d</Text>
                </View>
              </View>
              <Text style={styles.questDescription}>{activeQuest.description}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(activeQuest.progress.current / activeQuest.progress.total) * 100}%` }
                    ]} 
                  />
                </View>
                <View style={styles.progressTextContainer}>
                  <Text style={styles.progressText}>
                    {activeQuest.progress.current}/{activeQuest.progress.total}
                  </Text>
                  <Text style={styles.progressPercent}>
                    {Math.round((activeQuest.progress.current / activeQuest.progress.total) * 100)} %
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Monthly Quest Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color={theme.colors.text.primary} />
            </View>
            <Text style={styles.sectionTitle}>Choose Your Monthly Quest</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Pick 1 of 2 available quests to focus on, then select difficulty
          </Text>

          {/* Quest Cards */}
          <View style={styles.questOptionsContainer}>
            <Pressable 
              style={[styles.questOptionCard, { borderColor: '#EF5350' }]}
              onPress={() => {
                setSelectedQuestType('monthly');
                setShowQuestSelection(true);
              }}
            >
              <View style={[styles.questIcon, { backgroundColor: '#EF5350' }]}>
                <Ionicons name="flame" size={24} color={theme.colors.white} />
              </View>
              <Text style={styles.questOptionTitle}>Culinary Explorer</Text>
              <Text style={styles.questOptionLabel}>option 1</Text>
              <Text style={styles.questOptionDesc}>
                Try 5 different cuisine types this month
              </Text>
              <Pressable style={styles.chooseQuestButton}>
                <Ionicons name="play" size={16} color={theme.colors.white} />
                <Text style={styles.chooseQuestText}>Choose this quest</Text>
              </Pressable>
            </Pressable>

            <Pressable 
              style={[styles.questOptionCard, { borderColor: '#EF5350' }]}
              onPress={() => {
                setSelectedQuestType('monthly');
                setShowQuestSelection(true);
              }}
            >
              <View style={[styles.questIcon, { backgroundColor: '#EF5350' }]}>
                <Ionicons name="people" size={24} color={theme.colors.white} />
              </View>
              <Text style={styles.questOptionTitle}>Social Butterfly</Text>
              <Text style={styles.questOptionLabel}>option 2</Text>
              <Text style={styles.questOptionDesc}>
                Host or attend 8 dining events this month
              </Text>
              <Pressable style={styles.chooseQuestButton}>
                <Ionicons name="play" size={16} color={theme.colors.white} />
                <Text style={styles.chooseQuestText}>Choose this quest</Text>
              </Pressable>
            </Pressable>
          </View>
        </>
      )}

      {/* Need Quest Resets Section */}
      <View style={styles.resetSection}>
        <View style={styles.resetIcon}>
          <Text style={styles.resetEmoji}>📋</Text>
        </View>
        <View style={styles.resetContent}>
          <Text style={styles.resetTitle}>Need Quest Resets?</Text>
          <Text style={styles.resetDescription}>Visit the store to buy more resets</Text>
        </View>
        <Pressable style={styles.storeButton}>
          <Text style={styles.storeButtonText}>Store</Text>
        </Pressable>
      </View>

      {/* Recently Completed */}
      <View style={styles.completedSection}>
        <View style={styles.completedHeader}>
          <Text style={styles.completedTitle}>Recently Completed</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.completedCard}>
          <View style={[styles.completedIcon, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.completedEmoji}>🎯</Text>
          </View>
          <View style={styles.completedContent}>
            <Text style={styles.completedName}>Master Connector</Text>
            <Text style={styles.completedDesc}>Made 10 new dining connections this month</Text>
          </View>
          <Text style={styles.completedPoints}>⭐ 350</Text>
        </View>
      </View>

      <View style={{ height: scaleHeight(100) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },
  welcomeSection: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    marginBottom: scaleHeight(24),
  },
  welcomeTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
  },
  welcomeSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(8),
  },
  iconCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: theme.colors.ui.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    flex: 1,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(16),
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B7AE8',
    marginHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(24),
  },
  redButton: {
    backgroundColor: '#EF5350',
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600',
    marginLeft: scaleWidth(8),
  },
  questCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: theme.colors.ui.lightGray,
  },
  questIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  questContent: {
    flex: 1,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  questTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600',
  },
  questOption: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  questDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(12),
    lineHeight: scaleFont(18),
  },
  chooseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B7AE8',
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(8),
  },
  chooseButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '500',
    marginLeft: scaleWidth(6),
  },
  difficultyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(16),
    borderWidth: 2,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  difficultyNumber: {
    fontSize: scaleFont(32),
    fontWeight: '700',
  },
  difficultyPoints: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
  },
  difficultyLabel: {
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    backgroundColor: theme.colors.ui.lightGray,
  },
  resetButtonText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginRight: scaleWidth(4),
  },
  activeQuestCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
    borderWidth: 1,
    borderColor: theme.colors.ui.lightGray,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    marginRight: scaleWidth(8),
  },
  timeRemaining: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    backgroundColor: theme.colors.ui.lightGray,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(10),
  },
  progressContainer: {
    marginTop: scaleHeight(8),
  },
  progressBar: {
    height: scaleHeight(6),
    backgroundColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B7AE8',
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(4),
  },
  progressText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    fontWeight: '500',
  },
  progressPercent: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  questOptionsContainer: {
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
  },
  questOptionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    borderWidth: 2,
  },
  questOptionTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(4),
  },
  questOptionLabel: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    textTransform: 'uppercase',
    marginBottom: scaleHeight(8),
  },
  questOptionDesc: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
    marginBottom: scaleHeight(12),
  },
  chooseQuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF5350',
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
  },
  chooseQuestText: {
    color: theme.colors.white,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginLeft: scaleWidth(6),
  },
  resetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  resetIcon: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  resetEmoji: {
    fontSize: scaleFont(20),
  },
  resetContent: {
    flex: 1,
  },
  resetTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scaleHeight(2),
  },
  resetDescription: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
  },
  storeButton: {
    backgroundColor: '#FFA726',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(8),
  },
  storeButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  completedSection: {
    paddingHorizontal: scaleWidth(20),
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  completedTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  seeAllText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(13),
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  completedIcon: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  completedEmoji: {
    fontSize: scaleFont(20),
  },
  completedContent: {
    flex: 1,
  },
  completedName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scaleHeight(2),
  },
  completedDesc: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
  },
  completedPoints: {
    color: '#4CAF50',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
});