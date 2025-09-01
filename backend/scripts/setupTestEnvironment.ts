#!/usr/bin/env node

/**
 * Master script to set up complete test environment
 * Creates users, profiles, preferences, time slots, and signups
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  const line = '='.repeat(60);
  log(`\n${line}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log(line, colors.cyan);
}

function runScript(scriptName: string): boolean {
  try {
    log(`\n▶️  Running ${scriptName}...`, colors.blue);
    execSync(`npx tsx ${join(__dirname, scriptName)}`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    return true;
  } catch (error) {
    log(`❌ Failed to run ${scriptName}`, colors.red);
    console.error(error);
    return false;
  }
}

async function testMatchingServices(): Promise<boolean> {
  log('\n🔍 Checking matching algorithm services...', colors.blue);
  
  const services = [
    { name: 'Data Processor', url: 'http://localhost:8001/api/v1/health' },
    { name: 'People Matcher', url: 'http://localhost:8002/api/v1/health' }
  ];
  
  let allHealthy = true;
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 2000 });
      if (response.data.status === 'healthy') {
        log(`  ✅ ${service.name} is running`, colors.green);
      } else {
        log(`  ❌ ${service.name} is unhealthy`, colors.red);
        allHealthy = false;
      }
    } catch (_error) {
      log(`  ⚠️  ${service.name} is not running (${service.url})`, colors.yellow);
      allHealthy = false;
    }
  }
  
  return allHealthy;
}

async function triggerMatching(): Promise<void> {
  const timeSlotPath = join(__dirname, 'time-slot-created.json');
  
  if (!fs.existsSync(timeSlotPath)) {
    log('⚠️  No time slot data found. Skipping matching trigger.', colors.yellow);
    return;
  }
  
  const timeSlotData = JSON.parse(fs.readFileSync(timeSlotPath, 'utf-8'));
  const timeSlotId = timeSlotData.timeSlotId;
  
  log(`\n🎯 Time Slot ID: ${timeSlotId}`, colors.cyan);
  log(`   Date: ${timeSlotData.date} at ${timeSlotData.time}`, colors.cyan);
  log(`   Users: ${timeSlotData.signupCount}`, colors.cyan);
  
  if (timeSlotData.signupCount < 12) {
    log('\n⚠️  Not enough users for matching (need 12+)', colors.yellow);
    return;
  }
  
  log('\n📝 To trigger matching, run this command:', colors.green);
  log(`   curl -X POST http://localhost:3001/api/matching/run/${timeSlotId} \\`, colors.bright);
  log(`        -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`, colors.bright);
  log(`        -H "Content-Type: application/json"`, colors.bright);
  
  log('\n   Or use the test endpoint (if backend is running):', colors.green);
  log(`   npm run test:matching -- ${timeSlotId}`, colors.bright);
}

async function main() {
  header('🚀 SHAREDTABLE TEST ENVIRONMENT SETUP');
  
  log('\nThis script will:', colors.cyan);
  log('1. Create test users with Privy authentication');
  log('2. Set up user profiles and preferences');
  log('3. Create a time slot for next Friday');
  log('4. Sign up all users for the time slot');
  log('5. Prepare data for matching algorithm\n');
  
  // Step 1: Create test users
  header('STEP 1: Creating Test Users');
  const usersCreated = runScript('createTestUsersWithPrivy.ts');
  
  if (!usersCreated) {
    log('\n❌ Failed to create users. Exiting.', colors.red);
    process.exit(1);
  }
  
  // Step 2: Create time slot and signups
  header('STEP 2: Creating Time Slot & Signups');
  const timeSlotCreated = runScript('createTimeSlotAndSignup.ts');
  
  if (!timeSlotCreated) {
    log('\n❌ Failed to create time slot. Exiting.', colors.red);
    process.exit(1);
  }
  
  // Step 3: Check matching services
  header('STEP 3: Checking Matching Services');
  const servicesHealthy = await testMatchingServices();
  
  if (!servicesHealthy) {
    log('\n⚠️  Matching services are not running.', colors.yellow);
    log('To start them:', colors.yellow);
    log('1. Navigate to SharedTableMatchingAlgorithm folder');
    log('2. Run: docker-compose up');
    log('   OR start services individually:');
    log('   - cd services/data-processor && uvicorn app.main:app --port 8001');
    log('   - cd services/people-matcher && uvicorn app.main:app --port 8002');
  }
  
  // Step 4: Show next steps
  header('✅ SETUP COMPLETE!');
  
  await triggerMatching();
  
  log('\n📊 Test Data Summary:', colors.green);
  
  // Load and display summary
  const usersPath = join(__dirname, 'test-users-created.json');
  const timeSlotPath = join(__dirname, 'time-slot-created.json');
  
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    log(`   • Created ${users.length} test users with Privy auth`, colors.green);
  }
  
  if (fs.existsSync(timeSlotPath)) {
    const timeSlot = JSON.parse(fs.readFileSync(timeSlotPath, 'utf-8'));
    log(`   • Time slot: ${timeSlot.date} at ${timeSlot.time}`, colors.green);
    log(`   • Signups: ${timeSlot.signupCount} users`, colors.green);
  }
  
  log('\n🎉 Your test environment is ready!', colors.bright + colors.green);
  log('   Data files saved in: scripts/', colors.green);
  log('   - test-users-created.json', colors.green);
  log('   - time-slot-created.json', colors.green);
}

// Run the master script
main().catch(error => {
  log('\n❌ Setup failed:', colors.red);
  console.error(error);
  process.exit(1);
});