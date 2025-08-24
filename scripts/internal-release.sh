#!/bin/bash

# SharedTable Internal Release Script
# This script automates the internal testing release process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SharedTable Internal Release Builder${NC}"
echo "======================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}📱 Please login to Expo${NC}"
    eas login
fi

# Function to select platform
select_platform() {
    echo ""
    echo "Select platform:"
    echo "1) iOS only"
    echo "2) Android only"
    echo "3) Both platforms"
    read -p "Enter choice [1-3]: " platform_choice
}

# Function to select build type
select_build_type() {
    echo ""
    echo "Select build type:"
    echo "1) Development (local testing)"
    echo "2) Internal (team testing)"
    echo "3) Preview (beta testing)"
    read -p "Enter choice [1-3]: " build_choice
}

# Function to get version bump
get_version_bump() {
    echo ""
    echo "Bump version?"
    echo "1) No change"
    echo "2) Patch (0.0.1)"
    echo "3) Minor (0.1.0)"
    echo "4) Major (1.0.0)"
    read -p "Enter choice [1-4]: " version_choice
}

# Main flow
select_platform
select_build_type
get_version_bump

# Set build profile based on selection
case $build_choice in
    1) PROFILE="development" ;;
    2) PROFILE="internal" ;;
    3) PROFILE="preview" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

# Version bump if needed
if [ "$version_choice" != "1" ]; then
    echo -e "${YELLOW}📝 Updating version...${NC}"
    case $version_choice in
        2) npm version patch --no-git-tag-version ;;
        3) npm version minor --no-git-tag-version ;;
        4) npm version major --no-git-tag-version ;;
    esac
fi

# Run tests first
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test --passWithNoTests || {
    echo -e "${RED}❌ Tests failed. Fix tests before building.${NC}"
    exit 1
}

# Type check
echo -e "${YELLOW}🔍 Type checking...${NC}"
npm run type-check || {
    echo -e "${RED}❌ Type errors found. Fix before building.${NC}"
    exit 1
}

# Build based on platform selection
case $platform_choice in
    1)
        echo -e "${GREEN}🍎 Building iOS for $PROFILE...${NC}"
        eas build --platform ios --profile $PROFILE --non-interactive
        ;;
    2)
        echo -e "${GREEN}🤖 Building Android for $PROFILE...${NC}"
        eas build --platform android --profile $PROFILE --non-interactive
        ;;
    3)
        echo -e "${GREEN}📱 Building both platforms for $PROFILE...${NC}"
        eas build --platform all --profile $PROFILE --non-interactive
        ;;
    *)
        echo -e "${RED}Invalid platform choice${NC}"
        exit 1
        ;;
esac

# Generate QR codes for easy distribution
echo -e "${GREEN}✅ Build submitted successfully!${NC}"
echo ""
echo -e "${YELLOW}📲 Distribution:${NC}"
echo "1. Check build status: eas build:list"
echo "2. Once complete, share links with team"
echo "3. iOS: Install via TestFlight"
echo "4. Android: Direct APK install"

# Optional: Send Slack notification
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 New $PROFILE build submitted for SharedTable\"}" \
        $SLACK_WEBHOOK_URL
fi

echo -e "${GREEN}🎉 Done!${NC}"