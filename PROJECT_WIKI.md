# 📚 SharedTable Mobile - Project Wiki

> **Last Updated**: January 2025  
> **Project Status**: 🟢 Active Development  
> **Current Sprint**: Authentication & Core Features

---

## 🎯 Project Overview

SharedTable Mobile is a React Native dining companion app that connects Stanford community members through shared meals and events. Built with Expo and integrated with Supabase for authentication and data management.

### 🔗 Quick Links

- [Supabase Integration Guide](./SUPABASE_INTEGRATION.md)
- [OAuth Setup Guide](./OAUTH_SETUP_GUIDE.md)
- [Development Setup](#-development-setup)
- [Architecture Overview](#-architecture)

---

## 📊 Current Status Dashboard

### 🚀 **Recently Completed** (This Week)

- ✅ **Supabase Authentication Integration** - Full OAuth + OTP implementation
- ✅ **Database User Management** - Automatic user creation with conflict handling
- ✅ **Deep Linking Setup** - OAuth callbacks working for iOS/Android
- ✅ **ESLint Cleanup** - Reduced warnings from 335 to 322
- ✅ **Code Quality Improvements** - Fixed all critical ESLint errors
- ✅ **Documentation Updates** - Comprehensive Supabase integration docs

### 🔄 **In Progress**

- 🟡 **UI/UX Polish** - Component styling and responsive design
- 🟡 **Onboarding Flow** - Multi-step user onboarding screens
- 🟡 **Profile Management** - User profile editing and photo upload

### 📋 **Next Up**

- 📅 **Event Management** - Dining event creation and booking
- 📅 **Push Notifications** - Expo notifications setup
- 📅 **Testing Suite** - Unit and integration tests
- 📅 **Performance Optimization** - Bundle size and load time improvements

---

## 🏗️ Architecture

### **Core Technologies**

```
Frontend:     React Native 0.73.6 + Expo SDK 50
Auth:         Supabase (OAuth + OTP)
State:        Zustand + React Context
Navigation:   Custom screen-based navigation
Styling:      StyleSheet + Theme system
Storage:      Expo SecureStore (auth) + AsyncStorage
```

### **Project Structure**

```
src/
├── components/          # Reusable UI components
│   ├── base/           # Base components (Button, Icon, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   └── navigation/     # Navigation components
├── lib/                # Core libraries and services
│   ├── auth/          # Authentication (Supabase)
│   ├── supabase/      # Supabase client and types
│   └── utils/         # Utility functions
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── onboarding/   # User onboarding flow
│   ├── dashboard/    # Main app screens
│   └── settings/     # Settings and profile
├── theme/            # Design system and theme
├── types/            # TypeScript type definitions
└── utils/            # Helper utilities
```

---

## 🔐 Authentication Status

### **✅ Implemented Features**

- **Email OTP**: Passwordless authentication with 6-digit codes
- **Google OAuth**: Native sign-in with deep linking
- **Apple Sign In**: iOS integration with credential handling
- **Session Management**: Secure token storage and auto-refresh
- **Database Integration**: Automatic user record creation/updates
- **Error Handling**: Comprehensive error messages and fallbacks

### **🔧 Configuration**

```
Supabase Project:  https://sxrvesdqhcovajaqnqcw.supabase.co
Deep Link Scheme:  sharedtable://auth-callback
Bundle ID (iOS):   edu.stanford.sharedtable
Package (Android): edu.stanford.sharedtable
```

### **📱 User Flow**

1. User opens app → Auth state check
2. New user → Welcome screen with OAuth/OTP options
3. Authentication → Database user creation/update
4. First-time users → Onboarding flow
5. Returning users → Dashboard/Home screen

---

## 🛠️ Development Setup

### **Prerequisites**

```bash
Node.js 18+
npm or yarn
Expo CLI
iOS Simulator (Mac) or Android Studio
```

### **Getting Started**

```bash
# Clone and install
git clone [repository-url]
cd SharedTableMobile
npm install

# Environment setup
cp .env.example .env
# Fill in Supabase credentials in .env

# Run the app
npm start               # Start Expo dev server
npm run ios            # iOS simulator
npm run android        # Android emulator
```

### **Key Commands**

```bash
# Development
npm start              # Start development server
npm run lint          # Run ESLint checks
npm run type-check    # TypeScript type checking

# Testing
npm test              # Run Jest tests
npm run test:watch    # Watch mode for tests

# Building
expo build:ios        # Build iOS app
expo build:android    # Build Android app
```

---

## 📱 Screen Implementation Status

### **Authentication Screens** ✅

- ✅ **WelcomeScreen** - OAuth buttons + OTP email input
- ✅ **OtpVerificationScreen** - 6-digit code verification
- ✅ **LoadingScreen** - App initialization with logo

### **Onboarding Screens** 🟡

- ✅ **OnboardingNameScreen** - Name collection
- ✅ **OnboardingBirthdayScreen** - Birthday selection
- ✅ **OnboardingGenderScreen** - Gender selection
- 🟡 **OnboardingDependentsScreen** - Dependents info
- 🟡 **OnboardingWorkScreen** - Work/study info
- 🟡 **OnboardingEthnicityScreen** - Ethnicity selection
- 🟡 **OnboardingRelationshipScreen** - Relationship status
- 🟡 **OnboardingLifestyleScreen** - Lifestyle preferences
- 🟡 **OnboardingInterestsScreen** - Interest selection
- 🟡 **OnboardingPersonalityScreen** - Personality traits
- 🟡 **OnboardingPhotoScreen** - Profile photo upload

### **Main App Screens** 🟡

- 🟡 **HomeScreen** - Main dashboard
- 🟡 **DashboardScreen** - User dashboard
- ✅ **SettingsScreen** - User settings with logout
- 🟡 **ProfileScreen** - User profile management
- 🟡 **EventsScreen** - Dining events list
- 🟡 **BookingsScreen** - User bookings

### **Component Library** ✅

- ✅ **Button** - Styled button with variants
- ✅ **Icon** - Icon component system
- ✅ **TopBar** - Navigation top bar
- ✅ **MyQuestView** - Dashboard quest component

---

## 🎨 Design System

### **Theme Configuration**

```typescript
// Core Colors
primary: '#E24849'     // SharedTable red
secondary: '#C17B5C'   // Brown accent
white: '#FFFFFF'
gray: { '1': '#F0F0F0', '2': '#E5E5E5' }

// Typography
fontFamily: {
  heading: 'KeaniaOne-Regular',
  body: 'Inter-Regular'
}

// Responsive Scaling
scaleWidth()   // Responsive width scaling
scaleHeight()  // Responsive height scaling
scaleFont()    // Responsive font scaling
```

### **Component Standards**

- All components use StyleSheet (no inline styles)
- Colors from theme system (no hardcoded colors)
- Responsive scaling for all dimensions
- TypeScript interfaces for all props
- Accessibility labels and roles

---

## 🚨 Known Issues & Technical Debt

### **High Priority**

- 🔴 **TypeScript `any` types** - 150+ instances need proper typing
- 🔴 **Color literals** - 50+ hardcoded colors should use theme
- 🔴 **File length warnings** - Some files exceed 300 lines

### **Medium Priority**

- 🟡 **Bundle size optimization** - Current bundle not optimized
- 🟡 **Performance profiling** - No performance monitoring setup
- 🟡 **Error boundary implementation** - Basic error boundary exists
- 🟡 **Accessibility audit** - Limited accessibility testing

### **Low Priority**

- 🟢 **Inline style cleanup** - 11 remaining inline styles
- 🟢 **Unescaped entities** - 5 remaining JSX entities
- 🟢 **Code splitting** - Opportunity for lazy loading

---

## 📊 Code Quality Metrics

### **ESLint Status** (Last Updated: Today)

- ✅ **0 Errors** (down from 3)
- 🟡 **322 Warnings** (down from 335)
- ✅ **Style ordering fixed** - All StyleSheet properties alphabetized
- ✅ **Unused imports removed** - Clean imports across codebase

### **TypeScript Coverage**

- 🟡 **~75% strict typing** - Core components typed
- 🔴 **~25% any types** - Needs improvement in styles and handlers

### **Test Coverage**

- 🔴 **0% coverage** - Testing suite not yet implemented
- 📅 **Target: 80% coverage** - Planned for next sprint

---

## 🔄 Recent Changes Log

### **Week of Jan 6-12, 2025**

- ✅ Implemented complete Supabase authentication system
- ✅ Added Google OAuth with deep linking
- ✅ Added Apple Sign In for iOS
- ✅ Created database user management with conflict resolution
- ✅ Fixed all ESLint errors and reduced warnings
- ✅ Updated project documentation
- ✅ Fixed logout functionality and navigation
- ✅ Added auth state listeners for automatic navigation

### **Previous Week**

- ✅ Initial project setup with Expo
- ✅ Core navigation structure
- ✅ Basic component library
- ✅ Theme system implementation

---

## 👥 Team Collaboration

### **Development Workflow**

1. **Feature Branches** - Create feature branches from `main`
2. **Code Review** - All changes require review
3. **Testing** - Test on both iOS and Android
4. **Documentation** - Update wiki for significant changes

### **Communication Channels**

- **Technical Issues** - GitHub Issues
- **Progress Updates** - This wiki file
- **Code Review** - GitHub Pull Requests

### **Definition of Done**

- ✅ Feature works on iOS and Android
- ✅ No ESLint errors introduced
- ✅ TypeScript types properly defined
- ✅ Documentation updated
- ✅ Basic testing completed

---

## 📋 Sprint Planning

### **Current Sprint Goals**

1. **Complete Onboarding Flow** - All 11 onboarding screens
2. **Profile Management** - User profile editing
3. **Photo Upload** - Profile photo functionality
4. **Push Notifications** - Basic notification setup

### **Next Sprint Preview**

1. **Event Management** - Create and view dining events
2. **Booking System** - Event booking and management
3. **Social Features** - Friend connections and invites
4. **Testing Implementation** - Unit and integration tests

---

## 🎯 Success Metrics

### **Development KPIs**

- **Code Quality**: Maintain 0 ESLint errors
- **TypeScript**: Increase type coverage to 90%+
- **Performance**: App load time under 2 seconds
- **Accessibility**: Full screen reader support

### **User Experience KPIs**

- **Authentication**: <30 second OAuth flow
- **Onboarding**: <3 minutes to complete
- **Navigation**: <1 second screen transitions
- **Reliability**: <1% crash rate

---

## 📞 Quick Reference

### **Important File Locations**

```
Authentication:        src/lib/auth/context/AuthContext.tsx
Supabase Config:      src/lib/supabase/client.ts
Main App Entry:       App.tsx
Environment Config:   .env.example
App Configuration:    app.json
Theme System:         src/theme/
```

### **Key Environment Variables**

```
EXPO_PUBLIC_SUPABASE_URL=https://sxrvesdqhcovajaqnqcw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[configured]
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### **Useful Commands**

```bash
# Development
npm start                    # Start dev server
npm run ios                 # iOS simulator
npm run android            # Android emulator

# Code Quality
npm run lint               # ESLint check
npm run type-check        # TypeScript check

# Debugging
npx expo doctor           # Check Expo setup
npx expo install --fix    # Fix dependencies
```

---

## 🔄 Maintenance Schedule

**Weekly:**

- Update this wiki with progress
- Review and update ESLint warnings count
- Check dependency updates
- Review and merge feature branches

**Monthly:**

- Security audit of dependencies
- Performance profiling and optimization
- Documentation review and updates
- Team retrospective and planning

---

_This wiki is maintained by the development team and updated weekly. For the most current information, check the last updated date at the top of this document._
