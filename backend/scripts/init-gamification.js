const { supabaseService } = require('../dist/config/supabase');

async function initializeGamification() {
  try {
    console.log('Initializing gamification data...');
    
    // 1. Create tiers if they don't exist
    const tiers = [
      { tier_level: 1, name: 'Newcomer', min_points: 0, points_to_next: 100, benefits: ['Welcome bonus', 'Access to all dinners'] },
      { tier_level: 2, name: 'Regular', min_points: 100, points_to_next: 250, benefits: ['5% discount', 'Priority notifications'] },
      { tier_level: 3, name: 'Foodie', min_points: 350, points_to_next: 500, benefits: ['10% discount', 'Exclusive invites'] },
      { tier_level: 4, name: 'Gourmet', min_points: 850, points_to_next: 1000, benefits: ['15% discount', 'VIP support'] },
      { tier_level: 5, name: 'Master Chef', min_points: 1850, points_to_next: null, benefits: ['20% discount', 'Free monthly dinner'] }
    ];
    
    for (const tier of tiers) {
      const { error } = await supabaseService
        .from('tiers')
        .upsert(tier, { onConflict: 'tier_level' });
      
      if (error) {
        console.error('Error creating tier:', tier.name, error);
      } else {
        console.log('Created/Updated tier:', tier.name);
      }
    }
    
    // 2. Create achievements if they don't exist
    const achievements = [
      { name: 'First Timer', description: 'Attend your first dinner', icon: 'restaurant', points_reward: 50, category: 'dining', requirement_type: 'dinners_attended', requirement_value: 1, active: true },
      { name: 'Social Butterfly', description: 'Attend 5 dinners', icon: 'people', points_reward: 100, category: 'social', requirement_type: 'dinners_attended', requirement_value: 5, active: true },
      { name: 'Regular', description: 'Attend 10 dinners', icon: 'star', points_reward: 200, category: 'dining', requirement_type: 'dinners_attended', requirement_value: 10, active: true },
      { name: 'Veteran', description: 'Attend 25 dinners', icon: 'trophy', points_reward: 500, category: 'dining', requirement_type: 'dinners_attended', requirement_value: 25, active: true },
      { name: 'Legend', description: 'Attend 50 dinners', icon: 'medal', points_reward: 1000, category: 'dining', requirement_type: 'dinners_attended', requirement_value: 50, active: true }
    ];
    
    for (const achievement of achievements) {
      const { error } = await supabaseService
        .from('achievements')
        .upsert(achievement, { onConflict: 'name' });
      
      if (error) {
        console.error('Error creating achievement:', achievement.name, error);
      } else {
        console.log('Created/Updated achievement:', achievement.name);
      }
    }
    
    // 3. Create stats for all users who don't have them
    const { data: users } = await supabaseService
      .from('users')
      .select('id');
    
    if (users && users.length > 0) {
      console.log(`Found ${users.length} users. Creating stats for any missing...`);
      
      for (const user of users) {
        const { data: existingStats } = await supabaseService
          .from('user_stats')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!existingStats) {
          const { error } = await supabaseService
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
          
          if (error) {
            console.error(`Error creating stats for user ${user.id}:`, error);
          } else {
            console.log(`Created stats for user ${user.id}`);
          }
        }
      }
    }
    
    console.log('Gamification initialization complete!');
  } catch (error) {
    console.error('Failed to initialize gamification:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeGamification();