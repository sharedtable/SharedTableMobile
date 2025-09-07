const { supabaseService } = require('../dist/config/supabase');

async function initializeTiers() {
  try {
    console.log('Initializing tier data with correct schema...');
    
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
      const { data, error } = await supabaseService
        .from('tiers')
        .upsert(tier, { onConflict: 'tier_level' })
        .select();
      
      if (error) {
        console.error('Error creating tier:', tier.name, error);
      } else {
        console.log('Created/Updated tier:', tier.name);
      }
    }
    
    console.log('Tier initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize tiers:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeTiers();