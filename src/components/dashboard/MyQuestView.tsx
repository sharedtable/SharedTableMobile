import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

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
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedPoints = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.points, 0);

  const totalPossiblePoints = tasks.reduce((sum, task) => sum + task.points, 0);

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
            Mystery reward unlocks every 3 weeks! Keep your streak to find out what's waiting for you.
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

        {tasks.map(task => (
          <Pressable
            key={task.id}
            style={styles.taskItem}
            onPress={() => toggleTask(task.id)}
          >
            <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
              {task.completed && (
                <Icon name="check" size={14} color={theme.colors.white} />
              )}
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
            You've earned <Text style={styles.progressHighlight}>{completedPoints} points</Text> this week
          </Text>
          <Text style={styles.progressText}>
            from completed tasks!
          </Text>
        </LinearGradient>
      </View>

      <View style={{ height: scaleHeight(100) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: scaleHeight(20),
  },
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(20),
  },
  streakDisplay: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  streakNumber: {
    fontSize: scaleFont(48),
    fontWeight: '700' as any,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    lineHeight: scaleFont(52),
  },
  streakLabel: {
    fontSize: scaleFont(16),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: scaleHeight(4),
  },
  streakInfo: {
    backgroundColor: 'rgba(226, 72, 73, 0.05)',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  infoTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  infoPoints: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  infoDescription: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
  tasksCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  editText: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  tasksSubtitle: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(20),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    marginBottom: scaleHeight(12),
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  taskText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  taskPoints: {
    fontSize: scaleFont(13),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  taskPointsCompleted: {
    color: theme.colors.text.secondary,
  },
  progressSummary: {
    borderRadius: scaleWidth(27),
    padding: scaleWidth(16),
    marginTop: scaleHeight(8),
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(8),
  },
  progressText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: scaleFont(18),
  },
  progressHighlight: {
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
  },
});