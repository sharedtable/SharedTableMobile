import { supabaseService } from '../config/supabase';

async function setupStorage() {
  try {
    console.log('Setting up Supabase Storage bucket for post images...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseService.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'post-images');

    if (bucketExists) {
      console.log('✅ Bucket "post-images" already exists');
    } else {
      // Create the bucket
      const { data, error: createError } = await supabaseService.storage.createBucket('post-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }

      console.log('✅ Created bucket "post-images"');
    }

    console.log('Storage setup complete!');
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run the setup
setupStorage();