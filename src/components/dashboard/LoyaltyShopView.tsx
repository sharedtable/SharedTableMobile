import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/base/Icon';
import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useLoyaltyShop, useGamificationStats } from '@/hooks/useGamification';
import type { LoyaltyItem } from '@/types/gamification';

type ItemCategory = 'all' | 'discount' | 'experience' | 'merchandise' | 'charity';

// Default items for fallback when API is unavailable
const defaultItems: LoyaltyItem[] = [
  {
    id: '1',
    name: 'Free Coffee',
    description: 'Complimentary coffee at partner cafés',
    cost: 300,
    category: 'discount',
    available: true,
  },
  {
    id: '2',
    name: '20% Restaurant Discount',
    description: 'Discount at premium restaurants',
    cost: 500,
    category: 'discount',
    available: true,
  },
  {
    id: '3',
    name: 'Reward Dinner',
    description: 'Book your dinner using points',
    cost: 1000,
    category: 'experience',
    available: true,
  },
  {
    id: '4',
    name: 'Monthly Loot Box',
    description: 'Get your hands on a special box filled with exciting rewards, refreshed every month!',
    cost: 200,
    category: 'merchandise',
    available: true,
  },
  {
    id: '5',
    name: 'Exclusive Chef Event',
    description: 'Access to exclusive chef experiences',
    cost: 2000,
    category: 'experience',
    available: false,
  },
  {
    id: '6',
    name: 'Donate to Charity',
    description: 'Convert your points to charitable donations',
    cost: 100,
    category: 'charity',
    available: true,
  },
];

