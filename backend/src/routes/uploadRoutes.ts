import { Router, Request, Response } from 'express';
import { supabaseService } from '../config/supabase';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Upload image endpoint
router.post('/upload', verifyPrivyToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const privyUserId = req.user?.id;
    if (!privyUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate unique filename
    const fileExt = req.file.mimetype.split('/')[1];
    const fileName = `${privyUserId}/${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseService.storage
      .from('post-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('post-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: fileName,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

export default router;