/**
 * Script to run the matching algorithm on our test users
 * Uses the SharedTableMatchingAlgorithm services
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Service URLs
const DATA_PROCESSOR_URL = 'http://localhost:8001';
const PEOPLE_MATCHER_URL = 'http://localhost:8002';

interface UserData {
  user_id: string;
  email: string;
  Name: string;
  Age?: number;
  Gender?: string;
  Education?: string;
  Occupation?: string;
  'Relationship Status'?: string;
  'Zip/Postal Code'?: string;
  'Dietary Restrictions'?: string;
  'What cuisines are you excited to try'?: string;
  'Are there any cuisines you tend to avoid'?: string;
  'What kind of dining atmosphere do you enjoy'?: string;
  'How long does it usually take you to finish dinner'?: number;
  'Budget'?: number;
  'I enjoy spicy foods'?: number;
  'I enjoy drinking alcohol socially'?: number;
  'How adventurous of a diner are you'?: number;
  'List your favorite interests'?: string;
  'I am interested in'?: string;
  'Ethnicities attracted to'?: string;
  'What kind of relationships are you open to'?: string;
  'Do you want children'?: string;
  'Age range looking to date'?: string;
  'I use the following'?: string;
  'How often do you use social media'?: string;
  'What role(s) best describes you'?: string;
  'Who are you hoping to meet'?: string;
  "I often take the lead in starting conversations"?: number;
  "I'm willing to compromise to keep the peace"?: number;
  "I actively seek out new experiences even if they push me out of my comfort zone"?: number;
  'Are you more of an early bird or night owl'?: number;
  'Are you an active person'?: number;
  'I always try to arrive on time'?: number;
  "Would you be fine with us cancelling the dinner if we can't find the perfect table for you"?: number;
}

async function exportUserDataToCSV(): Promise<string> {
  console.log('📊 Exporting user data to CSV format...\n');
  
  // Fetch all test users with their data
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .like('email', '%@test.stanford.edu')
    .order('created_at');
  
  if (!users || users.length === 0) {
    throw new Error('No test users found');
  }
  
  const userData: UserData[] = [];
  
  for (const user of users) {
    // Fetch profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    // Fetch preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    // Calculate age
    let age = 25; // default
    if (profile?.birth_date) {
      age = Math.floor(
        (Date.now() - new Date(profile.birth_date).getTime()) / 
        (365.25 * 24 * 60 * 60 * 1000)
      );
    }
    
    // Map data to CSV format expected by matching algorithm
    const row: UserData = {
      user_id: user.id,
      email: user.email,
      Name: user.display_name || `${user.first_name} ${user.last_name}`,
      Age: age,
      Gender: profile?.gender || 'prefer_not_to_say',
      Education: profile?.education_level || 'Bachelors',
      Occupation: profile?.occupation || 'Professional',
      'Relationship Status': profile?.relationship_status || 'single',
      'Zip/Postal Code': preferences?.location_zip_code || '94305',
      
      // Food preferences
      'Dietary Restrictions': preferences?.dietary_restrictions?.join(', ') || '',
      'What cuisines are you excited to try': preferences?.preferred_cuisines?.join(', ') || '',
      'Are there any cuisines you tend to avoid': '', // We don't track this
      'What kind of dining atmosphere do you enjoy': preferences?.dining_atmospheres?.join(', ') || '',
      'How long does it usually take you to finish dinner': 3, // Default moderate
      'Budget': 3, // Default moderate
      'I enjoy spicy foods': 3,
      'I enjoy drinking alcohol socially': 3,
      'How adventurous of a diner are you': preferences?.social_preferences?.adventure_level || 5,
      
      // Interests and social
      'List your favorite interests': preferences?.social_preferences?.interests?.join(', ') || '',
      'I am interested in': 'all', // Default for dating preferences
      'Ethnicities attracted to': 'all',
      'What kind of relationships are you open to': 'friendship, networking',
      'Do you want children': 'maybe',
      'Age range looking to date': `${age - 5}-${age + 5}`,
      'I use the following': 'instagram, linkedin',
      'How often do you use social media': 'weekly',
      'What role(s) best describes you': 'professional, foodie',
      'Who are you hoping to meet': 'new friends, dining companions',
      
      // Personality traits (1-5 scale)
      "I often take the lead in starting conversations": preferences?.social_preferences?.social_level 
        ? Math.min(5, Math.round(preferences.social_preferences.social_level / 2)) : 3,
      "I'm willing to compromise to keep the peace": 3,
      "I actively seek out new experiences even if they push me out of my comfort zone": 
        preferences?.social_preferences?.adventure_level 
        ? Math.min(5, Math.round(preferences.social_preferences.adventure_level / 2)) : 3,
      'Are you more of an early bird or night owl': 3,
      'Are you an active person': preferences?.social_preferences?.activity_level || 3,
      'I always try to arrive on time': 4,
      "Would you be fine with us cancelling the dinner if we can't find the perfect table for you": 1
    };
    
    userData.push(row);
  }
  
  // Convert to CSV
  const headers = Object.keys(userData[0]);
  const csvLines = [
    headers.join(','),
    ...userData.map(row => 
      headers.map(header => {
        const value = row[header as keyof UserData];
        // Escape commas and quotes in string values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to file
  const csvPath = join(__dirname, 'test-users-for-matching.csv');
  fs.writeFileSync(csvPath, csvContent);
  
  console.log(`✅ Exported ${userData.length} users to CSV`);
  console.log(`📁 Saved to: ${csvPath}\n`);
  
  return csvPath;
}

async function callDataProcessor(csvPath: string): Promise<any> {
  console.log('🔄 Calling data-processor service...\n');
  
  try {
    // Create form data with file
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    
    // Add parameters
    const params = new URLSearchParams({
      output_format: 'json',
      include_vocabs: 'true'
    });
    
    const response = await axios.post(
      `${DATA_PROCESSOR_URL}/api/v1/process?${params}`,
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log('✅ Data processing complete');
    console.log(`   - Rows processed: ${response.data.shape.rows}`);
    console.log(`   - Total columns: ${response.data.shape.columns}`);
    console.log(`   - Columns added: ${response.data.columns_added}\n`);
    
    // Save processed data
    const processedPath = join(__dirname, 'processed-data.json');
    fs.writeFileSync(processedPath, JSON.stringify(response.data, null, 2));
    console.log(`📁 Saved processed data to: ${processedPath}\n`);
    
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to data-processor service');
      console.error('   Please ensure the service is running:');
      console.error('   cd ../SharedTableMatchingAlgorithm/services/data-processor');
      console.error('   python -m uvicorn app.main:app --reload --port 8001\n');
      throw new Error('Data processor service not running');
    }
    throw error;
  }
}

async function callPeopleMatcher(processedData: any): Promise<any> {
  console.log('👥 Calling people-matcher service...\n');
  
  try {
    // Prepare request for people matcher
    const matchRequest = {
      data: processedData.data || processedData,
      group_size_min: 4,
      group_size_max: 5,
      algorithm: 'clustering',
      parameters: {
        similarity_threshold: 0.6,
        diversity_weight: 0.3,
        preference_weight: 0.7
      }
    };
    
    const response = await axios.post(
      `${PEOPLE_MATCHER_URL}/api/v1/match`,
      matchRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Matching complete');
    console.log(`   - Groups created: ${response.data.groups.length}`);
    console.log(`   - Total participants: ${response.data.total_participants}`);
    console.log(`   - Unmatched users: ${response.data.unmatched_users?.length || 0}\n`);
    
    // Save matching results
    const resultsPath = join(__dirname, 'matching-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(response.data, null, 2));
    console.log(`📁 Saved matching results to: ${resultsPath}\n`);
    
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to people-matcher service');
      console.error('   Please ensure the service is running:');
      console.error('   cd ../SharedTableMatchingAlgorithm/services/people-matcher');
      console.error('   python -m uvicorn app.main:app --reload --port 8002\n');
      throw new Error('People matcher service not running');
    }
    throw error;
  }
}

function displayResults(matchingResults: any, userData: UserData[]): void {
  console.log('=' * 60);
  console.log('📊 MATCHING RESULTS\n');
  
  if (!matchingResults.groups || matchingResults.groups.length === 0) {
    console.log('No groups were created');
    return;
  }
  
  // Create user lookup
  const userLookup = new Map(userData.map(u => [u.user_id, u]));
  
  matchingResults.groups.forEach((group: any, index: number) => {
    console.log(`\n🍽️  GROUP ${index + 1} (${group.members.length} members)`);
    console.log(`   Average Similarity: ${(group.avg_similarity * 100).toFixed(1)}%`);
    console.log(`   Diversity Score: ${(group.diversity_score * 100).toFixed(1)}%`);
    console.log('\n   Members:');
    
    group.members.forEach((memberId: string, i: number) => {
      const user = userLookup.get(memberId);
      if (user) {
        console.log(`   ${i + 1}. ${user.Name} (${user.Age}yo ${user.Gender})`);
        console.log(`      - ${user.Occupation} | ${user.Education}`);
        console.log(`      - Diet: ${user['Dietary Restrictions'] || 'None'}`);
        console.log(`      - Cuisines: ${user['What cuisines are you excited to try']}`);
      }
    });
    
    // Show common preferences if available
    if (group.common_preferences) {
      console.log('\n   Common Preferences:');
      Object.entries(group.common_preferences).forEach(([key, value]) => {
        if (value && Array.isArray(value) && (value as any[]).length > 0) {
          console.log(`   - ${key}: ${(value as any[]).join(', ')}`);
        }
      });
    }
  });
  
  if (matchingResults.unmatched_users && matchingResults.unmatched_users.length > 0) {
    console.log('\n⚠️  Unmatched Users:');
    matchingResults.unmatched_users.forEach((userId: string) => {
      const user = userLookup.get(userId);
      if (user) {
        console.log(`   - ${user.Name} (${user.email})`);
      }
    });
  }
  
  console.log('\n' + '=' * 60);
}

async function main() {
  console.log('🚀 Running Matching Algorithm on Test Users\n');
  console.log('=' * 60 + '\n');
  
  try {
    // Step 1: Export user data to CSV
    const csvPath = await exportUserDataToCSV();
    
    // Step 2: Process data with data-processor service
    const processedData = await callDataProcessor(csvPath);
    
    // Step 3: Run matching with people-matcher service
    const matchingResults = await callPeopleMatcher(processedData);
    
    // Step 4: Display results
    const _userData = JSON.parse(
      fs.readFileSync(csvPath, 'utf-8')
        .split('\n')
        .slice(1) // Skip header
        .filter(line => line.trim())
        .map(line => {
          const values = line.match(/(".*?"|[^,]+)/g) || [];
          const headers = fs.readFileSync(csvPath, 'utf-8')
            .split('\n')[0]
            .split(',');
          const obj: any = {};
          headers.forEach((header, i) => {
            const value = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
            // Try to parse numbers
            if (!isNaN(Number(value)) && value !== '') {
              obj[header] = Number(value);
            } else {
              obj[header] = value;
            }
          });
          return JSON.stringify(obj);
        })
        .join(',')
    );
    
    // Parse CSV data properly
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const userDataParsed: UserData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
      const obj: any = {};
      headers.forEach((header, j) => {
        const value = values[j]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
        obj[header] = value;
      });
      userDataParsed.push(obj);
    }
    
    displayResults(matchingResults, userDataParsed);
    
    console.log('\n✅ Matching algorithm completed successfully!');
    console.log('📁 Results saved to scripts/matching-results.json');
    
  } catch (error) {
    console.error('\n❌ Error running matching algorithm:', error);
    process.exit(1);
  }
}

main().catch(console.error);