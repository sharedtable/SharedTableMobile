#!/bin/bash

# Clean script for SharedTable Mobile project
# Removes unnecessary files and caches

echo "🧹 Cleaning SharedTable Mobile project..."

# Remove OS-specific files
echo "Removing OS-specific files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "Thumbs.db" -type f -delete 2>/dev/null

# Remove editor backup files
echo "Removing editor backup files..."
find . -name "*~" -type f -delete 2>/dev/null
find . -name "*.swp" -type f -delete 2>/dev/null
find . -name "*.swo" -type f -delete 2>/dev/null
find . -name "*.orig" -type f -delete 2>/dev/null
find . -name "*.bak" -type f -delete 2>/dev/null
find . -name "*.backup" -type f -delete 2>/dev/null

# Clean Expo cache
echo "Cleaning Expo cache..."
rm -rf .expo/web/cache 2>/dev/null
rm -f .expo/*.log 2>/dev/null

# Clean React Native cache
echo "Cleaning React Native cache..."
rm -rf $TMPDIR/react-* 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# Clean build artifacts (optional - comment out if you want to keep)
read -p "Remove build artifacts (dist, build folders)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Removing build artifacts..."
    rm -rf dist 2>/dev/null
    rm -rf build 2>/dev/null
    rm -rf .next 2>/dev/null
    rm -rf .turbo 2>/dev/null
fi

# Clean iOS build artifacts (optional)
read -p "Clean iOS build artifacts? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleaning iOS build artifacts..."
    cd ios && xcodebuild clean && cd .. 2>/dev/null
    rm -rf ios/build 2>/dev/null
    rm -rf ios/Pods 2>/dev/null
    rm -rf ios/*.xcworkspace 2>/dev/null
fi

# Clean Android build artifacts (optional)
read -p "Clean Android build artifacts? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleaning Android build artifacts..."
    cd android && ./gradlew clean && cd .. 2>/dev/null
    rm -rf android/build 2>/dev/null
    rm -rf android/app/build 2>/dev/null
    rm -rf android/.gradle 2>/dev/null
fi

# Clean node_modules (optional - very aggressive)
read -p "Remove node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Removing node_modules..."
    rm -rf node_modules 2>/dev/null
    rm -rf backend/node_modules 2>/dev/null
    echo "Run 'npm install' to reinstall dependencies"
fi

# Clear npm/yarn cache (optional)
read -p "Clear npm/yarn cache? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Clearing package manager cache..."
    npm cache clean --force 2>/dev/null
    yarn cache clean 2>/dev/null
fi

echo "✅ Cleanup complete!"
echo ""
echo "Quick size check:"
du -sh . 2>/dev/null
echo ""
echo "To reinstall dependencies, run:"
echo "  npm install"
echo "  cd ios && pod install"