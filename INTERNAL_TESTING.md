# 📱 SharedTable Internal Testing Guide

## 🚀 Quick Start

### 1. Build Internal Release

```bash
# Run the automated script
./scripts/internal-release.sh

# Or manually:
eas build --profile internal --platform all
```

### 2. Distribution Methods

#### **iOS - TestFlight**
1. Wait for build to complete (~15-30 min)
2. Go to App Store Connect
3. Select "TestFlight" tab
4. Add internal testers (up to 100)
5. Share TestFlight link

#### **Android - Internal Testing Track**
1. Download APK from Expo dashboard
2. Share via:
   - Direct link
   - Firebase App Distribution
   - Google Play Internal Testing

## 🔧 Testing Environments

### Development
- **Purpose**: Local development
- **API**: `http://localhost:3000/api`
- **Features**: All enabled
- **Build**: `eas build --profile development`

### Internal
- **Purpose**: Team testing
- **API**: `https://sharedtable-staging.vercel.app/api`
- **Features**: Stable features only
- **Build**: `eas build --profile internal`

### Preview
- **Purpose**: Beta testing with external users
- **API**: `https://sharedtable-staging.vercel.app/api`
- **Features**: Production-ready only
- **Build**: `eas build --profile preview`

## 🎮 Feature Flags

Access Developer Settings in the app:
1. Go to Profile → Settings
2. Tap version number 7 times (if in internal build)
3. Access "Developer Settings"

### Available Flags

#### Web3 Features
- `WEB3_SOCIAL`: Enable Web3 social features
- `TIPPING_ENABLED`: Enable crypto tipping
- `NFT_BADGES`: Enable NFT achievements
- `TOKEN_REWARDS`: Enable token rewards

#### Gamification
- `XP_SYSTEM`: Enable XP and levels
- `LEADERBOARDS`: Enable leaderboards
- `ACHIEVEMENTS`: Enable achievements
- `DAILY_CHALLENGES`: Enable daily challenges

#### Experimental
- `AI_RECOMMENDATIONS`: AI-powered recommendations
- `AR_MENU_VIEWER`: AR menu viewing
- `VOICE_REVIEWS`: Voice-based reviews

## 📊 Testing Checklist

### Core Features
- [ ] **Authentication**
  - [ ] Sign up with email
  - [ ] Login/logout
  - [ ] Password reset
  - [ ] Privy wallet connection

- [ ] **Social Feed**
  - [ ] Create post with image
  - [ ] Like/unlike posts
  - [ ] View feed updates
  - [ ] Pull to refresh

- [ ] **Chat**
  - [ ] Send messages
  - [ ] Create new conversations
  - [ ] Receive notifications

- [ ] **Events**
  - [ ] Browse events
  - [ ] Book event
  - [ ] View bookings

### Platform-Specific
- [ ] **iOS**
  - [ ] Push notifications
  - [ ] Camera permissions
  - [ ] Safe area handling
  - [ ] Haptic feedback

- [ ] **Android**
  - [ ] Back button behavior
  - [ ] Permissions flow
  - [ ] Deep linking

## 🐛 Bug Reporting

### Required Information
1. **Device**: Model and OS version
2. **Build**: Version and build number
3. **Steps**: Exact reproduction steps
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Logs**: Export from Developer Settings

### Reporting Channels
- **Critical**: Slack #sharedtable-urgent
- **Normal**: GitHub Issues
- **Feature Request**: Slack #sharedtable-features

## 📈 Analytics & Monitoring

### Crash Reporting
- Sentry integration for crash reports
- View at: `sentry.io/organizations/sharedtable`

### Analytics Events
```javascript
// Key events to verify:
- app_open
- user_signup
- post_created
- event_booked
- chat_message_sent
```

### Performance Metrics
- App launch time: < 2s
- Screen load time: < 500ms
- Image load time: < 1s
- API response time: < 200ms

## 🔐 Test Accounts

### Internal Test Users
```
Email: test1@sharedtable.app
Password: TestUser123!

Email: test2@sharedtable.app
Password: TestUser123!

Email: admin@sharedtable.app
Password: AdminTest123!
```

## 🛠️ Debugging Tools

### React Native Debugger
```bash
# Install
brew install react-native-debugger

# Connect
# Shake device or Cmd+D in simulator
# Select "Debug with Chrome"
```

### Flipper
```bash
# Install
brew install flipper

# Features:
- Network inspection
- Database viewer
- Layout inspector
- Crash reporter
```

### Expo Dev Tools
```bash
# While running expo start:
# Press 'd' to open dev tools
# Press 'shift+d' for more options
```

## 📝 Release Notes Template

```markdown
## Version X.X.X - Internal Build

### 🎯 Testing Focus
- [ ] Feature A - needs thorough testing
- [ ] Bug fix B - verify it's resolved
- [ ] Performance improvement C - measure impact

### ✨ New Features
- Feature 1: Description
- Feature 2: Description

### 🐛 Bug Fixes
- Fixed: Issue description
- Fixed: Issue description

### 💔 Known Issues
- Issue 1: Workaround if available
- Issue 2: Expected fix date

### 📊 Metrics to Track
- Metric 1: Target value
- Metric 2: Target value
```

## 🚢 Promoting to Production

### Checklist
- [ ] All critical bugs fixed
- [ ] Performance metrics met
- [ ] 48 hours of stable internal testing
- [ ] Feature flags configured for production
- [ ] Analytics events verified
- [ ] Crash rate < 0.1%

### Build Production
```bash
# Final production build
eas build --profile production --platform all

# Submit to stores
eas submit --profile production
```

## 🆘 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache
expo start -c
rm -rf node_modules
npm install
```

#### TestFlight Not Updating
1. Increment build number
2. Wait for processing (15-30 min)
3. Refresh TestFlight app

#### Feature Flags Not Working
1. Kill app completely
2. Clear AsyncStorage
3. Reinstall app

## 📚 Additional Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [Google Play Console](https://play.google.com/console)
- [React Native Debugging](https://reactnative.dev/docs/debugging)

## 👥 Team Contacts

- **Tech Lead**: @your-slack-handle
- **QA Lead**: @qa-slack-handle
- **Product Manager**: @pm-slack-handle

---

*Last Updated: [Current Date]*
*Build Configuration: eas.json*
*Feature Flags: src/utils/featureFlags.ts*