import { Router, Response } from 'express';
import { supabaseService } from '../config/supabase';
import { z } from 'zod';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  content: z.string().max(500).optional().default(''),
  imageUrl: z.string().optional(), // Allow local URIs too, not just URLs
});

const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// In-memory storage for MVP (replace with Stream Feeds later)
const posts: any[] = [];

// Create a new post
router.post('/posts', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, imageUrl } = createPostSchema.parse(req.body);
    
    // Ensure at least content or image is provided
    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Please provide content or an image' });
    }

    // Get the actual user UUID from the database using the Privy ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, display_name, first_name, last_name')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      console.error('Could not find user:', userError);
      // For MVP, create an in-memory post
      const mockPost = {
        id: Date.now().toString(),
        user_id: privyUserId,
        content: content || '',
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        user_email: req.user?.email || 'user@example.com',
        user_name: req.user?.email?.split('@')[0] || 'User',
        display_name: req.user?.email?.split('@')[0] || 'User',
      };
      
      posts.unshift(mockPost);
      console.log('Created in-memory post:', mockPost);
      console.log('Total posts in memory:', posts.length);
      
      return res.json({
        success: true,
        data: {
          post: mockPost,
          activity: { id: mockPost.id }
        }
      });
    }
    
    // Save post to database with the actual user UUID
    const { data: post, error: dbError } = await supabaseService
      .from('posts')
      .insert({
        user_id: userData.id,
        content,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // For MVP, create a mock post if DB fails
      const mockPost = {
        id: Date.now().toString(),
        user_id: userData?.id || privyUserId,
        content: content || '',
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        user_email: userData?.email || req.user?.email || 'user@example.com',
        user_name: userData?.display_name || userData?.first_name || userData?.email?.split('@')[0] || req.user?.email?.split('@')[0] || 'User',
        display_name: userData?.display_name || userData?.first_name || userData?.email?.split('@')[0] || 'User',
      };
      
      posts.unshift(mockPost);
      console.log('Created in-memory post:', mockPost);
      console.log('Total posts in memory:', posts.length);
      
      return res.json({
        success: true,
        data: {
          post: mockPost,
          activity: { id: mockPost.id }
        }
      });
    }
    
    // Also add to in-memory storage with user info for consistency
    const enrichedPost = {
      ...post,
      user_email: userData?.email || req.user?.email || 'user@example.com',
      user_name: userData?.display_name || userData?.first_name || 'User',
      display_name: userData?.display_name || userData?.first_name || 'User',
    };
    posts.unshift(enrichedPost);
    console.log('Created post with user info:', enrichedPost);

    res.json({
      success: true,
      data: {
        post: enrichedPost,
        activity: { id: post.id }
      }
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user timeline (following + own posts)
router.get('/timeline', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset } = paginationSchema.parse(req.query);
    
    // First check in-memory posts (for MVP fallback)
    console.log('Checking timeline - posts in memory:', posts.length);
    if (posts.length > 0) {
      const paginatedPosts = posts.slice(offset, offset + limit);
      console.log('Returning', paginatedPosts.length, 'posts from memory');
      const activities = paginatedPosts.map(post => ({
        id: post.id,
        actor: `user:${post.user_id}`,
        verb: 'post',
        object: `post:${post.id}`,
        time: post.created_at,
        content: post.content,
        image_url: post.image_url,
        post: {
          ...post,
          users: {
            id: post.user_id,
            name: post.display_name || post.user_name || (post.user_email ? post.user_email.split('@')[0] : 'User'),
            email: post.user_email,
            avatar_url: null
          }
        },
        reaction_counts: {
          like: 0,
          comment: 0
        },
        own_reactions: {
          like: []
        }
      }));
      
      return res.json({
        success: true,
        data: activities
      });
    }
    
    // Try to get posts from database
    const { data: dbPosts, error } = await supabaseService
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      // Return in-memory posts if DB fails
      const paginatedPosts = posts.slice(offset, offset + limit);
      return res.json({
        success: true,
        data: paginatedPosts.map(post => ({
          id: post.id,
          actor: `user:${post.user_id}`,
          verb: 'post',
          object: `post:${post.id}`,
          time: post.created_at,
          content: post.content,
          image_url: post.image_url,
          post: {
            ...post,
            users: {
              id: post.user_id,
              name: post.display_name || post.user_name || (post.user_email ? post.user_email.split('@')[0] : req.user?.email?.split('@')[0] || 'User'),
              email: post.user_email || req.user?.email,
              avatar_url: null
            }
          },
          reaction_counts: {
            like: 0,
            comment: 0
          },
          own_reactions: {
            like: []
          }
        }))
      });
    }

    // Transform posts to match feed activity format
    const activities = (dbPosts || []).map(post => ({
      id: post.id,
      actor: `user:${post.user_id}`,
      verb: 'post',
      object: `post:${post.id}`,
      time: post.created_at,
      content: post.content,
      image_url: post.image_url,
      post: {
        ...post,
        users: {
          id: post.user_id,
          name: req.user?.email?.split('@')[0] || 'User',
          avatar_url: null
        }
      },
      reaction_counts: {
        like: 0,
        comment: 0
      },
      own_reactions: {
        like: []
      }
    }));

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get global/discover feed
router.get('/discover', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    
    // Same as timeline for MVP
    const { data: dbPosts, error: _error } = await supabaseService
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const activities = (dbPosts || []).map(post => ({
      id: post.id,
      actor: `user:${post.user_id}`,
      verb: 'post',
      object: `post:${post.id}`,
      time: post.created_at,
      content: post.content,
      image_url: post.image_url,
      post: {
        ...post,
        users: {
          id: post.user_id,
          name: 'User',
          avatar_url: null
        }
      },
      reaction_counts: {
        like: 0,
        comment: 0
      },
      own_reactions: {
        like: []
      }
    }));

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Get discover feed error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Like a post (mock for now)
router.post('/posts/:activityId/like', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    console.error('Like post error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Comment on a post (mock for now)
router.post('/posts/:activityId/comment', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    
    res.json({ 
      success: true,
      data: {
        id: Date.now().toString(),
        text,
        user_id: req.user?.id,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Follow a user (mock for now)
router.post('/users/:targetUserId/follow', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Unfollow a user (mock for now)
router.delete('/users/:targetUserId/follow', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;