import { supabaseService } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function testBookingFlow() {
  try {
    console.log('🔍 Testing Booking Flow...\n');
    
    // Get a test user
    const { data: users, error: userError } = await supabaseService
      .from('users')
      .select('id, email, external_auth_id')
      .limit(5);
    
    if (userError || !users || users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Available test users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    const testUser = users[0];
    console.log(`\nUsing test user: ${testUser.email}\n`);
    
    // Get user's existing bookings
    const { data: existingBookings, error: bookingsError } = await supabaseService
      .from('dinner_bookings')
      .select('dinner_id, status, payment_status')
      .eq('user_id', testUser.id);
    
    if (!bookingsError && existingBookings && existingBookings.length > 0) {
      console.log('User\'s existing bookings:');
      console.log('------------------------');
      existingBookings.forEach(booking => {
        console.log(`- Dinner: ${booking.dinner_id}`);
        console.log(`  Status: ${booking.status}, Payment: ${booking.payment_status}`);
      });
      console.log('');
    } else {
      console.log('User has no existing bookings\n');
    }
    
    // Get available dinners
    const { data: dinners, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*')
      .gte('datetime', new Date().toISOString())
      .order('datetime', { ascending: true })
      .limit(10);
    
    if (dinnerError || !dinners || dinners.length === 0) {
      console.log('No upcoming dinners found');
      return;
    }
    
    // Filter out already booked dinners
    const bookedDinnerIds = existingBookings?.map(b => b.dinner_id) || [];
    const availableDinners = dinners.filter(
      d => !bookedDinnerIds.includes(d.id)
    );
    
    console.log('Available dinners for booking:');
    console.log('------------------------------');
    
    if (availableDinners.length === 0) {
      console.log('❌ User has already booked all available dinners!');
      console.log('\nTo test booking, you can:');
      console.log('1. Create new dinners in the database');
      console.log('2. Delete existing bookings for this user');
      console.log('3. Use a different test user');
      return;
    }
    
    availableDinners.forEach((dinner, index) => {
      console.log(`\n${index + 1}. Dinner ID: ${dinner.id}`);
      console.log(`   Date/Time: ${new Date(dinner.datetime).toLocaleString()}`);
      console.log(`   City: ${dinner.city || 'N/A'}`);
      console.log(`   Restaurant: ${dinner.restaurant_name || 'N/A'}`);
      console.log(`   Signups: ${dinner.current_signups || 0}/${dinner.max_signups || 8}`);
    });
    
    console.log('\n✅ You can use any of these dinner IDs to test the booking flow!');
    console.log('\nExample API call:');
    console.log('POST /api/payments/booking-hold');
    console.log('Body: {');
    console.log(`  "dinnerId": "${availableDinners[0].id}",`);
    console.log('  "paymentMethodId": "pm_card_visa"');
    console.log('}');
    
  } catch (error) {
    console.error('Error testing booking flow:', error);
  }
}

testBookingFlow().then(() => process.exit(0));