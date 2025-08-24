import { Router, Request, Response } from 'express';
import { supabaseService } from '../config/supabase';
import * as streamFeeds from '../services/streamFeeds';

const router = Router();

// Simple timeline endpoint for testing - no auth
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    // For testing, use a hardcoded user ID or create test data
    const testUserId = 'test-user-123';
    
    // Return empty array for now since we haven't created posts yet
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Simple create post endpoint for testing - no auth
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const { content, imageUrl } = req.body;
    const testUserId = 'test-user-123';
    
    // Create a simple post object
    const post = {
      id: Date.now().toString(),
      user_id: testUserId,
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      users: {
        id: testUserId,
        name: 'Test User',
        avatar_url: null
      }
    };

    // For now, just return the post without saving to Stream
    res.json({
      success: true,
      data: {
        post,
        activity: { id: post.id }
      }
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;