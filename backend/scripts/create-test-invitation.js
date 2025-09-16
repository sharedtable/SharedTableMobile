const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestInvitation() {
  try {
    // Create a test invitation code
    const testCode = 'TESTCODE123';
    
    // Check if the code already exists
    const { data: existing, error: checkError } = await supabase
      .from('exclusive_invitations')
      .select('*')
      .eq('code', testCode)
      .single();
    
    if (existing && !checkError) {
      console.log('Test invitation code already exists:', testCode);
      
      // Update it to ensure it's active
      const { error: updateError } = await supabase
        .from('exclusive_invitations')
        .update({
          is_active: true,
          current_uses: 0,
          max_uses: 100,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })
        .eq('code', testCode);
      
      if (updateError) {
        console.error('Error updating invitation:', updateError);
      } else {
        console.log('Test invitation code updated successfully');
      }
    } else {
      // Create new invitation
      const { data, error } = await supabase
        .from('exclusive_invitations')
        .insert({
          code: testCode,
          type: 'test',
          description: 'Test invitation for development',
          max_uses: 100,
          current_uses: 0,
          is_active: true,
          created_by: 'system',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating invitation:', error);
        process.exit(1);
      }
      
      console.log('Test invitation created successfully:');
      console.log('Code:', testCode);
      console.log('Type:', data.type);
      console.log('Max uses:', data.max_uses);
      console.log('Expires:', data.expires_at);
    }
    
    console.log('\n✅ You can now use the code "TESTCODE123" to test the invitation system');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createTestInvitation();