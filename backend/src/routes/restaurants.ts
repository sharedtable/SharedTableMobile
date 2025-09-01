import { Router } from 'express';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Get top-rated restaurants
router.get('/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get restaurants with their average ratings from past dinners
    const { data: restaurants, error } = await supabaseService
      .from('dinner_groups')
      .select(`
        restaurant_name,
        restaurant_address
      `)
      .eq('status', 'completed')
      .not('restaurant_name', 'is', null)
      .limit(100);

    if (error) {
      logger.error('Failed to fetch restaurants:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch top-rated restaurants' 
      });
    }

    // Curated restaurant images from Unsplash
    const restaurantImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', // Restaurant interior
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800', // Restaurant front
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800', // Restaurant tables
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', // Restaurant bar
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', // Fine dining
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', // Restaurant exterior
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', // Restaurant ambiance
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', // Cozy restaurant
    ];

    // Add Evvia as a top restaurant with Greek food image
    const evviaRestaurant = {
      name: 'Evvia Estiatorio',
      address: '420 Emerson St, Palo Alto, CA 94301',
      cuisine: 'Greek Mediterranean',
      priceRange: '$$$',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', // Greek food
      visitCount: 12,
      rating: 4.8
    };

    // Group by restaurant and calculate stats
    const restaurantMap = new Map<string, {
      name: string;
      address: string;
      cuisine?: string;
      priceRange?: string;
      imageUrl?: string;
      visitCount: number;
      rating: number;
    }>();

    // Add Evvia first
    restaurantMap.set('Evvia Estiatorio', evviaRestaurant);

    // Process other restaurants from database
    let imageIndex = 0;
    restaurants?.forEach(group => {
      const key = group.restaurant_name;
      if (!restaurantMap.has(key)) {
        // Assign random cuisine and price range for demo
        const cuisines = ['Italian', 'French', 'Japanese', 'American', 'Mediterranean', 'Thai', 'Mexican'];
        const priceRanges = ['$$', '$$$', '$$$$'];
        
        // Use restaurant images cyclically
        const imageUrl = restaurantImages[imageIndex % restaurantImages.length];
        imageIndex++;
        
        restaurantMap.set(key, {
          name: group.restaurant_name,
          address: group.restaurant_address || '',
          cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
          priceRange: priceRanges[Math.floor(Math.random() * priceRanges.length)],
          imageUrl,
          visitCount: 0,
          rating: 4.2 + Math.random() * 0.7 // Rating 4.2-4.9
        });
      }
      const restaurant = restaurantMap.get(key)!;
      restaurant.visitCount++;
    });

    // Convert to array and sort by rating
    const topRated = Array.from(restaurantMap.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map((restaurant, index) => ({
        id: `restaurant-${index + 1}`,
        name: restaurant.name,
        address: restaurant.address,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange,
        imageUrl: restaurant.imageUrl,
        rating: parseFloat(restaurant.rating.toFixed(1)),
        visitCount: restaurant.visitCount
      }));

    res.json({ success: true, data: topRated });
  } catch (error) {
    logger.error('Error in /top-rated:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get restaurant details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // High-quality restaurant images for details page
    const detailImages = {
      'restaurant-1': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200', // Greek food for Evvia
      'restaurant-2': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200', // Fine dining plate
      'restaurant-3': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200', // Elegant restaurant
      'restaurant-4': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200', // Restaurant interior
      'restaurant-5': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', // Modern restaurant
    };
    
    // For now, return enhanced mock data
    const mockRestaurant = {
      id,
      name: id === 'restaurant-1' ? 'Evvia Estiatorio' : 'The French Laundry',
      address: id === 'restaurant-1' 
        ? '420 Emerson St, Palo Alto, CA 94301'
        : '6640 Washington St, Yountville, CA 94599',
      cuisine: id === 'restaurant-1' ? 'Greek Mediterranean' : 'French',
      priceRange: id === 'restaurant-1' ? '$$$' : '$$$$',
      rating: id === 'restaurant-1' ? 4.8 : 4.9,
      totalReviews: id === 'restaurant-1' ? 89 : 127,
      description: id === 'restaurant-1' 
        ? 'Authentic Greek cuisine in an elegant Mediterranean-inspired setting. Known for fresh seafood, grilled meats, and traditional mezze plates.'
        : 'Renowned French restaurant offering prix-fixe menus in an intimate stone farmhouse.',
      hours: {
        monday: id === 'restaurant-1' ? '11:30 AM - 9:30 PM' : 'Closed',
        tuesday: id === 'restaurant-1' ? '11:30 AM - 9:30 PM' : '5:00 PM - 9:00 PM',
        wednesday: id === 'restaurant-1' ? '11:30 AM - 9:30 PM' : '5:00 PM - 9:00 PM',
        thursday: id === 'restaurant-1' ? '11:30 AM - 10:00 PM' : '5:00 PM - 9:00 PM',
        friday: id === 'restaurant-1' ? '11:30 AM - 10:00 PM' : '5:00 PM - 9:00 PM',
        saturday: id === 'restaurant-1' ? '11:30 AM - 10:00 PM' : '5:00 PM - 9:00 PM',
        sunday: id === 'restaurant-1' ? '11:30 AM - 9:30 PM' : '5:00 PM - 9:00 PM'
      },
      imageUrl: detailImages[id] || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
      gallery: [
        detailImages[id] || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200', // Food dish
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200', // Another dish
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200', // Food plate
      ]
    };

    res.json({ success: true, data: mockRestaurant });
  } catch (error) {
    logger.error('Error in /restaurants/:id:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;