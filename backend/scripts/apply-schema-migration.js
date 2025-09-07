const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting schema migration...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'normalize_dinner_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration script loaded');
    console.log('⚠️  This migration will:');
    console.log('  1. Add restaurant_id, dinner_id, and reservation_datetime columns');
    console.log('  2. Link dinner_groups to restaurants table');
    console.log('  3. Create foreign key relationships');
    console.log('  4. Add views and helper functions');
    console.log('  5. Set up triggers for data consistency\n');
    
    // Check current state
    console.log('🔍 Checking current database state...\n');
    
    // Check dinner_groups
    const { data: sampleGroup, error: groupError } = await supabase
      .from('dinner_groups')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleGroup) {
      console.log('Sample dinner_group:');
      console.log(`  - ID: ${sampleGroup.id}`);
      console.log(`  - Restaurant: ${sampleGroup.restaurant_name}`);
      console.log(`  - Date: ${sampleGroup.reservation_date}`);
      console.log(`  - Time: ${sampleGroup.reservation_time}\n`);
    }
    
    // Check restaurants
    const { data: restaurantCount } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact' });
    
    console.log(`📊 Current restaurants count: ${restaurantCount?.length || 0}\n`);
    
    // Check for existing migrations
    const { data: existingColumns } = await supabase.rpc('get_column_names', {
      table_name: 'dinner_groups'
    }).catch(() => ({ data: null }));
    
    if (existingColumns?.includes('restaurant_id')) {
      console.log('⚠️  Warning: Migration may have already been partially applied');
      console.log('   (restaurant_id column already exists)\n');
    }
    
    // Ask for confirmation
    console.log('📝 Ready to apply migration');
    console.log('⚠️  IMPORTANT: This will modify your database schema');
    console.log('   Make sure you have a backup!\n');
    
    // For automated testing, skip the prompt
    if (process.env.SKIP_CONFIRMATION !== 'true') {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to proceed? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Migration cancelled');
        return;
      }
    }
    
    console.log('\n⏳ Applying migration...\n');
    
    // Note: Supabase JS client doesn't support running raw SQL migrations directly
    // You'll need to run this through the Supabase dashboard or CLI
    
    console.log('📌 To apply this migration:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the migration from:');
    console.log(`      ${migrationPath}`);
    console.log('   4. Run the migration\n');
    
    console.log('Alternative: Use Supabase CLI');
    console.log('   npx supabase db push --file migrations/normalize_dinner_schema.sql\n');
    
    // Test what we can do with the client
    console.log('🧪 Testing what can be done via client...\n');
    
    // Try to create a sample restaurant if needed
    const { data: evviaRestaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('name', 'Evvia Estiatorio')
      .single();
    
    if (!evviaRestaurant) {
      console.log('Creating Evvia Estiatorio restaurant entry...');
      const { data: newRestaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: 'Evvia Estiatorio',
          cuisine_type: 'Greek',
          cuisine: 'Mediterranean',
          dining_style: 'Upscale Casual'
        })
        .select()
        .single();
      
      if (newRestaurant) {
        console.log('✅ Restaurant created:', newRestaurant.name);
      } else if (restaurantError) {
        console.log('❌ Error creating restaurant:', restaurantError.message);
      }
    } else {
      console.log('✅ Restaurant already exists:', evviaRestaurant.name);
    }
    
    console.log('\n✨ Next Steps:');
    console.log('1. Run the SQL migration using one of the methods above');
    console.log('2. Run the verification script: node scripts/verify-migration.js');
    console.log('3. Update backend endpoints to use new schema');
    console.log('4. Test thoroughly before deploying to production');
    
  } catch (error) {
    console.error('❌ Error during migration preparation:', error);
  }
}

// Run the migration
applyMigration();