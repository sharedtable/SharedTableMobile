# Test Environment Setup for SharedTable Matching Algorithm

This guide explains how to create test users with real Privy authentication and set up test data for the matching algorithm.

## Prerequisites

1. **Environment Variables** - Ensure your `.env` file has:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   DATA_PROCESSOR_URL=http://localhost:8001
   PEOPLE_MATCHER_URL=http://localhost:8002
   ```

2. **Matching Algorithm Services** - Start the services:
   ```bash
   cd ../SharedTableMatchingAlgorithm
   docker-compose up
   ```

## Quick Start

Run the complete setup with one command:

```bash
npm run setup:test
```

This will:
1. Create 12+ test users with Privy authentication
2. Set up complete user profiles and preferences
3. Create a time slot for next Friday at 7 PM
4. Sign up all users for the time slot
5. Prepare everything for matching

## Individual Scripts

### 1. Create Test Users Only
```bash
npm run create:users
```
- Creates 12 test users with real Privy accounts
- Sets up complete profiles (birth date, gender, education, occupation)
- Configures preferences (dietary, cuisine, dining style, social preferences)
- Saves user data to `test-users-created.json`

### 2. Create Time Slot and Sign Up Users
```bash
npm run create:timeslot
```
- Creates a time slot for next Friday at 7 PM
- Signs up all test users for the time slot
- Sets signup status to 'confirmed'
- Saves time slot data to `time-slot-created.json`

## Test User Details

The script creates 12 diverse test users:

| Name | Profile | Preferences |
|------|---------|------------|
| Alice Chen | Software Engineer, 28, Female | Vegetarian, Italian/Thai, Casual dining |
| Bob Kumar | AI Researcher, 29, Male | Vegetarian, Indian/Italian, Family style |
| Carol Smith | Investment Banker, 33, Female | No restrictions, French/Japanese, Fine dining |
| David Johnson | Venture Capitalist, 35, Male | No restrictions, French/Italian, Upscale |
| Emma Garcia | Graphic Designer, 31, Female | Gluten-free, Mexican/Vietnamese, Trendy |
| Frank Lee | Film Director, 30, Male | Pescatarian, Japanese/Korean, Authentic |
| Grace Wang | Research Scientist, 27, Female | Vegan, Chinese/Thai, Healthy |
| Henry Taylor | Sports Manager, 32, Male | No restrictions, BBQ/Mexican, Casual |
| Iris Patel | Fashion Designer, 29, Female | Halal, Middle Eastern/Indian, Trendy |
| Jack Brown | Financial Advisor, 34, Male | Keto, Steakhouse/Brazilian, Upscale |
| Kate Miller | Fitness Instructor, 26, Female | Paleo, Healthy/Poke, Casual |
| Liam Davis | Game Developer, 28, Male | Lactose intolerant, Ramen/Korean, Casual |

## Running the Matching Algorithm

After setup is complete:

### Option 1: Via API (Recommended)
```bash
# Get the time slot ID from time-slot-created.json
TIME_SLOT_ID=<your-time-slot-id>

# Trigger matching (requires admin auth)
curl -X POST http://localhost:3001/api/matching/run/${TIME_SLOT_ID} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"async": true}'
```

### Option 2: Check Job Status
```bash
# If using async matching, check job status
JOB_ID=<job-id-from-response>
curl http://localhost:3001/api/matching/job/${JOB_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Output Files

After running the scripts, you'll have:

- `test-users-created.json` - List of created users with IDs
- `time-slot-created.json` - Time slot details and signup count

## Troubleshooting

### Privy User Already Exists
The script handles existing users gracefully. It will use existing Privy users if found.

### Not Enough Users for Matching
The matching algorithm requires at least 12 users. Make sure all users are created and signed up.

### Matching Services Not Running
Start the services:
```bash
cd ../SharedTableMatchingAlgorithm
# Terminal 1
cd services/data-processor
uvicorn app.main:app --reload --port 8001

# Terminal 2
cd services/people-matcher
uvicorn app.main:app --reload --port 8002
```

### Database Connection Issues
Ensure your Supabase service key has proper permissions to create users and manage data.

## Clean Up

To remove test data:
```sql
-- Remove test users and related data
DELETE FROM slot_signups WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.stanford.edu'
);

DELETE FROM user_preferences WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.stanford.edu'
);

DELETE FROM user_profiles WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.stanford.edu'
);

DELETE FROM users WHERE email LIKE '%@test.stanford.edu';
```

## Notes

- Test emails use domain `@test.stanford.edu` to distinguish from real users
- All test users have `onboarding_completed = true`
- Preferences are designed to create diverse matching scenarios
- The algorithm will create groups of 4-5 people based on compatibility