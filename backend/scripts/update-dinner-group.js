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

async function updateDinnerGroup() {
  try {
    // First, get your two user IDs
    const email1 = 'garyxuejingzhou@gmail.com';
    const email2 = 'garyxuejingzhou+1@gmail.com';
    
    console.log('Finding user IDs for your accounts...');
    
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
    console.log('\nCurrent dinner group:', dinnerGroup.id);
    console.log('Restaurant:', dinnerGroup.restaurant_name);
    console.log('Date:', dinnerGroup.reservation_date);
    console.log('Time:', dinnerGroup.reservation_time);
    
    // Get current members from group_members table
    const { data: currentGroupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, signup_id')
      .eq('dinner_group_id', dinnerGroup.id);
    
    if (membersError) {
      console.error('Error fetching group members:', membersError);
    }
    
    const currentUserIds = currentGroupMembers?.map(m => m.user_id) || [];
    
    // Get the current member details for display
    if (currentUserIds.length > 0) {
      const { data: currentMembers } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', currentUserIds);
      
      console.log('\nCurrent members in group:');
      currentMembers?.forEach(m => console.log(`- ${m.email} (${m.first_name} ${m.last_name})`));
    } else {
      console.log('\nNo current members in the group');
    }
    
    // Check if users are already in the group
    const userIdsToAdd = [user1.id, user2.id];
    const alreadyInGroup = currentUserIds.filter(id => userIdsToAdd.includes(id));
    
    if (alreadyInGroup.length > 0) {
      console.log('\nSome users are already in the group:', alreadyInGroup);
    }
    
    // Remove users that are already in the group from the list to add
    const usersToActuallyAdd = userIdsToAdd.filter(id => !currentUserIds.includes(id));
    
    if (usersToActuallyAdd.length === 0) {
      console.log('\nBoth users are already in the group!');
      return;
    }
    
    // Remove random users to make space (excluding the ones we want to add)
    const usersToRemove = [];
    const eligibleForRemoval = currentGroupMembers?.filter(m => !userIdsToAdd.includes(m.user_id)) || [];
    
    for (let i = 0; i < usersToActuallyAdd.length && i < eligibleForRemoval.length; i++) {
      const randomIndex = Math.floor(Math.random() * eligibleForRemoval.length);
      const memberToRemove = eligibleForRemoval.splice(randomIndex, 1)[0];
      usersToRemove.push(memberToRemove);
    }
    
    // Remove selected members from group_members table
    if (usersToRemove.length > 0) {
      const userIdsToRemove = usersToRemove.map(m => m.user_id);
      
      const { data: removedUsers } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', userIdsToRemove);
      
      console.log('\nRemoving users from group:');
      removedUsers?.forEach(u => console.log(`- ${u.email} (${u.first_name} ${u.last_name})`));
      
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('dinner_group_id', dinnerGroup.id)
        .in('user_id', userIdsToRemove);
      
      if (deleteError) {
        console.error('Error removing members:', deleteError);
        return;
      }
    }
    
    // First, we need to create slot_signups for the new users
    console.log('\nCreating slot signups for new users...');
    
    for (const userId of usersToActuallyAdd) {
      const user = userId === user1.id ? user1 : user2;
      
      // Create a slot_signup entry
      const { data: signup, error: signupError } = await supabase
        .from('slot_signups')
        .insert({
          user_id: userId,
          time_slot_id: dinnerGroup.time_slot_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (signupError) {
        console.error(`Error creating signup for ${user.email}:`, signupError);
        continue;
      }
      
      // Add to group_members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          dinner_group_id: dinnerGroup.id,
          user_id: userId,
          signup_id: signup.id,
          created_at: new Date().toISOString()
        });
      
      if (memberError) {
        console.error(`Error adding ${user.email} to group:`, memberError);
      } else {
        console.log(`✅ Added ${user.email} to the group`);
      }
    }
    
    // Get final member list
    const { data: finalGroupMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('dinner_group_id', dinnerGroup.id);
    
    const finalUserIds = finalGroupMembers?.map(m => m.user_id) || [];
    
    const { data: finalMembers } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', finalUserIds);
    
    console.log('\n✅ Successfully updated dinner group!');
    console.log('New member count:', finalUserIds.length);
    console.log('\nFinal members:');
    finalMembers?.forEach(m => console.log(`- ${m.email} (${m.first_name} ${m.last_name})`));
    
  } catch (error) {
    console.error('Error updating dinner group:', error);
  }
}

updateDinnerGroup();