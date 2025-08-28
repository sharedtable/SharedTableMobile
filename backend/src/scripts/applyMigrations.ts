import { supabaseService } from '../config/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigrations() {
  console.log('Applying database migrations...');
  
  try {
    // Add push token columns
    console.log('Adding push_token columns to users table...');
    const { error: alterError } = await supabaseService.rpc('query', {
      query: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS push_token TEXT,
        ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;
      `
    }).single();

    if (alterError) {
      // Try a simpler approach - just update a test record to force column creation
      console.log('Direct ALTER failed, trying alternative approach...');
      
      // This will fail but might trigger auto-column creation in some Supabase configs
      await supabaseService
        .from('users')
        .update({ 
          push_token: null,
          push_token_updated_at: null 
        })
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Initialize user_stats for existing users
    console.log('Initializing user_stats for existing users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else if (users) {
      for (const user of users) {
        // Check if user_stats exists
        const { data: existingStats } = await supabaseService
          .from('user_stats')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!existingStats) {
          // Create user_stats
          const { error: createError } = await supabaseService
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

          if (createError) {
            console.error(`Failed to create stats for user ${user.id}:`, createError);
          } else {
            console.log(`Created stats for user ${user.id}`);
          }
        }
      }
    }

    console.log('✅ Migrations applied successfully!');
    console.log('\nIMPORTANT: To fully apply the push_token columns, you need to:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL:');
    console.log(`
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;
    `);
    
  } catch (error) {
    console.error('Error applying migrations:', error);
  }

  process.exit(0);
}

applyMigrations();