export const LoyaltyShopView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { items: apiItems, isLoading, redeemItem, isRedeeming, refetch } = useLoyaltyShop();
  const { stats } = useGamificationStats();
  
  // Use API items if available, otherwise fall back to default
  const items = apiItems.length > 0 ? apiItems : defaultItems;
  
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);
  
  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'discount', label: 'Discounts', icon: 'tag' },
    { id: 'experience', label: 'Experiences', icon: 'star' },
    { id: 'merchandise', label: 'Merch', icon: 'gift' },
    { id: 'charity', label: 'Charity', icon: 'heart' },
  ];
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  
  const handleRedeem = useCallback((item: LoyaltyItem) => {
    if (!stats) return;
    
    if (stats.totalPoints < item.cost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${item.cost - stats.totalPoints} more points to redeem this item.`
      );
      return;
    }
    
    Alert.alert(
      'Confirm Redemption',
      `Redeem "${item.name}" for ${item.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              redeemItem(item.id);
              Alert.alert('Success', 'Item redeemed successfully!');
            } catch (_error) {
              Alert.alert('Error', 'Failed to redeem item. Please try again.');
            }
          },
        },
      ]
    );
  }, [stats, redeemItem]);
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discount': return 'tag';
      case 'experience': return 'star';
      case 'merchandise': return 'gift';
      case 'charity': return 'heart';
      default: return 'grid';
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discount': return '#10B981';
      case 'experience': return '#8B5CF6';
      case 'merchandise': return '#F59E0B';
      case 'charity': return '#EF4444';
      default: return theme.colors.primary.main;
    }
  };

  return (
    <View style={styles.container}>
      {/* Points Balance Header */}
      <LinearGradient
        colors={['#4A90E2', '#5BA3F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsHeader}
      >
        <View style={styles.pointsContent}>
          <Text style={styles.pointsLabel}>Available Points</Text>
          <Text style={styles.pointsValue}>{stats?.totalPoints || 0}</Text>
          <Text style={styles.pointsInfo}>
            Redeem points for exclusive rewards and experiences
          </Text>
        </View>
      </LinearGradient>
      
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => setActiveCategory(category.id as ItemCategory)}
          >
            <Icon 
              name={category.icon as any} 
              size={16} 
              color={activeCategory === category.id ? theme.colors.white : theme.colors.primary.main}
            />
            <Text 
              style={[
                styles.categoryTabText,
                activeCategory === category.id && styles.categoryTabTextActive,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      {/* Items Grid */}
      <ScrollView 
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
        {isLoading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading rewards...</Text>
          </View>
        )}
        
        {!isLoading && filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name={"inbox" as any} size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No items available</Text>
            <Text style={styles.emptyStateText}>
              Check back later for new rewards in this category
            </Text>
          </View>
        )}
        
        <View style={styles.itemsGrid}>
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                !item.available && styles.itemCardDisabled,
              ]}
            >
              <View style={styles.itemImageContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={[
                    styles.itemImagePlaceholder,
                    { backgroundColor: `${getCategoryColor(item.category)}20` },
                  ]}>
                    <Icon 
                      name={getCategoryIcon(item.category) as any} 
                      size={32} 
                      color={getCategoryColor(item.category)}
                    />
                  </View>
                )}
                {!item.available && (
                  <View style={styles.soldOutBadge}>
                    <Text style={styles.soldOutText}>Locked</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                
                <View style={styles.itemFooter}>
                  <View style={styles.itemCost}>
                    <Icon name="star" size={14} color="#FFB800" />
                    <Text style={styles.itemCostText}>{item.cost} pts</Text>
                  </View>
                  
                  {item.expiresAt && (
                    <Text style={styles.expiryText}>
                      Expires {new Date(item.expiresAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                
                {stats && stats.totalPoints >= item.cost && item.available && (
                  <Pressable 
                    style={styles.redeemButton}
                    onPress={() => handleRedeem(item)}
                    disabled={isRedeeming}
                  >
                    <Text style={styles.redeemButtonText}>
                      {isRedeeming ? 'Processing...' : 'Redeem'}
                    </Text>
                  </Pressable>
                )}
                
                {stats && stats.totalPoints < item.cost && item.available && (
                  <View style={styles.insufficientPointsBadge}>
                    <Text style={styles.insufficientPointsText}>
                      Need {item.cost - stats.totalPoints} more pts
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
        
        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    backgroundColor: theme.colors.white,
    borderBottomColor: Colors.gray200,
    borderBottomWidth: 1,
    maxHeight: scaleHeight(60),
  },
  categoriesContent: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  categoryTab: {
    alignItems: 'center',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    flexDirection: 'row',
    gap: scaleWidth(6),
    marginRight: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primary.main,
  },
  categoryTabText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  categoryTabTextActive: {
    color: theme.colors.white,
  },
  container: {
    backgroundColor: Colors.backgroundLight,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(80),
    paddingHorizontal: scaleWidth(40),
  },
  emptyStateText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  emptyStateTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginTop: scaleHeight(16),
  },
  expiryText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
  },
  insufficientPointsBadge: {
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: scaleWidth(8),
    marginTop: scaleHeight(8),
    paddingVertical: scaleHeight(6),
  },
  insufficientPointsText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  itemCard: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray200,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    flex: 1,
    margin: scaleWidth(8),
    maxWidth: '45%',
    minWidth: scaleWidth(160),
    overflow: 'hidden',
  },
  itemCardDisabled: {
    opacity: 0.6,
  },
  itemCost: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scaleWidth(4),
  },
  itemCostText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  itemDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(16),
    marginBottom: scaleHeight(8),
  },
  itemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemImage: {
    height: scaleHeight(120),
    width: '100%',
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    height: scaleHeight(120),
    justifyContent: 'center',
    width: '100%',
  },
  itemInfo: {
    padding: scaleWidth(12),
  },
  itemName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scaleWidth(8),
    paddingTop: scaleHeight(16),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(40),
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(12),
  },
  pointsContent: {
    alignItems: 'center',
  },
  pointsHeader: {
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(24),
  },
  pointsInfo: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
    textAlign: 'center',
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  pointsValue: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(36),
    fontWeight: '700',
    marginVertical: scaleHeight(4),
  },
  redeemButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(8),
    marginTop: scaleHeight(8),
    paddingVertical: scaleHeight(8),
  },
  redeemButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scaleWidth(4),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    position: 'absolute',
    right: scaleWidth(8),
    top: scaleHeight(8),
  },
  soldOutText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
});