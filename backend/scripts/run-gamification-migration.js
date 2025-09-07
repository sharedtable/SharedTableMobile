const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running gamification migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', '002_gamification_initial_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('INSERT INTO') || 
          statement.includes('CREATE INDEX') ||
          statement.includes('CREATE FUNCTION') ||
          statement.includes('CREATE TRIGGER') ||
          statement.includes('DROP TRIGGER')) {
        
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify by checking if tiers exist
    const { data: tiers, error: tierError } = await supabase
      .from('tiers')
      .select('*')
      .order('tier_level');
    
    if (tierError) {
      console.error('Error verifying tiers:', tierError);
    } else {
      console.log('Tiers created:', tiers?.length || 0);
    }
    
    // Check if any users need stats created
    const { data: users } = await supabase
      .from('users')
      .select('id');
    
    if (users && users.length > 0) {
      console.log(`Found ${users.length} users. Creating stats for any missing...`);
      
      for (const user of users) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!stats) {
          const { error } = await supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              total_points: 0,
              current_tier: 1,
              dinners_attended: 0,
              dinners_hosted: 0,
              referrals_made: 0,
              reviews_written: 0,
              current_streak: 0,
              longest_streak: 0,
              points_this_month: 0,
              points_this_week: 0
            });
          
          if (error && error.code !== '23505') { // Ignore unique constraint errors
            console.error(`Error creating stats for user ${user.id}:`, error);
          } else {
            console.log(`Created stats for user ${user.id}`);
          }
        }
      }
    }
    
    console.log('All done!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();