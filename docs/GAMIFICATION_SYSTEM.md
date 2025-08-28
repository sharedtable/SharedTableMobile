# 🎮 SharedTable Gamification System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Point System](#point-system)
4. [Tier System](#tier-system)
5. [Features](#features)
6. [Technical Implementation](#technical-implementation)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [User Journey](#user-journey)
10. [Deployment Guide](#deployment-guide)

---

## System Overview

The SharedTable gamification system is designed to increase user engagement, retention, and community building through a comprehensive rewards and achievement system. Users earn points through various activities, unlock achievements, complete quests, and can redeem rewards from the loyalty shop.

### Core Objectives
- **Engagement**: Encourage frequent dinner bookings and participation
- **Community**: Foster connections through leaderboards and social features
- **Retention**: Maintain user interest with streaks and progressive rewards
- **Loyalty**: Build long-term relationships through tier benefits

---

## Architecture

### Component Structure
```
Gamification System
├── Database Layer (PostgreSQL)
│   ├── Core Tables (stats, points, tiers)
│   ├── Achievement System
│   ├── Quest System
│   ├── Leaderboard Cache
│   └── Loyalty Shop
├── Backend API (Next.js)
│   ├── API Endpoints (/api/gamification/*)
│   ├── Event Handlers
│   └── Database Functions
├── Mobile App (React Native)
│   ├── Zustand Store (gamificationStore.ts)
│   ├── React Query Hooks (useGamification.ts)
│   └── UI Components
└── Type Definitions (gamification.ts)
```

### Data Flow
1. **User Action** → Mobile app interaction
2. **API Request** → Sent via React Query hooks
3. **Backend Processing** → API validates and processes
4. **Database Operation** → PostgreSQL stores/retrieves data
5. **Response** → Data returned to mobile app
6. **UI Update** → React components re-render with new data

---

## Point System

### Point Earning Rules

| Activity | Points | Conditions | Database Field |
|----------|--------|------------|----------------|
| **Complete Dinner Booking** | 50 | After attending dinner | `point_rules.booking_completed` |
| **Early Bird Booking** | +10 | Book 48+ hours in advance | `point_rules.early_bird` |
| **Group Bonus** | +5/guest | Per additional guest brought | `point_rules.group_bonus_per_guest` |
| **Post Review** | 20 | After dinner completion | `point_rules.review_posted` |
| **Weekly Streak** | 50 | Maintain weekly attendance | `point_rules.weekly_streak` |
| **Successful Referral** | 100 | When referred user completes first dinner | `point_rules.referral_success` |
| **Host Dinner** | 100 | Successfully host an event | `point_rules.host_dinner` |
| **First Dinner** | 25 | One-time bonus for new users | `point_rules.first_dinner` |
| **Achievement Unlock** | 25+ | Varies by achievement | `achievements.points` |

### Point Multipliers by Tier
```sql
-- Stored in tier_benefits table
Tier 1 (Newcomer): 1.0x (no multiplier)
Tier 2 (Regular): 1.05x (5% bonus)
Tier 3 (Enthusiast): 1.10x (10% bonus)
Tier 4 (Gourmand): 1.15x (15% bonus)
Tier 5 (Connoisseur): 1.20x (20% bonus)
```

### Point Transaction Tracking
Every point change is recorded in `point_transactions` table:
```typescript
{
  id: UUID,
  user_id: UUID,
  points: number,
  transaction_type: string,
  description: string,
  reference_id: UUID,  // Links to booking, review, etc.
  reference_type: string,
  balance_after: number,
  created_at: timestamp
}
```

---

## Tier System

### Tier Progression

| Tier | Name | Points Required | Benefits | Color | Icon |
|------|------|-----------------|----------|-------|------|
| **1** | Newcomer | 0-99 | • Access to events<br>• Basic support | #9CA3AF | seedling |
| **2** | Regular | 100-499 | • 5% point bonus<br>• Priority waitlist | #10B981 | leaf |
| **3** | Enthusiast | 500-1,499 | • 10% point bonus<br>• Early access to events<br>• Monthly surprise reward | #3B82F6 | star |
| **4** | Gourmand | 1,500-3,999 | • 15% point bonus<br>• Restaurant partner discounts<br>• VIP customer support<br>• Exclusive events access | #8B5CF6 | crown |
| **5** | Connoisseur | 4,000+ | • 20% point bonus<br>• Free monthly dinner<br>• Personal concierge service<br>• Partner perks & benefits | #F59E0B | gem |

### Tier Calculation Function
```sql
CREATE OR REPLACE FUNCTION calculate_user_tier(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE
        WHEN points >= 4000 THEN 5
        WHEN points >= 1500 THEN 4
        WHEN points >= 500 THEN 3
        WHEN points >= 100 THEN 2
        ELSE 1
    END;
END;
$$ LANGUAGE plpgsql;
```

---

## Features

### 1. Dashboard Overview
**Database Tables**: `user_gamification_stats`, `user_streaks`, `leaderboard_cache`

**Components**:
- Welcome message with user's name
- Current tier progress visualization
- Total points and monthly rank display
- Tier benefits showcase
- Streak tracker with bonus information
- Recent achievements

**Real-time Updates**:
- Points balance updates immediately via `add_points_to_user()` function
- Tier progression calculated on each point change
- Streak counter updated via `user_streaks` table

### 2. Leaderboard System
**Database Tables**: `leaderboard_cache`, `user_gamification_stats`

**Three Categories**:
1. **Dinners**: Ranked by `dinners_attended` field
2. **Points**: Ranked by `total_points` field
3. **Monthly**: Based on `point_transactions` in current month

**Cache Strategy**:
```sql
-- Updated hourly via update_leaderboard_cache() function
-- Stores pre-calculated rankings for performance
```

### 3. Quest System
**Database Tables**: `quest_templates`, `quest_tasks`, `user_quests`, `user_quest_progress`

**Quest Types**:
- **Daily**: 24-hour expiry (not yet active)
- **Weekly**: 7-day challenges
- **Biweekly**: 14-day objectives
- **Monthly**: Month-long goals

**Quest Lifecycle**:
1. Template created in `quest_templates`
2. User quest instance in `user_quests`
3. Progress tracked in `user_quest_progress`
4. Completion triggers point award

### 4. Achievement System
**Database Tables**: `achievements`, `user_achievements`

**Categories** (stored in `achievements.category`):
- `dining`: Related to booking and attending
- `social`: Community engagement
- `exploration`: Trying new cuisines/venues
- `loyalty`: Long-term engagement
- `hosting`: For event hosts
- `special`: Limited-time or unique achievements

**Progress Tracking**:
```sql
-- Automatic checking via check_achievements_for_user() function
-- Progress stored in user_achievements.current_progress
-- Unlocking triggers point award
```

### 5. Loyalty Shop
**Database Tables**: `loyalty_items`, `loyalty_redemptions`

**Item Categories**:
- **Discounts**: Restaurant vouchers, percentage off
- **Experiences**: Exclusive events, chef meetings
- **Merchandise**: Branded items, gift boxes
- **Charity**: Convert points to donations

**Redemption Process**:
1. Check item availability and user points
2. Deduct points via `add_points_to_user()`
3. Create redemption record with unique code
4. Update stock if applicable

### 6. Streak System
**Database Tables**: `user_streaks`

**Streak Tracking**:
- Current streak in weeks
- Longest streak achieved
- Weekly points earned
- Milestone rewards at 3, 6, 12 weeks

---

## Technical Implementation

### Mobile App State Management

```typescript
// Zustand Store Structure (src/store/gamificationStore.ts)
interface GamificationState {
  stats: GamificationStats | null;
  achievements: Achievement[];
  quests: Quest[];
  leaderboard: LeaderboardData | null;
  recentTransactions: PointTransaction[];
  streakInfo: StreakInfo | null;
  
  // Actions
  setStats: (stats) => void;
  updatePoints: (points) => void;
  unlockAchievement: (id) => void;
  completeQuestTask: (questId, taskId) => void;
}
```

### React Query Hooks

```typescript
// src/hooks/useGamification.ts
useGamificationStats()    // Fetches user stats
useAchievements()         // Manages achievements
useQuests(type?)          // Handles quests
useLeaderboard()          // Leaderboard data
usePointTransactions()    // Transaction history
useLoyaltyShop()         // Shop items & redemption
useStreak()              // Streak management
useGamificationSync()    // Syncs all data
```

### Caching Strategy

```typescript
// React Query Configuration
{
  staleTime: 30 * 1000,     // Consider data stale after 30s
  gcTime: 5 * 60 * 1000,     // Garbage collect after 5 min
  refetchOnFocus: true,      // Refetch when app comes to foreground
  refetchOnReconnect: true,  // Refetch when network reconnects
}

// AsyncStorage Persistence
- Stats cached locally
- Achievements persist
- Recent transactions (last 10)
- Streak info saved
```

---

## API Endpoints

### Base URL
```
Production: https://sharedtable.app/api/gamification
Development: http://localhost:3000/api/gamification
```

### Endpoints

#### Statistics
```typescript
GET  /stats                 // Get user's complete gamification stats
Response: GamificationStats
```

#### Achievements
```typescript
GET  /achievements          // Get all achievements with progress
POST /achievements/:id/progress  // Update achievement progress
Response: Achievement[]
```

#### Quests
```typescript
GET  /quests?type=weekly    // Get active quests
POST /quests/:questId/tasks/:taskId/complete  // Complete a task
Response: Quest[]
```

#### Leaderboard
```typescript
GET  /leaderboard?type=points|dinners|monthly
Response: LeaderboardData
```

#### Transactions
```typescript
GET  /transactions?limit=50  // Get point history
Response: PointTransaction[]
```

#### Loyalty Shop
```typescript
GET  /loyalty/items         // Get available items
POST /loyalty/redeem/:itemId  // Redeem an item
Response: LoyaltyItem[] | RedemptionResult
```

#### Streaks
```typescript
GET  /streak               // Get streak info
POST /streak/claim         // Claim weekly bonus
Response: StreakInfo
```

---

## Database Schema

### Core Tables

```sql
-- Main user statistics
user_gamification_stats
├── user_id (UUID, unique)
├── total_points (INTEGER)
├── current_tier (INTEGER, 1-5)
├── dinners_attended (INTEGER)
├── dinners_hosted (INTEGER)
├── reviews_posted (INTEGER)
├── referrals_successful (INTEGER)
├── total_points_earned (INTEGER)
└── total_points_spent (INTEGER)

-- Point transaction audit trail
point_transactions
├── id (UUID)
├── user_id (UUID)
├── points (INTEGER)
├── transaction_type (VARCHAR)
├── description (TEXT)
├── reference_id (UUID)
├── reference_type (VARCHAR)
└── balance_after (INTEGER)

-- Achievement definitions and progress
achievements & user_achievements
├── achievement details
├── user progress tracking
└── unlock timestamps

-- Quest system tables
quest_templates, quest_tasks, user_quests, user_quest_progress
├── quest definitions
├── task requirements
└── user progress

-- Leaderboard cache for performance
leaderboard_cache
├── pre-calculated rankings
├── updated hourly
└── three types: points, dinners, monthly

-- Loyalty shop and redemptions
loyalty_items & loyalty_redemptions
├── item catalog
├── redemption history
└── unique codes
```

### Key Database Functions

```sql
-- Add points with tier calculation
add_points_to_user(user_id, points, type, description)

-- Check and unlock achievements
check_achievements_for_user(user_id)

-- Update leaderboard rankings
update_leaderboard_cache()

-- Initialize new user
initialize_user_gamification(user_id)
```

---

## User Journey

### New User Onboarding
```mermaid
graph LR
    A[Sign Up] --> B[Initialize Gamification]
    B --> C[Tier 1: Newcomer]
    C --> D[First Booking +75 pts]
    D --> E[Complete Profile +25 pts]
    E --> F[Tier 2: Regular at 100 pts]
```

### Typical User Flow
```
Daily Check-in → View Dashboard → Check Active Quests
     ↓
Book Dinner → Earn 50+ Points → Update Leaderboard Position
     ↓
Attend Dinner → Complete Quest Task → Maintain/Extend Streak
     ↓
Post Review → Earn 20 Points → Unlock Achievement
     ↓
Visit Loyalty Shop → Redeem Rewards → Feel Accomplished
```

### Power User Behaviors
- Maintain 12+ week streaks for maximum bonuses
- Complete all monthly quests for bonus rewards
- Achieve top 10 leaderboard positions
- Host events for 100-point bonuses
- Maximize referral rewards (100 pts each)
- Strategic point spending in loyalty shop

---

## Deployment Guide

### 1. Database Setup

```bash
# Run the schema on your PostgreSQL database
psql -U your_username -d your_database -f database/gamification_schema.sql

# Verify tables created
psql -U your_username -d your_database -c "\dt"
```

### 2. Backend API Integration

Create API route handlers in your Next.js backend:

```typescript
// pages/api/gamification/stats.ts
import { getGamificationStats } from '@/backend/api/gamification';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getGamificationStats(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### 3. Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/sharedtable
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 4. Event Integration

Add gamification hooks to existing events:

```typescript
// In your booking completion handler
import { onBookingCompleted } from '@/backend/api/gamification';

// When booking is confirmed
await onBookingCompleted(userId, bookingId, guestCount);

// In your review submission handler
import { onReviewPosted } from '@/backend/api/gamification';

// After review is saved
await onReviewPosted(userId, reviewId);

// In your referral system
import { onReferralSuccess } from '@/backend/api/gamification';

// When referred user completes first booking
await onReferralSuccess(referrerId, referredUserId);
```

### 5. Mobile App Configuration

Update your API base URL in the mobile app:

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sharedtable.app/api';
```

### 6. Testing

```bash
# Test database functions
psql -U your_username -d your_database

-- Test adding points
SELECT add_points_to_user('user-uuid', 50, 'test', 'Test transaction');

-- Test achievement checking
SELECT check_achievements_for_user('user-uuid');

-- Test leaderboard update
SELECT update_leaderboard_cache();
```

### 7. Monitoring

Set up monitoring for:
- Point transaction volumes
- Achievement unlock rates
- Quest completion rates
- Leaderboard update performance
- Loyalty shop redemption success

---

## Performance Considerations

### Database Optimizations
- Indexes on all foreign keys and frequently queried columns
- Leaderboard cache updated hourly, not real-time
- Materialized views for complex aggregations
- Connection pooling for high traffic

### Mobile App Optimizations
- Lazy loading of leaderboard data
- Debounced point updates
- Memoized tier calculations
- Virtual scrolling for long lists
- Image caching for avatars

### API Optimizations
- Response caching with Redis (optional)
- Batch operations where possible
- Pagination for large datasets
- Rate limiting to prevent abuse

---

## Security Considerations

### Server-Side Validation
- All point awards validated server-side
- Transaction integrity with PostgreSQL transactions
- User permissions checked on every request
- Rate limiting on point-earning actions

### Anti-Fraud Measures
- Audit trail for all point transactions
- Suspicious activity detection
- Maximum daily point limits (optional)
- Admin review for large redemptions

### Data Protection
- Encrypted storage of sensitive data
- HTTPS only for API communications
- JWT token validation
- SQL injection prevention with parameterized queries

---

## Metrics & Analytics

### Key Performance Indicators (KPIs)
- **Engagement Rate**: % of users earning points weekly
- **Retention**: Users maintaining streaks > 4 weeks
- **Redemption Rate**: Points earned vs. redeemed
- **Tier Distribution**: User distribution across tiers
- **Quest Completion**: Average completion rate

### Success Metrics
- 40% of users reach Tier 2 within first month
- 25% maintain 4+ week streaks
- 60% complete at least one quest per month
- 30% redemption rate in loyalty shop
- 15% of users in top two tiers

### Analytics Queries
```sql
-- Daily active users earning points
SELECT COUNT(DISTINCT user_id) 
FROM point_transactions 
WHERE created_at >= CURRENT_DATE;

-- Tier distribution
SELECT current_tier, COUNT(*) 
FROM user_gamification_stats 
GROUP BY current_tier;

-- Average points per user
SELECT AVG(total_points) 
FROM user_gamification_stats;

-- Quest completion rate
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) * 100.0 / COUNT(*) AS completion_rate
FROM user_quests
WHERE expires_at > NOW();
```

---

## Future Enhancements

### Planned Features
1. **Seasonal Events**: Time-limited quests and 2x point weekends
2. **Team Challenges**: Group-based competitions
3. **Point Gifting**: Transfer points between users
4. **Prediction Games**: Bet points on event outcomes
5. **NFT Badges**: Blockchain-based achievement certificates
6. **AI Recommendations**: Personalized quest suggestions

### Optimization Opportunities
- GraphQL API for efficient data fetching
- WebSocket for real-time point updates
- Machine learning for fraud detection
- Dynamic difficulty adjustment for quests
- Social sharing with Open Graph tags
- Push notifications for milestones

---

## Troubleshooting

### Common Issues

**Points not updating**
- Check `point_transactions` table for records
- Verify `add_points_to_user()` function execution
- Check tier multiplier calculation

**Achievements not unlocking**
- Run `check_achievements_for_user()` manually
- Verify achievement requirements in database
- Check `user_achievements` progress

**Leaderboard not showing**
- Run `update_leaderboard_cache()` function
- Check cache expiry settings
- Verify user has stats record

**Quest not appearing**
- Check quest template is active
- Verify expiry dates
- Run quest creation function

---

## Support & Maintenance

### Regular Maintenance Tasks
- Weekly: Review point transaction anomalies
- Monthly: Archive old transactions
- Quarterly: Review and adjust point rules
- Yearly: Analyze tier distribution and adjust thresholds

### Monitoring Checklist
- [ ] Database performance metrics
- [ ] API response times
- [ ] Error rates and types
- [ ] User engagement metrics
- [ ] Point economy balance

---

This gamification system is designed to scale with your user base while maintaining engaging and rewarding experiences that encourage long-term platform loyalty.

For questions or support, contact the development team.