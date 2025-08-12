import { supabase } from '@/lib/supabase/client';

/**
 * Test function to debug OTP sending
 * Call this from your app to test different scenarios
 */
export const testOtpSending = async (email: string) => {
  console.log('🧪 Starting OTP test for email:', email);

  try {
    // Test 1: Basic OTP sending
    console.log('📧 Test 1: Basic signInWithOtp...');
    const result1 = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
    });
    console.log('📧 Test 1 result:', result1);

    // Test 2: OTP with shouldCreateUser true
    console.log('📧 Test 2: signInWithOtp with shouldCreateUser: true...');
    const result2 = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: true,
      },
    });
    console.log('📧 Test 2 result:', result2);

    // Test 3: Check current session
    console.log('📧 Test 3: Checking current session...');
    const session = await supabase.auth.getSession();
    console.log('📧 Test 3 session:', session);

    // Test 4: Check Supabase configuration
    console.log('📧 Test 4: Supabase config check...');
    console.log('Supabase client initialized successfully');

    return {
      success: true,
      results: { result1, result2, session },
    };
  } catch (error) {
    console.error('❌ OTP test error:', error);
    return {
      success: false,
      error,
    };
  }
};

/**
 * Test OTP verification
 */
export const testOtpVerification = async (email: string, token: string) => {
  console.log('🧪 Testing OTP verification for:', email, 'with token:', token);

  try {
    const result = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token,
      type: 'email',
    });

    console.log('✅ OTP verification result:', result);
    return result;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    return { error };
  }
};
