#!/bin/bash

echo "Fixing TypeScript errors in backend..."

# Fix feedRoutes.ts - Add return statements for async route handlers
sed -i '' 's/router\.post.*async (req.*res.*) => {/&\n  return new Promise((resolve) => {/' src/routes/feedRoutes.ts
sed -i '' 's/router\.get.*async (req.*res.*) => {/&\n  return new Promise((resolve) => {/' src/routes/feedRoutes.ts
sed -i '' 's/router\.delete.*async (req.*res.*) => {/&\n  return new Promise((resolve) => {/' src/routes/feedRoutes.ts

# Fix onboarding.ts - Add return statement
sed -i '' '375a\
  return new Promise((resolve) => {' src/routes/onboarding.ts

# Add closing for promises at catch blocks
find src/routes -name "*.ts" -exec sed -i '' '/} catch (error)/i\
    resolve(undefined);' {} \;

echo "TypeScript fixes applied. Run 'npm run build' to verify."