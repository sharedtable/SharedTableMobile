const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying schema migration...\n');
  
  const checks = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // Check 1: Verify new columns exist in dinner_groups
    console.log('1️⃣ Checking dinner_groups table...');
    const { data: dinnerGroup, error: dgError } = await supabase
      .from('dinner_groups')
      .select('*')
      .limit(1)
      .single();
    
    if (dinnerGroup) {
      if ('restaurant_id' in dinnerGroup) {
        checks.passed.push('✅ restaurant_id column exists');
      } else {
        checks.failed.push('❌ restaurant_id column missing');
      }
      
      if ('dinner_id' in dinnerGroup) {
        checks.passed.push('✅ dinner_id column exists');
      } else {
        checks.failed.push('❌ dinner_id column missing');
      }
      
      if ('reservation_datetime' in dinnerGroup) {
        checks.passed.push('✅ reservation_datetime column exists');
      } else {
        checks.failed.push('❌ reservation_datetime column missing');
      }
    } else {
      checks.warnings.push('⚠️  No dinner_groups found to check');
    }
    
    // Check 2: Verify new column in dinner_bookings
    console.log('\n2️⃣ Checking dinner_bookings table...');
    const { data: dinnerBooking, error: dbError } = await supabase
      .from('dinner_bookings')
      .select('*')
      .limit(1)
      .single();
    
    if (dinnerBooking) {
      if ('dinner_group_id' in dinnerBooking) {
        checks.passed.push('✅ dinner_group_id column exists in dinner_bookings');
      } else {
        checks.failed.push('❌ dinner_group_id column missing in dinner_bookings');
      }
    } else {
      checks.warnings.push('⚠️  No dinner_bookings found to check');
    }
    
    // Check 3: Verify views exist
    console.log('\n3️⃣ Checking views...');
    try {
      const { data: groupDetails, error: viewError1 } = await supabase
        .from('dinner_group_details')
        .select('*')
        .limit(1);
      
      if (!viewError1) {
        checks.passed.push('✅ dinner_group_details view exists');
      } else {
        checks.failed.push('❌ dinner_group_details view missing');
      }
    } catch (e) {
      checks.failed.push('❌ dinner_group_details view missing');
    }
    
    try {
      const { data: bookingDetails, error: viewError2 } = await supabase
        .from('dinner_booking_details')
        .select('*')
        .limit(1);
      
      if (!viewError2) {
        checks.passed.push('✅ dinner_booking_details view exists');
      } else {
        checks.failed.push('❌ dinner_booking_details view missing');
      }
    } catch (e) {
      checks.failed.push('❌ dinner_booking_details view missing');
    }
    
    // Check 4: Verify data consistency
    console.log('\n4️⃣ Checking data consistency...');
    
    // Check if restaurant_id is populated
    const { data: groupsWithRestaurant, count: withRestaurantCount } = await supabase
      .from('dinner_groups')
      .select('id', { count: 'exact' })
      .not('restaurant_id', 'is', null);
    
    const { data: allGroups, count: totalCount } = await supabase
      .from('dinner_groups')
      .select('id', { count: 'exact' });
    
    if (withRestaurantCount === totalCount && totalCount > 0) {
      checks.passed.push(`✅ All ${totalCount} dinner_groups have restaurant_id`);
    } else if (totalCount > 0) {
      checks.warnings.push(`⚠️  Only ${withRestaurantCount}/${totalCount} dinner_groups have restaurant_id`);
    }
    
    // Check if restaurants were created
    const { data: restaurants, count: restaurantCount } = await supabase
      .from('restaurants')
      .select('name', { count: 'exact' });
    
    if (restaurantCount > 0) {
      checks.passed.push(`✅ ${restaurantCount} restaurants in database`);
      console.log('\n📋 Sample restaurants:');
      restaurants.slice(0, 5).forEach(r => console.log(`   - ${r.name}`));
    } else {
      checks.warnings.push('⚠️  No restaurants found in database');
    }
    
    // Check 5: Test the function
    console.log('\n5️⃣ Testing helper function...');
    try {
      const { data: availableGroups, error: funcError } = await supabase
        .rpc('get_available_dinner_groups', {
          p_city: 'san_francisco'
        });
      
      if (!funcError) {
        checks.passed.push('✅ get_available_dinner_groups function works');
        if (availableGroups?.length > 0) {
          console.log(`   Found ${availableGroups.length} available groups`);
        }
      } else {
        checks.failed.push('❌ get_available_dinner_groups function error: ' + funcError.message);
      }
    } catch (e) {
      checks.failed.push('❌ get_available_dinner_groups function missing');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION VERIFICATION SUMMARY\n');
    
    if (checks.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      checks.passed.forEach(check => console.log('   ' + check));
    }
    
    if (checks.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      checks.warnings.forEach(warning => console.log('   ' + warning));
    }
    
    if (checks.failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      checks.failed.forEach(fail => console.log('   ' + fail));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (checks.failed.length === 0) {
      console.log('🎉 Migration appears to be successful!');
      if (checks.warnings.length > 0) {
        console.log('   (Some warnings need attention)');
      }
    } else {
      console.log('❌ Migration has not been fully applied.');
      console.log('   Please run the migration script first.');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run verification
verifyMigration();