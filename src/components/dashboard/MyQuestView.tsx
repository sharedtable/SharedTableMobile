import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface Task {
  id: string;
  text: string;
  points: number;
  completed: boolean;
}

export const MyQuestView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Complete a dinner booking', points: 50, completed: false },
    { id: '2', text: 'Refer a friend to join', points: 50, completed: false },
  ]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const completedPoints = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);

  const _totalPossiblePoints = tasks.reduce((sum, task) => sum + task.points, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Monthly Streak Tracker */}
      <View style={styles.streakCard}>
        <Text style={styles.cardTitle}>Monthly Streak Tracker</Text>

        <View style={styles.streakDisplay}>
          <Text style={styles.streakNumber}>6</Text>
          <Text style={styles.streakLabel}>Weeks Strong</Text>
        </View>

        <View style={styles.streakInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Weekly Points</Text>
            <Text style={styles.infoPoints}>+200 pts this week</Text>
          </View>
          <Text style={styles.infoDescription}>
            Maintain your streak to earn 50 bonus points per week!
          </Text>
        </View>

        <View style={styles.streakInfo}>
          <Text style={styles.infoTitle}>Next Reward</Text>
          <Text style={styles.infoDescription}>
            Mystery reward unlocks every 3 weeks! Keep your streak to find out what&apos;s waiting
            for you.
          </Text>
        </View>
      </View>

      {/* Biweekly Tasks */}
      <View style={styles.tasksCard}>
        <View style={styles.tasksHeader}>
          <Text style={styles.cardTitle}>Biweekly Tasks</Text>
          <View style={styles.editButton}>
            <Icon name="edit" size={16} color={theme.colors.primary.main} />
            <Text style={styles.editText}>Edit Tasks</Text>
          </View>
        </View>

        <Text style={styles.tasksSubtitle}>
          Complete tasks to maintain your streak and earn points
        </Text>

        {tasks.map((task) => (
          <Pressable key={task.id} style={styles.taskItem} onPress={() => toggleTask(task.id)}>
            <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
              {task.completed && <Icon name="check" size={14} color={theme.colors.white} />}
            </View>
            <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
              {task.text}
            </Text>
            <Text style={[styles.taskPoints, task.completed && styles.taskPointsCompleted]}>
              {task.points} pts
            </Text>
          </Pressable>
        ))}

        {/* Progress Summary */}
        <LinearGradient
          colors={['#FFF4E6', '#FFE4CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressSummary}
        >
          <Text style={styles.progressTitle}>Progress Summary</Text>
          <Text style={styles.progressText}>
            You&apos;ve earned{' '}
            <Text style={styles.progressHighlight}>{completedPoints} points</Text> this week
          </Text>
          <Text style={styles.progressText}>from completed tasks!</Text>
        </LinearGradient>
      </View>

      <View style={{ height: scaleHeight(100) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(20),
  },
  checkbox: {
    alignItems: 'center',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    height: scaleWidth(20),
    justifyContent: 'center',
    marginRight: scaleWidth(12),
    width: scaleWidth(20),
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
    paddingTop: scaleHeight(20),
  },
  editButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scaleWidth(4),
  },
  editText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  infoDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
  },
  infoPoints: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600' as any,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(4),
  },
  infoTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  progressHighlight: {
    color: theme.colors.text.primary,
    fontWeight: '700' as any,
  },
  progressSummary: {
    alignItems: 'center',
    borderRadius: scaleWidth(27),
    marginTop: scaleHeight(8),
    padding: scaleWidth(16),
  },
  progressText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
    textAlign: 'center',
  },
  progressTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(8),
  },
  streakCard: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    padding: scaleWidth(20),
  },
  streakDisplay: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  streakInfo: {
    backgroundColor: 'rgba(226, 72, 73, 0.05)',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(12),
    padding: scaleWidth(16),
  },
  streakLabel: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginTop: scaleHeight(4),
  },
  streakNumber: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(48),
    fontWeight: '700' as any,
    lineHeight: scaleFont(52),
  },
  taskItem: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  taskPoints: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600' as any,
  },
  taskPointsCompleted: {
    color: theme.colors.text.secondary,
  },
  taskText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  taskTextCompleted: {
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  tasksCard: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    padding: scaleWidth(20),
  },
  tasksHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  tasksSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(20),
  },
});
