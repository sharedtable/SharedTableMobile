import { Router } from 'express';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Get top-rated restaurants
router.get('/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // For now, return curated mock data since dinner_groups table might not exist
    // In production, this would query from a restaurants table or dinner events
    const restaurants: any[] = [];

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

    // Add more curated restaurants for demo
    const mockRestaurants = [
      {
        name: 'The French Laundry',
        address: '6640 Washington St, Yountville, CA 94599',
        cuisine: 'French',
        priceRange: '$$$$',
        imageUrl: restaurantImages[1],
        visitCount: 8,
        rating: 4.9
      },
      {
        name: 'Nobu Palo Alto',
        address: '180 Hamilton Ave, Palo Alto, CA 94301',
        cuisine: 'Japanese',
        priceRange: '$$$',
        imageUrl: restaurantImages[2],
        visitCount: 15,
        rating: 4.7
      },
      {
        name: 'Baumé',
        address: '201 S California Ave, Palo Alto, CA 94306',
        cuisine: 'French',
        priceRange: '$$$$',
        imageUrl: restaurantImages[3],
        visitCount: 6,
        rating: 4.6
      },
      {
        name: 'Protégé',
        address: '250 California Ave, Palo Alto, CA 94306',
        cuisine: 'New American',
        priceRange: '$$$',
        imageUrl: restaurantImages[4],
        visitCount: 10,
        rating: 4.8
      },
      {
        name: 'Tamarine',
        address: '546 University Ave, Palo Alto, CA 94301',
        cuisine: 'Vietnamese',
        priceRange: '$$',
        imageUrl: restaurantImages[5],
        visitCount: 12,
        rating: 4.5
      },
      {
        name: 'Bird Dog',
        address: '420 Ramona St, Palo Alto, CA 94301',
        cuisine: 'American',
        priceRange: '$$',
        imageUrl: restaurantImages[6],
        visitCount: 18,
        rating: 4.4
      },
      {
        name: 'Oren\'s Hummus',
        address: '261 University Ave, Palo Alto, CA 94301',
        cuisine: 'Mediterranean',
        priceRange: '$$',
        imageUrl: restaurantImages[7],
        visitCount: 20,
        rating: 4.3
      }
    ];

    // Add mock restaurants to the map
    mockRestaurants.forEach(restaurant => {
      restaurantMap.set(restaurant.name, restaurant);
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