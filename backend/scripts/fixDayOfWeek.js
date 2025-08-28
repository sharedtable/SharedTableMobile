import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get correct day of week
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z'); // Use noon UTC to avoid timezone issues
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

async function fixDayOfWeek() {
  console.log('🗓️ Fixing day of week for all time slots...\n');

  try {
    // Get all time slots
    const { data: timeSlots, error: fetchError } = await supabase
      .from('time_slots')
      .select('*')
      .order('slot_date');

    if (fetchError) {
      console.error('Error fetching time slots:', fetchError);
      return;
    }

    console.log(`Found ${timeSlots.length} time slots to check\n`);

    // Check and fix each time slot
    for (const slot of timeSlots) {
      const correctDay = getDayOfWeek(slot.slot_date);
      
      if (slot.day_of_week !== correctDay) {
        console.log(`❌ Incorrect: ${slot.slot_date} is ${correctDay}, not ${slot.day_of_week}`);
        
        // Update to correct day
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ 
            day_of_week: correctDay,
            updated_at: new Date().toISOString()
          })
          .eq('id', slot.id);

        if (updateError) {
          console.error(`   Error updating slot ${slot.id}:`, updateError);
        } else {
          console.log(`   ✅ Fixed to ${correctDay}`);
        }
      } else {
        console.log(`✅ Correct: ${slot.slot_date} is ${correctDay}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📅 Correct dates for August 2025:');
    console.log('='.repeat(60));
    
    // Show correct dates for August 2025
    const august2025Dates = [
      { date: '2025-08-29', day: getDayOfWeek('2025-08-29') },
      { date: '2025-08-30', day: getDayOfWeek('2025-08-30') },
      { date: '2025-08-31', day: getDayOfWeek('2025-08-31') },
      { date: '2025-09-01', day: getDayOfWeek('2025-09-01') },
      { date: '2025-09-05', day: getDayOfWeek('2025-09-05') },
      { date: '2025-09-06', day: getDayOfWeek('2025-09-06') },
    ];

    august2025Dates.forEach(({ date, day }) => {
      console.log(`  ${date} = ${day}`);
    });

    console.log('\n✅ Day of week fixing complete!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixDayOfWeek();