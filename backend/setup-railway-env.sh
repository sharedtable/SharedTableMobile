#!/bin/bash

# Railway Environment Variables Setup Script
# Run this script to set all required environment variables on Railway

echo "Setting up Railway environment variables for Fare Backend..."
echo "Make sure you're logged into Railway CLI (railway login)"
echo ""

# You need to be in the backend directory and linked to your Railway project
echo "First, link to your Railway project if not already linked:"
echo "railway link"
echo ""

echo "Now setting environment variables..."

# Server Configuration
railway variables set NODE_ENV=production

# Supabase Configuration
railway variables set SUPABASE_URL=https://sxrvesdqhcovajaqnqcw.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cnZlc2RxaGNvdmFqYXFucWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NzgxNzAsImV4cCI6MjA3MDQ1NDE3MH0.IVjirwF3tEjKJ9j70lLMPobf9Zez914bEFZd2JdAeMY
railway variables set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cnZlc2RxaGNvdmFqYXFucWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg3ODE3MCwiZXhwIjoyMDcwNDU0MTcwfQ.45xJ2D56FqNPkYxVpaUfEMG7189Fh3--87xKTmAOrDU
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cnZlc2RxaGNvdmFqYXFucWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg3ODE3MCwiZXhwIjoyMDcwNDU0MTcwfQ.45xJ2D56FqNPkYxVpaUfEMG7189Fh3--87xKTmAOrDU

# Privy Configuration
railway variables set PRIVY_APP_ID=cmej9f9cp00xbl10b8zwjifec
railway variables set PRIVY_APP_SECRET=364eWFMTH556qdCPyTJVstoxH9QcqDVRJmg3yMzgMbHZcn7nWu1GkxkV839UnSWAUQCwBKYqDm9tSH5VJrGnCtcc

# CORS Configuration - Allow all origins in production for mobile app
railway variables set ALLOWED_ORIGINS="*"

# Rate Limiting
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=500

# API Keys
railway variables set API_SECRET_KEY=prod-secret-key-fare-backend-2025

# Logging
railway variables set LOG_LEVEL=info

# Stream Configuration
railway variables set STREAM_API_KEY=2eqan9bwcshj
railway variables set STREAM_API_SECRET=uczhhkbqppdzutm9ac5q5vw329ejhdry9njcc8qt5387jzd736urvbe6fnfzp5ey

# Stripe Configuration
# Set your Stripe secret key
# railway variables set STRIPE_SECRET_KEY=your_stripe_secret_key_here
# railway variables set STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
# Note: Add STRIPE_WEBHOOK_SECRET when you configure the webhook endpoint

echo ""
echo "All environment variables have been set!"
echo "The deployment should restart automatically with the new variables."
echo ""
echo "To verify, run: railway variables"