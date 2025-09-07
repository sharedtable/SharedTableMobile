import { supabaseService } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function createTestEvent() {
  try {
    console.log('🎯 Creating test event for Stripe payment testing...\n');
    
    // Check if test event already exists
    const { data: existingEvent } = await supabaseService
      .from('dinner_events')
      .select('*')
      .eq('title', 'Test Dinner Event')
      .single();
    
    if (existingEvent) {
      console.log('✅ Test event already exists:', existingEvent.id);
      console.log('   Title:', existingEvent.title);
      console.log('   Date:', existingEvent.event_date);
      console.log('   Restaurant:', existingEvent.restaurant_name);
      return existingEvent;
    }
    
    // Create a new test event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: newEvent, error } = await supabaseService
      .from('dinner_events')
      .insert({
        title: 'Test Dinner Event',
        description: 'A test dinner event for Stripe payment testing',
        restaurant_name: 'The Test Kitchen',
        restaurant_id: null,
        event_date: tomorrow.toISOString().split('T')[0],
        start_time: '19:00:00',
        end_time: '21:00:00',
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
        price_per_person: 30.00,
        price_cents: 3000,
        cuisine_type: 'American',
        dining_style: 'Casual',
        dress_code: 'Smart Casual',
        max_capacity: 20,
        current_capacity: 0,
        min_age: 21,
        status: 'upcoming',
        created_by: null,
        host_id: null,
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
    
    console.log('✅ Test event created successfully!');
    console.log('   Event ID:', newEvent.id);
    console.log('   Title:', newEvent.title);
    console.log('   Date:', newEvent.event_date);
    console.log('   Price: $' + (newEvent.price_cents / 100));
    console.log('\n📋 Use this Event ID for testing:', newEvent.id);
    
    return newEvent;
  } catch (error) {
    console.error('Error creating test event:', error);
    process.exit(1);
  }
}

createTestEvent().then(() => process.exit(0));