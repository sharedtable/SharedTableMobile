import { Router, Request, Response } from 'express';
import { supabaseService } from '../config/supabase';
import { z } from 'zod';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  content: z.string().max(500).optional().default(''),
  imageUrl: z.string().optional(),
});

const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

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

    // Get the actual user from the database using the Privy ID
    console.log('Looking up user with external_auth_id:', privyUserId);
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, display_name, first_name, last_name, phone')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      console.error('Privy ID used for lookup:', privyUserId);
      
      // Try to find any user with this Privy ID (case-insensitive)
      const { data: allUsers } = await supabaseService
        .from('users')
        .select('id, external_auth_id')
        .ilike('external_auth_id', `%${privyUserId.split(':').pop()}%`);
      
      console.error('Users with similar external_auth_id:', allUsers);
      return res.status(404).json({ error: 'User not found. Please complete onboarding.' });
    }
    
    console.log('Found user:', userData.id, 'with display_name:', userData.display_name);
    
    // Save post to database
    const { data: post, error: dbError } = await supabaseService
      .from('posts')
      .insert({
        user_id: userData.id,
        content: content || '',
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating post:', dbError);
      return res.status(500).json({ error: 'Failed to create post' });
    }

    console.log('Post created successfully:', post.id, 'by user:', userData.display_name || userData.email);

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          users: {
            id: userData.id,
            name: userData.display_name || userData.first_name || userData.email?.split('@')[0] || 'User',
            email: userData.email,
            avatar_url: null
          }
        },
        activity: { id: post.id }
      }
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user timeline (all posts for now)
router.get('/timeline', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset } = paginationSchema.parse(req.query);
    
    // Get posts from database
    const { data: posts, error } = await supabaseService
      .from('posts')
      .select('*')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error fetching timeline:', error);
      return res.status(500).json({ error: 'Failed to fetch timeline' });
    }

    if (!posts || posts.length === 0) {
      console.log('No posts found in database');
      return res.json({
        success: true,
        data: []
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(posts.map(post => post.user_id))];
    
    // Fetch all users for these posts
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id, email, display_name, first_name, last_name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of users by ID
    const usersMap = new Map();
    (users || []).forEach(user => {
      usersMap.set(user.id, user);
    });

    // Get the current user's ID
    const { data: currentUser } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    // Get like counts and user's own likes for all posts
    const postIds = posts.map(p => p.id);
    
    // Get all likes for these posts
    const { data: likes } = await supabaseService
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    // Create maps for like counts and user's own likes
    const likeCounts = new Map<string, number>();
    const userLikes = new Map<string, boolean>();
    
    (likes || []).forEach(like => {
      // Count likes per post
      const currentCount = likeCounts.get(like.post_id) || 0;
      likeCounts.set(like.post_id, currentCount + 1);
      
      // Track if current user liked each post
      if (currentUser && like.user_id === currentUser.id) {
        userLikes.set(like.post_id, true);
      }
    });

    // Transform posts to match feed activity format
    const activities = posts.map(post => {
      const user = usersMap.get(post.user_id);
      const likeCount = likeCounts.get(post.id) || 0;
      const isLiked = userLikes.get(post.id) || false;
      
      return {
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
            name: user?.display_name || user?.first_name || user?.email?.split('@')[0] || 'User',
            email: user?.email,
            avatar_url: null
          }
        },
        reaction_counts: {
          like: likeCount,
          comment: 0
        },
        own_reactions: {
          like: isLiked ? [{ id: 'liked' }] : []
        }
      };
    });

    console.log(`Returning ${activities.length} posts from database`);

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
    
    // Get all posts from database
    const { data: posts, error } = await supabaseService
      .from('posts')
      .select('*')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error fetching discover feed:', error);
      return res.status(500).json({ error: 'Failed to fetch discover feed' });
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(posts.map(post => post.user_id))];
    
    // Fetch all users for these posts
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id, email, display_name, first_name, last_name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of users by ID
    const usersMap = new Map();
    (users || []).forEach(user => {
      usersMap.set(user.id, user);
    });

    // Get the current user's ID
    const { data: currentUser } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    // Get like counts and user's own likes for all posts
    const postIds = posts.map(p => p.id);
    
    // Get all likes for these posts
    const { data: likes } = await supabaseService
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    // Create maps for like counts and user's own likes
    const likeCounts = new Map<string, number>();
    const userLikes = new Map<string, boolean>();
    
    (likes || []).forEach(like => {
      // Count likes per post
      const currentCount = likeCounts.get(like.post_id) || 0;
      likeCounts.set(like.post_id, currentCount + 1);
      
      // Track if current user liked each post
      if (currentUser && like.user_id === currentUser.id) {
        userLikes.set(like.post_id, true);
      }
    });

    // Transform posts to match feed activity format
    const activities = posts.map(post => {
      const user = usersMap.get(post.user_id);
      const likeCount = likeCounts.get(post.id) || 0;
      const isLiked = userLikes.get(post.id) || false;
      
      return {
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
            name: user?.display_name || user?.first_name || user?.email?.split('@')[0] || 'User',
            email: user?.email,
            avatar_url: null
          }
        },
        reaction_counts: {
          like: likeCount,
          comment: 0
        },
        own_reactions: {
          like: isLiked ? [{ id: 'liked' }] : []
        }
      };
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Get discover feed error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Like a post
router.post('/posts/:postId/like', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { postId } = req.params;
    
    // Get the user from the database
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the post exists
    const { data: postData, error: postError } = await supabaseService
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Insert the like (ignore if already exists)
    const { error: likeError } = await supabaseService
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userData.id,
      });

    if (likeError && likeError.code !== '23505') { // 23505 is unique violation
      console.error('Error liking post:', likeError);
      return res.status(500).json({ error: 'Failed to like post' });
    }

    // Get updated like count
    const { count } = await supabaseService
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    res.json({ 
      success: true,
      data: {
        liked: true,
        like_count: count || 0
      }
    });
  } catch (error: any) {
    console.error('Like post error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Unlike a post
router.delete('/posts/:postId/like', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { postId } = req.params;
    
    // Get the user from the database
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the like
    const { error: deleteError } = await supabaseService
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.id);

    if (deleteError) {
      console.error('Error unliking post:', deleteError);
      return res.status(500).json({ error: 'Failed to unlike post' });
    }

    // Get updated like count
    const { count } = await supabaseService
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    res.json({ 
      success: true,
      data: {
        liked: false,
        like_count: count || 0
      }
    });
  } catch (error: any) {
    console.error('Unlike post error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Comment on a post (stub for now)
router.post('/posts/:activityId/comment', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    
    // TODO: Implement comments table
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

// Follow a user (stub for now)
router.post('/users/:targetUserId/follow', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Implement follows table
    res.json({ success: true });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Unfollow a user (stub for now)
router.delete('/users/:targetUserId/follow', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Implement follows table
    res.json({ success: true });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;