const { supabaseService } = require('../dist/config/supabase');

async function initializeAllGamification() {
  try {
    console.log('🎮 Starting comprehensive gamification initialization...');
    
    // 1. Ensure tiers exist
    console.log('\n📊 Checking tiers...');
    const { data: existingTiers } = await supabaseService
      .from('tiers')
      .select('*')
      .order('tier_level');
    
    if (!existingTiers || existingTiers.length === 0) {
      console.log('Creating tiers...');
      const tiers = [
        { 
          tier_level: 1, 
          name: 'Newcomer', 
          points_required: 0, 
          dining_discount: 0,
          priority_booking: false,
          exclusive_events: false,
          free_meals_monthly: 0,
          referral_bonus: 10,
          badge_color: '#808080'
        },
        { 
          tier_level: 2, 
          name: 'Regular', 
          points_required: 100, 
          dining_discount: 5,
          priority_booking: false,
          exclusive_events: false,
          free_meals_monthly: 0,
          referral_bonus: 11,
          badge_color: '#CD7F32'
        },
        { 
          tier_level: 3, 
          name: 'Foodie', 
          points_required: 350, 
          dining_discount: 10,
          priority_booking: true,
          exclusive_events: false,
          free_meals_monthly: 0,
          referral_bonus: 12,
          badge_color: '#C0C0C0'
        },
        { 
          tier_level: 4, 
          name: 'Gourmet', 
          points_required: 850, 
          dining_discount: 15,
          priority_booking: true,
          exclusive_events: true,
          free_meals_monthly: 0,
          referral_bonus: 13,
          badge_color: '#FFD700'
        },
        { 
          tier_level: 5, 
          name: 'Master Chef', 
          points_required: 1850, 
          dining_discount: 20,
          priority_booking: true,
          exclusive_events: true,
          free_meals_monthly: 1,
          referral_bonus: 15,
          badge_color: '#B9F2FF'
        }
      ];
      
      for (const tier of tiers) {
        const { error } = await supabaseService
          .from('tiers')
          .upsert(tier, { onConflict: 'tier_level' });
        
        if (error) {
          console.error('Error creating tier:', tier.name, error);
        } else {
          console.log('✅ Created tier:', tier.name);
        }
      }
    } else {
      console.log(`✅ ${existingTiers.length} tiers already exist`);
    }
    
    // 2. Get all users
    console.log('\n👥 Fetching all users...');
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id, email, created_at');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      process.exit(1);
    }
    
    console.log(`Found ${users?.length || 0} users`);
    
    if (!users || users.length === 0) {
      console.log('No users found to initialize');
      process.exit(0);
    }
    
    // 3. Initialize stats for each user
    console.log('\n📈 Initializing user stats...');
    let initialized = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      // Check if user already has stats
      const { data: existingStats } = await supabaseService
        .from('user_stats')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingStats) {
        skipped++;
        console.log(`⏭️  User ${user.email} already has stats, skipping`);
        continue;
      }
      
      // Calculate some initial test data based on when they joined
      const joinDate = new Date(user.created_at);
      const daysActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate some realistic test data
      const dinnersAttended = Math.min(Math.floor(daysActive / 7), 50); // Assume 1 dinner per week max
      const basePoints = dinnersAttended * 50; // 50 points per dinner
      const bonusPoints = Math.floor(Math.random() * 200); // Random bonus points
      const totalPoints = basePoints + bonusPoints;
      
      // Determine tier based on points
      let currentTier = 1;
      if (totalPoints >= 1850) currentTier = 5;
      else if (totalPoints >= 850) currentTier = 4;
      else if (totalPoints >= 350) currentTier = 3;
      else if (totalPoints >= 100) currentTier = 2;
      
      const statsData = {
        user_id: user.id,
        total_points: totalPoints,
        current_tier: currentTier,
        dinners_attended: dinnersAttended,
        dinners_hosted: Math.floor(dinnersAttended / 10), // 1 hosted per 10 attended
        referrals_made: Math.floor(Math.random() * 5),
        reviews_written: Math.floor(dinnersAttended * 0.7), // 70% review rate
        current_streak: Math.floor(Math.random() * 5),
        longest_streak: Math.floor(Math.random() * 10) + 5,
        points_this_month: Math.floor(totalPoints * 0.2), // 20% earned this month
        points_this_week: Math.floor(totalPoints * 0.05), // 5% earned this week
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: createError } = await supabaseService
        .from('user_stats')
        .insert(statsData);
      
      if (createError) {
        console.error(`❌ Error creating stats for ${user.email}:`, createError.message);
        errors++;
      } else {
        console.log(`✅ Initialized stats for ${user.email}: Tier ${currentTier}, ${totalPoints} points`);
        initialized++;
      }
    }
    
    // 4. Create some test achievements
    console.log('\n🏆 Creating achievements...');
    const achievements = [
      { 
        name: 'First Timer', 
        description: 'Attend your first dinner', 
        icon: 'restaurant', 
        points_reward: 50, 
        category: 'dining', 
        requirement_type: 'dinners_attended', 
        requirement_value: 1, 
        active: true 
      },
      { 
        name: 'Social Butterfly', 
        description: 'Attend 5 dinners', 
        icon: 'people', 
        points_reward: 100, 
        category: 'social', 
        requirement_type: 'dinners_attended', 
        requirement_value: 5, 
        active: true 
      },
      { 
        name: 'Regular', 
        description: 'Attend 10 dinners', 
        icon: 'star', 
        points_reward: 200, 
        category: 'dining', 
        requirement_type: 'dinners_attended', 
        requirement_value: 10, 
        active: true 
      },
      { 
        name: 'Veteran', 
        description: 'Attend 25 dinners', 
        icon: 'trophy', 
        points_reward: 500, 
        category: 'dining', 
        requirement_type: 'dinners_attended', 
        requirement_value: 25, 
        active: true 
      },
      { 
        name: 'Legend', 
        description: 'Attend 50 dinners', 
        icon: 'medal', 
        points_reward: 1000, 
        category: 'dining', 
        requirement_type: 'dinners_attended', 
        requirement_value: 50, 
        active: true 
      },
      {
        name: 'Host with the Most',
        description: 'Host your first dinner',
        icon: 'home',
        points_reward: 150,
        category: 'hosting',
        requirement_type: 'dinners_hosted',
        requirement_value: 1,
        active: true
      },
      {
        name: 'Review Master',
        description: 'Write 10 reviews',
        icon: 'edit',
        points_reward: 100,
        category: 'engagement',
        requirement_type: 'reviews_written',
        requirement_value: 10,
        active: true
      },
      {
        name: 'Networker',
        description: 'Refer 3 friends',
        icon: 'share',
        points_reward: 300,
        category: 'social',
        requirement_type: 'referrals_made',
        requirement_value: 3,
        active: true
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'fire',
        points_reward: 150,
        category: 'engagement',
        requirement_type: 'current_streak',
        requirement_value: 7,
        active: true
      }
    ];
    
    for (const achievement of achievements) {
      const { error } = await supabaseService
        .from('achievements')
        .upsert(achievement, { onConflict: 'name' });
      
      if (error) {
        console.error('Error creating achievement:', achievement.name, error.message);
      } else {
        console.log('✅ Created achievement:', achievement.name);
      }
    }
    
    // 5. Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Initialized: ${initialized} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already had stats)`);
    console.log(`❌ Errors: ${errors} users`);
    console.log('\n🎉 Gamification initialization complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeAllGamification();