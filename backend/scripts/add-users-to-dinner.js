const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUsersToDinner() {
  try {
    // Your two email accounts
    const email1 = 'garyxuejingzhou@gmail.com';
    const email2 = 'garyxuejingzhou+1@gmail.com';
    
    console.log('Finding user IDs for your accounts...');
    
    // Get user IDs
    const { data: user1, error: error1 } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email1)
      .single();
      
    const { data: user2, error: error2 } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email2)
      .single();
    
    if (error1 || !user1) {
      console.error(`User ${email1} not found:`, error1);
      return;
    }
    
    if (error2 || !user2) {
      console.error(`User ${email2} not found:`, error2);
      return;
    }
    
    console.log('Found users:');
    console.log('User 1:', user1);
    console.log('User 2:', user2);
    
    // Get the existing dinner group
    const { data: dinnerGroups, error: groupError } = await supabase
      .from('dinner_groups')
      .select('*')
      .limit(1);
    
    if (groupError || !dinnerGroups || dinnerGroups.length === 0) {
      console.error('No dinner groups found:', groupError);
      return;
    }
    
    const dinnerGroup = dinnerGroups[0];
    console.log('\nDinner group found:');
    console.log('- ID:', dinnerGroup.id);
    console.log('- Restaurant:', dinnerGroup.restaurant_name);
    console.log('- Date:', dinnerGroup.reservation_date);
    console.log('- Time:', dinnerGroup.reservation_time);
    
    // Check if we have a dinners table (renamed from timeslots)
    // First try to get the dinner record
    const { data: dinner, error: dinnerError } = await supabase
      .from('dinners')
      .select('*')
      .eq('id', dinnerGroup.time_slot_id)
      .single();
    
    if (dinnerError) {
      console.log('\nNo dinners table found, checking for timeslots...');
      
      // Fallback to timeslots if dinners doesn't exist
      const { data: timeslot, error: timeslotError } = await supabase
        .from('timeslots')
        .select('*')
        .eq('id', dinnerGroup.time_slot_id)
        .single();
      
      if (timeslotError) {
        console.error('Could not find dinner/timeslot record:', timeslotError);
        return;
      }
    }
    
    const dinnerId = dinnerGroup.time_slot_id;
    
    // Check existing bookings for this dinner
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('dinner_bookings')
      .select('user_id, status')
      .or(`dinner_id.eq.${dinnerId},timeslot_id.eq.${dinnerId}`);
    
    if (!bookingsError && existingBookings) {
      console.log('\nCurrent bookings for this dinner:', existingBookings.length);
      
      // Get user details for existing bookings
      const existingUserIds = existingBookings.map(b => b.user_id);
      if (existingUserIds.length > 0) {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .in('id', existingUserIds);
        
        console.log('Current members:');
        existingUsers?.forEach(u => console.log(`- ${u.email} (${u.first_name} ${u.last_name})`));
      }
    }
    
    // Check if users are already booked
    const userIdsToAdd = [user1.id, user2.id];
    const alreadyBooked = existingBookings?.filter(b => userIdsToAdd.includes(b.user_id)) || [];
    
    if (alreadyBooked.length > 0) {
      console.log('\nSome users are already booked for this dinner:', alreadyBooked.map(b => b.user_id));
    }
    
    // Determine which users need to be added
    const usersToActuallyAdd = userIdsToAdd.filter(
      id => !alreadyBooked.some(b => b.user_id === id)
    );
    
    if (usersToActuallyAdd.length === 0) {
      console.log('\nBoth users are already booked for this dinner!');
      return;
    }
    
    // Remove random existing bookings to make space
    const bookingsToRemove = [];
    const eligibleForRemoval = existingBookings?.filter(
      b => !userIdsToAdd.includes(b.user_id) && b.status !== 'confirmed'
    ) || [];
    
    for (let i = 0; i < usersToActuallyAdd.length && i < eligibleForRemoval.length; i++) {
      const randomIndex = Math.floor(Math.random() * eligibleForRemoval.length);
      const bookingToRemove = eligibleForRemoval.splice(randomIndex, 1)[0];
      bookingsToRemove.push(bookingToRemove);
    }
    
    // Remove selected bookings
    if (bookingsToRemove.length > 0) {
      const userIdsToRemove = bookingsToRemove.map(b => b.user_id);
      
      const { data: removedUsers } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', userIdsToRemove);
      
      console.log('\nRemoving bookings for:');
      removedUsers?.forEach(u => console.log(`- ${u.email} (${u.first_name} ${u.last_name})`));
      
      // Try both column names for compatibility
      const { error: deleteError1 } = await supabase
        .from('dinner_bookings')
        .delete()
        .eq('dinner_id', dinnerId)
        .in('user_id', userIdsToRemove);
      
      if (deleteError1) {
        // Fallback to timeslot_id if dinner_id doesn't exist
        const { error: deleteError2 } = await supabase
          .from('dinner_bookings')
          .delete()
          .eq('timeslot_id', dinnerId)
          .in('user_id', userIdsToRemove);
        
        if (deleteError2) {
          console.error('Error removing bookings:', deleteError2);
        }
      }
    }
    
    // Add new bookings
    console.log('\nAdding bookings for:');
    for (const userId of usersToActuallyAdd) {
      const user = userId === user1.id ? user1 : user2;
      console.log(`- ${user.email} (${user.first_name} ${user.last_name})`);
      
      // Try with dinner_id first (new schema)
      let bookingData = {
        dinner_id: dinnerId,
        user_id: userId,
        status: 'confirmed'
      };
      
      const { error: insertError1 } = await supabase
        .from('dinner_bookings')
        .insert(bookingData);
      
      if (insertError1) {
        // Fallback to timeslot_id if dinner_id doesn't exist
        bookingData = {
          timeslot_id: dinnerId,
          user_id: userId,
          status: 'confirmed'
        };
        
        const { error: insertError2 } = await supabase
          .from('dinner_bookings')
          .insert(bookingData);
        
        if (insertError2) {
          console.error(`Error adding booking for ${user.email}:`, insertError2);
        } else {
          console.log(`✅ Successfully added ${user.email}`);
        }
      } else {
        console.log(`✅ Successfully added ${user.email}`);
      }
    }
    
    // Get final bookings list
    const { data: finalBookings } = await supabase
      .from('dinner_bookings')
      .select('user_id, status')
      .or(`dinner_id.eq.${dinnerId},timeslot_id.eq.${dinnerId}`);
    
    if (finalBookings) {
      const finalUserIds = finalBookings.map(b => b.user_id);
      const { data: finalUsers } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', finalUserIds);
      
      console.log('\n✅ Successfully updated dinner bookings!');
      console.log('Final member count:', finalUserIds.length);
      console.log('\nFinal members:');
      finalUsers?.forEach(m => console.log(`- ${m.email} (${m.first_name} ${m.last_name})`));
    }
    
  } catch (error) {
    console.error('Error updating dinner bookings:', error);
  }
}

addUsersToDinner();