import { supabaseService } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function listTables() {
  try {
    console.log('📋 Listing all tables in the database...\n');
    
    // Query to get all tables
    const { data, error } = await supabaseService
      .rpc('get_tables', {});

    if (error) {
      // Try alternative approach - query a known system table
      const { data: schemas, error: schemaError } = await supabaseService
        .from('_metadata')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.log('Trying to list tables by checking known patterns...');
        
        // Try common table names
        const tablePatterns = [
          'events',
          'dinner_events', 
          'dinners',
          'dinner_groups',
          'dinner_bookings',
          'users',
          'restaurants'
        ];
        
        console.log('Checking for tables with these patterns:\n');
        
        for (const tableName of tablePatterns) {
          try {
            const { count, error } = await supabaseService
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              console.log(`✅ Table exists: ${tableName}`);
            } else if (error.code !== 'PGRST205') {
              console.log(`⚠️  Table ${tableName}: ${error.message}`);
            }
          } catch (e) {
            // Table doesn't exist
          }
        }
        
        return;
      }
    }

    if (data) {
      console.log('Tables found:', data);
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listTables().then(() => process.exit(0));