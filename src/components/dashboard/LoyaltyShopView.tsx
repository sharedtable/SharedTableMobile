import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface RewardItem {
  id: string;
  title: string;
  description: string;
  points: number;
  locked?: boolean;
  exclusive?: boolean;
}

const rewardItems: RewardItem[] = [
  {
    id: '1',
    title: 'Free Coffee',
    description: 'Complimentary coffee at partner cafés',
    points: 300,
  },
  {
    id: '2',
    title: '20% Restaurant Discount',
    description: 'Discount at premium restaurants',
    points: 300,
  },
  {
    id: '3',
    title: 'Reward Dinner',
    description: 'Book your dinner using points',
    points: 300,
  },
  {
    id: '4',
    title: 'Monthly Loot Box',
    description: 'Get your hands on a special box filled with exciting rewards, refreshed every month!',
    points: 200,
  },
  {
    id: '5',
    title: 'Exclusive Chef Event',
    description: 'Access to exclusive chef experiences',
    points: 0,
    locked: true,
    exclusive: true,
  },
  {
    id: '6',
    title: 'VIP Treatment',
    description: 'Priority seating and special treatment',
    points: 0,
    locked: true,
    exclusive: true,
  },
];

export const LoyaltyShopView: React.FC = () => {
  const availablePoints = 900;
  const currentTier = 4;

  const handleClaim = (item: RewardItem) => {
    console.log('Claiming:', item.title);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopTitle}>Loyalty Shop</Text>
        <View style={styles.infoRow}>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsEmoji}>💰</Text>
            <Text style={styles.pointsValue}>{availablePoints}</Text>
          </View>
          <View style={styles.tierContainer}>
            <Text style={styles.tierEmoji}>⭐</Text>
            <Text style={styles.tierValue}>Tier {currentTier}</Text>
          </View>
        </View>
      </View>

      {/* Reward Items */}
      {rewardItems.map((item) => (
        <View key={item.id} style={styles.rewardCard}>
          <View style={styles.cardContent}>
            {item.locked && (
              <Text style={styles.lockEmoji}>🔒</Text>
            )}
            <View style={styles.textContent}>
              <Text style={[styles.itemTitle, item.locked && styles.lockedTitle]}>
                {item.title}
              </Text>
              <Text style={[styles.itemDescription, item.locked && styles.lockedDescription]}>
                {item.description}
              </Text>
              {!item.locked && (
                <Text style={styles.itemPoints}>{item.points} points</Text>
              )}
            </View>
            {!item.locked && (
              <Pressable
                style={({ pressed }) => [
                  styles.claimButton,
                  pressed && styles.claimButtonPressed,
                  availablePoints < item.points && styles.claimButtonDisabled,
                ]}
                onPress={() => handleClaim(item)}
                disabled={availablePoints < item.points}
              >
                <Text style={styles.claimButtonText}>Claim</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      <View style={{ height: scaleHeight(100) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: scaleHeight(10),
  },
  header: {
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(16),
  },
  shopTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(4),
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  pointsEmoji: {
    fontSize: scaleFont(14),
    marginRight: scaleWidth(4),
  },
  pointsValue: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tierEmoji: {
    fontSize: scaleFont(14),
    marginRight: scaleWidth(4),
  },
  tierValue: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  rewardCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockEmoji: {
    fontSize: scaleFont(24),
    marginRight: scaleWidth(12),
  },
  textContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
  },
  lockedTitle: {
    color: theme.colors.text.secondary,
  },
  itemDescription: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
    marginBottom: scaleHeight(4),
  },
  lockedDescription: {
    fontStyle: 'italic',
  },
  itemPoints: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  claimButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(24),
    borderRadius: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonPressed: {
    opacity: 0.8,
  },
  claimButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  claimButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
});