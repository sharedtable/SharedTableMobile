import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testStripeConnection() {
  console.log('🧪 Testing Stripe Connection...\n');
  
  try {
    // Check if keys are loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY not found in environment');
    }
    
    console.log('✅ Stripe secret key found');
    console.log(`   Key starts with: ${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`);
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
    
    // Test 1: Check account connection
    console.log('\n📊 Fetching Account Details...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connected to Stripe account:', account.id);
    console.log('   Business name:', account.settings?.dashboard?.display_name || 'Not set');
    console.log('   Country:', account.country);
    console.log('   Currency:', account.default_currency);
    
    // Test 2: Create a test customer
    console.log('\n👤 Creating Test Customer...');
    const customer = await stripe.customers.create({
      email: 'test@sharedtable.app',
      name: 'Test User',
      description: 'Test customer for Stripe integration',
      metadata: {
        test: 'true',
        created_by: 'testStripe.ts'
      }
    });
    console.log('✅ Customer created:', customer.id);
    
    // Test 3: Create a setup intent
    console.log('\n💳 Creating Setup Intent...');
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        test: 'true'
      }
    });
    console.log('✅ Setup Intent created:', setupIntent.id);
    console.log('   Client Secret:', setupIntent.client_secret?.substring(0, 30) + '...');
    
    // Test 4: Create a payment intent with manual capture (for hold)
    console.log('\n💰 Creating Payment Intent (Hold)...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3000, // $30.00
      currency: 'usd',
      customer: customer.id,
      capture_method: 'manual',
      metadata: {
        test: 'true',
        type: 'booking_hold'
      }
    });
    console.log('✅ Payment Intent created:', paymentIntent.id);
    console.log('   Amount:', `$${paymentIntent.amount / 100}`);
    console.log('   Capture method:', paymentIntent.capture_method);
    console.log('   Status:', paymentIntent.status);
    
    // Clean up - delete test customer
    console.log('\n🧹 Cleaning up...');
    await stripe.customers.del(customer.id);
    console.log('✅ Test customer deleted');
    
    console.log('\n🎉 All Stripe tests passed successfully!');
    console.log('   Your Stripe integration is working correctly.');
    
  } catch (error: any) {
    console.error('\n❌ Stripe test failed!');
    console.error('   Error:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('   → Your API key is invalid. Please check your .env file');
    } else if (error.type === 'StripePermissionError') {
      console.error('   → Your API key doesn\'t have the required permissions');
    } else if (error.type === 'StripeConnectionError') {
      console.error('   → Could not connect to Stripe. Check your internet connection');
    }
    
    process.exit(1);
  }
}

// Run the test
testStripeConnection();