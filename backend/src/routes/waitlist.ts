import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';

import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const validateInvitationSchema = z.object({
  code: z.string().min(1).max(50),
});

/**
 * GET /api/waitlist/status
 * Get current user's waitlist status and position
 */
router.get('/status', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('*')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // If user has access, redirect them
    if (user.access_granted) {
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          message: 'You have access to SharedTable',
        },
      });
    }

    // Add user to waitlist if not already
    if (!user.waitlist_joined_at) {
      await supabaseService
        .from('users')
        .update({
          waitlist_joined_at: new Date().toISOString(),
          waitlist_score: 10, // Base score for joining
        })
        .eq('id', user.id);
    }

    // Calculate updated score based on profile completion
    const { data: profile } = await supabaseService
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let score = 10; // Base score
    let mandatoryComplete = false;
    let optionalComplete = false;
    let percentage = 10; // Base 10% for signing up

    // Check mandatory fields
    if (user.first_name && user.last_name && user.display_name) {
      score += 30;
      percentage += 30;
      
      if (user.gender && user.birthday) {
        score += 20;
        percentage += 20;
        mandatoryComplete = true;
      }
    }

    // Check optional profile fields
    if (profile) {
      const optionalFields = [
        profile.education_level,
        profile.job_title,
        profile.interests?.length > 0,
        profile.dietary_restrictions,
        profile.personality_traits?.length > 0,
        profile.hobbies?.length > 0,
        profile.hometown,
        profile.ethnicity,
      ];

      const completedOptional = optionalFields.filter(Boolean).length;
      const optionalScore = completedOptional * 5;
      score += optionalScore;
      percentage += Math.min(40, completedOptional * 5); // Cap at 40% for optional

      if (completedOptional >= 6) {
        optionalComplete = true;
      }
    }

    // Update score if changed
    if (score !== user.waitlist_score) {
      await supabaseService
        .from('users')
        .update({ waitlist_score: score })
        .eq('id', user.id);
    }

    // Get total users on waitlist
    const { count: totalWaiting } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('access_granted', false)
      .not('waitlist_joined_at', 'is', null);

    // Get user's position
    const { data: higherScoreUsers } = await supabaseService
      .from('users')
      .select('id', { count: 'exact' })
      .eq('access_granted', false)
      .not('waitlist_joined_at', 'is', null)
      .or(`waitlist_score.gt.${score},and(waitlist_score.eq.${score},waitlist_joined_at.lt.${user.waitlist_joined_at})`);

    const position = (higherScoreUsers?.length || 0) + 1;

    // Estimate time based on position
    let estimatedTime = 'Soon';
    if (position > 100) {
      estimatedTime = '2-3 weeks';
    } else if (position > 50) {
      estimatedTime = '1-2 weeks';
    } else if (position > 20) {
      estimatedTime = '3-5 days';
    } else if (position > 10) {
      estimatedTime = '1-2 days';
    }

    res.json({
      success: true,
      data: {
        hasAccess: false,
        onboardingProgress: {
          mandatory: mandatoryComplete,
          optional: optionalComplete,
          percentage: Math.min(100, percentage),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/waitlist/validate-code
 * Validate an exclusive invitation code
 */
router.post('/validate-code', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { code } = validateInvitationSchema.parse(req.body);

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, access_granted')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Check if user already has access
    if (user.access_granted) {
      return res.json({
        success: true,
        message: 'You already have access to Fare',
      });
    }

    // Find the invitation code
    const { data: invitation, error: inviteError } = await supabaseService
      .from('exclusive_invitations')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (inviteError || !invitation) {
      throw new AppError('Invalid invitation code', 400);
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new AppError('This invitation code has expired', 400);
    }

    // Check if invitation has reached max uses
    if (invitation.current_uses >= invitation.max_uses) {
      throw new AppError('This invitation code has already been used', 400);
    }

    // Use the invitation code - transaction-like operation
    const { error: updateInviteError } = await supabaseService
      .from('exclusive_invitations')
      .update({
        current_uses: invitation.current_uses + 1,
        used_by: user.id,
        used_at: new Date().toISOString(),
        is_active: (invitation.current_uses + 1) >= invitation.max_uses ? false : true,
      })
      .eq('id', invitation.id);

    if (updateInviteError) {
      logger.error('Failed to update invitation:', updateInviteError);
      throw new AppError('Failed to process invitation', 500);
    }

    // Grant access to the user
    const { error: updateUserError } = await supabaseService
      .from('users')
      .update({
        access_granted: true,
        invited_by: invitation.created_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('Failed to grant user access:', updateUserError);
      
      // Rollback invitation update
      await supabaseService
        .from('exclusive_invitations')
        .update({
          current_uses: invitation.current_uses,
          used_by: null,
          used_at: null,
          is_active: true,
        })
        .eq('id', invitation.id);
      
      throw new AppError('Failed to grant access', 500);
    }

    logger.info(`User ${user.id} successfully used invitation code ${code}`);

    res.json({
      success: true,
      message: 'Welcome to Fare! Your invitation has been accepted.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/waitlist/generate-codes
 * Generate exclusive invitation codes (admin only)
 */
router.post('/generate-codes', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user and check if they're admin
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, email, access_granted')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is admin (you can adjust this logic)
    const adminEmails = ['gary@sharedtable.app', 'admin@sharedtable.app'];
    if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
      throw new AppError('Unauthorized', 403);
    }

    const { count = 5 } = req.body;

    // Generate exclusive codes
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = generateExclusiveCode();
      codes.push({
        code,
        created_by: user.id,
        max_uses: 1,
        is_active: true,
      });
    }

    // Insert codes
    const { data: invitations, error: insertError } = await supabaseService
      .from('exclusive_invitations')
      .insert(codes)
      .select();

    if (insertError) {
      logger.error('Failed to create invitations:', insertError);
      throw new AppError('Failed to create invitations', 500);
    }

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate a prestigious, food-related invitation code for Fare
 */
function generateExclusiveCode(): string {
  const prestigeCategories = [
    // Michelin & Fine Dining
    'MICHELIN', 'STARRED', 'GOURMET', 'HAUTE',
    
    // Luxury Ingredients
    'TRUFFLE', 'CAVIAR', 'WAGYU', 'SAFFRON', 'FOIEGRAS',
    'OYSTER', 'LOBSTER', 'CHAMPAGNE', 'BORDEAUX',
    
    // Exclusive Dining Concepts
    'OMAKASE', 'KAISEKI', 'TASTING', 'CHEFS', 'PRIVATE',
    'SECRET', 'RESERVE', 'CELLAR', 'VINTAGE',
    
    // Elite Status
    'FOUNDERS', 'PIONEER', 'PREMIER', 'PLATINUM', 'GOLDEN',
  ];

  const prestigeSuffixes = [
    // Dining Related
    'TABLE', 'SEAT', 'PLATE', 'MENU', 'TASTE', 'FORK',
    'GLASS', 'COURSE', 'PAIRING',
    
    // Exclusive Access
    'CLUB', 'SOCIETY', 'CIRCLE', 'GUILD', 'SALON',
    'LOUNGE', 'ROOM', 'PASS', 'KEY', 'ACCESS',
    
    // Fine Dining Terms
    'PALATE', 'FEAST', 'SOIREE', 'AFFAIR', 'JOURNEY',
  ];

  const category = prestigeCategories[Math.floor(Math.random() * prestigeCategories.length)];
  const suffix = prestigeSuffixes[Math.floor(Math.random() * prestigeSuffixes.length)];
  
  return `${category}-${suffix}`;
}

export default router;