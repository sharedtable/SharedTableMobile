const { supabaseService } = require('../dist/config/supabase');

async function initializeTiers() {
  try {
    console.log('Initializing tier data...');
    
    // Simple tier data without arrays
    const tiers = [
      { tier_level: 1, name: 'Newcomer', min_points: 0, points_to_next: 100 },
      { tier_level: 2, name: 'Regular', min_points: 100, points_to_next: 250 },
      { tier_level: 3, name: 'Foodie', min_points: 350, points_to_next: 500 },
      { tier_level: 4, name: 'Gourmet', min_points: 850, points_to_next: 1000 },
      { tier_level: 5, name: 'Master Chef', min_points: 1850, points_to_next: 0 }
    ];
    
    for (const tier of tiers) {
      const { data, error } = await supabaseService
        .from('tiers')
        .upsert(tier, { onConflict: 'tier_level' })
        .select();
      
      if (error) {
        console.error('Error creating tier:', tier.name, error);
      } else {
        console.log('Created/Updated tier:', tier.name, data);
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