# SharedTable Backend API

Production-grade backend API for SharedTable Mobile App with Privy authentication and Supabase integration.

## Features

- 🔐 Secure user authentication with Privy
- 👤 User management with Supabase (using service role key)
- 💼 Wallet management for Web3 features
- 🛡️ Rate limiting and security headers
- 📝 Comprehensive logging
- 🚀 Production-ready architecture

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase (CRITICAL - Service key for bypassing RLS)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key  # ⚠️ NEVER expose this!
SUPABASE_ANON_KEY=your-anon-key

# Privy
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret  # Get from Privy dashboard

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:8082

# Optional API Key for additional security
API_SECRET_KEY=generate-a-strong-key
```

### 3. Get Your Keys

#### Supabase Service Key:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the `service_role` key (NOT the `anon` key)
5. ⚠️ **NEVER commit or expose this key**

#### Privy App Secret:

1. Go to your [Privy Dashboard](https://dashboard.privy.io)
2. Select your app
3. Go to Settings → API Keys
4. Copy the App Secret

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

#### POST `/api/auth/sync`

Sync Privy user with Supabase database

```json
{
  "privyUserId": "did:privy:xxx",
  "email": "user@example.com",
  "name": "John Doe",
  "walletAddress": "0x...",
  "authProvider": "google"
}
```

#### POST `/api/auth/verify`

Verify Privy authentication token

```json
{
  "token": "eyJ..."
}
```

#### GET `/api/auth/me`

Get current authenticated user (requires Bearer token)

### Users

#### GET `/api/users/:userId`

Get user profile

#### PUT `/api/users/profile`

Update user profile (requires auth)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "JohnD",
  "bio": "Mobile developer",
  "avatarUrl": "https://..."
}
```

#### DELETE `/api/users/account`

Soft delete user account (requires auth)

### Wallets

#### GET `/api/wallets`

Get user's wallets (requires auth)

#### POST `/api/wallets`

Add new wallet (requires auth)

```json
{
  "walletAddress": "0x...",
  "walletType": "external",
  "label": "MetaMask",
  "chainId": 1
}
```

#### PUT `/api/wallets/:walletId`

Update wallet (requires auth)

```json
{
  "label": "Main Wallet",
  "isPrimary": true
}
```

#### DELETE `/api/wallets/:walletId`

Deactivate wallet (requires auth)

## Mobile App Integration

Update your mobile app to use the API:

```typescript
// src/services/api/authApi.ts
const API_BASE_URL = __DEV__ ? 'http://localhost:3001/api' : 'https://your-api-domain.com/api';
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variables in Vercel Dashboard

### Deploy to Railway

1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

### Deploy to Heroku

1. Create Heroku app:

```bash
heroku create sharedtable-api
```

2. Set environment variables:

```bash
heroku config:set SUPABASE_SERVICE_KEY=xxx
```

3. Deploy:

```bash
git push heroku main
```

## Security Best Practices

1. **NEVER expose the service role key** - It bypasses all RLS policies
2. **Use environment variables** - Never hardcode secrets
3. **Enable CORS** - Only allow your app's domains
4. **Rate limiting** - Prevent abuse
5. **Input validation** - Use Zod schemas
6. **Error handling** - Don't expose internal errors
7. **Logging** - Monitor for suspicious activity

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable rate limiting
- [ ] Configure API key authentication
- [ ] Set up SSL/TLS
- [ ] Implement request logging
- [ ] Set up database backups
- [ ] Configure CI/CD pipeline

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Monitoring

The API includes Winston logging. In production, consider:

- Sentry for error tracking
- DataDog or New Relic for APM
- CloudWatch or LogDNA for log aggregation

## Support

For issues or questions, contact the SharedTable team.

# Jiashu's Notes

see `README.md` in base directory.
