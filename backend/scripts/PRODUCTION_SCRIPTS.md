# Production Scripts Documentation

## Cleanup Completed on 2025-01-06

### ✅ Removed Deprecated Files

#### Test Data Creation Scripts
- All `createTest*.ts` files - Used for creating test users
- `createAug29RegularDinner.js` - Test dinner creation
- `createFridayDinnerWithSignups.js` - Test dinner creation
- `createTestSignups.js` - Test signup creation
- `createTestUserProfiles.js` - Test profile creation
- `testGroupedFlow.js` - Testing script

#### External Service Dependencies
- `runMatching.ts` - Depended on SharedTableMatchingAlgorithm services
- `processTestUserFeatures.ts` - Feature preprocessing service
- `processQuinnFeatures.ts` - Feature preprocessing service
- `testSharedTableServices.ts` - External service testing
- `setupTestEnvironment.ts` - Test environment setup

#### One-time Fixes (Already Applied)
- `fix-user-stats.js` - Database fix
- `fixDayOfWeek.js` - Data correction
- `fixGroupingLogic.js` - Logic fix
- `fixAdditionalUsersProfiles.ts` - Profile corrections
- `fixProfilesAndPreferences.ts` - Data corrections
- `fixQuinnProfile.ts` - Specific user fix
- `verifyTestData.ts` - Test data verification

#### Simulation Scripts
- `simulateGrouping.js` - Testing grouping logic

---

## 📦 Production-Ready Scripts

### Database Management
- **`apply-schema-migration.js`** - Apply database schema migrations
- **`verify-migration.js`** - Verify migration success

### Data Management
- **`add-users-to-dinner.js`** - Add users to dinner groups
- **`addUserToGroup.js`** - Add single user to group
- **`update-dinner-group.js`** - Update dinner group data

### Gamification System
- **`init-all-gamification.js`** - Initialize complete gamification system
- **`init-gamification.js`** - Basic gamification setup
- **`init-tiers.js`** - Initialize tier system
- **`init-tiers-correct.js`** - Corrected tier initialization
- **`run-gamification-migration.js`** - Run gamification migrations

---

## 🚀 Usage

All production scripts are standalone Node.js utilities that connect to the database via environment variables.

### Running a Script
```bash
cd backend/scripts
node [script-name].js
```

### Environment Requirements
Scripts require `.env` file in backend directory with:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## ⚠️ Important Notes

1. **No External Dependencies**: All scripts now work independently without requiring external preprocessing services
2. **Production Ready**: These scripts are safe to use in production environments
3. **Database Operations**: All scripts include proper error handling and transaction support where needed

---

## 🔒 Security

- All scripts use service role key for admin operations
- No hardcoded credentials
- Environment variables for configuration