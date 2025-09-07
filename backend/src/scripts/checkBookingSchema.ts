import { supabaseService } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function checkBookingSchema() {
  try {
    console.log('🔍 Checking dinner_bookings table schema...\n');
    
    // Try to insert a minimal test record to see what's required
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      dinner_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      status: 'test',
      created_at: new Date().toISOString(),
    };
    
    const { error: insertError } = await supabaseService
      .from('dinner_bookings')
      .insert(testData);
    
    if (insertError) {
      console.log('Insert test error (this is expected):', insertError.message);
      console.log('\nError details:', insertError);
      
      // Try to get column info by selecting
      const { data, error: selectError } = await supabaseService
        .from('dinner_bookings')
        .select('*')
        .limit(1);
      
      if (!selectError && data && data.length > 0) {
        console.log('\nSample row structure:');
        console.log('Columns:', Object.keys(data[0]));
        console.log('\nFull sample:', JSON.stringify(data[0], null, 2));
      } else if (!selectError) {
        console.log('\nTable is empty but accessible');
        
        // Try different column combinations
        console.log('\nTrying to determine required columns...');
        
        const columnsToTest = [
          'id',
          'user_id', 
          'dinner_id',
          'event_id',
          'status',
          'payment_intent_id',
          'payment_status',
          'created_at',
          'updated_at'
        ];
        
        for (const col of columnsToTest) {
          try {
            const { error } = await supabaseService
              .from('dinner_bookings')
              .select(col)
              .limit(1);
            
            if (!error) {
              console.log(`✅ Column exists: ${col}`);
            } else {
              console.log(`❌ Column missing or inaccessible: ${col}`);
            }
          } catch (e) {
            console.log(`❌ Column error: ${col}`);
          }
        }
      }
    } else {
      console.log('Test insert succeeded (unexpected) - cleaning up...');
      // Clean up test data if it somehow succeeded
      await supabaseService
        .from('dinner_bookings')
        .delete()
        .eq('status', 'test');
    }
    
    // Also check dinners table
    console.log('\n\n🔍 Checking dinners table...');
    const { data: dinners, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*')
      .limit(1);
    
    if (!dinnerError && dinners && dinners.length > 0) {
      console.log('Sample dinner:');
      console.log('Columns:', Object.keys(dinners[0]));
      console.log('\nDinner ID to use for testing:', dinners[0].id);
      console.log('Full dinner:', JSON.stringify(dinners[0], null, 2));
    } else if (dinnerError) {
      console.log('Error accessing dinners:', dinnerError);
    } else {
      console.log('No dinners found in database');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkBookingSchema().then(() => process.exit(0));