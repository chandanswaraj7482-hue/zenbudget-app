import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://oqnttkiwucvscydfehof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY5NDk0MiwiZXhwIjoyMDk5MjcwOTQyfQ.bkCLH5QuGMFAJ8ndnkfaDk1frdxfEBCz6_LM_Mrxgzc';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { error } = await supabase.from('app_ratings').insert([{ user_id: '3e4c7118-fa3b-4daf-9049-4b686a68df17', user_name: 'Test', user_email: 'test@example.com', rating_stars: 5, feedback: 'Test' }]);
  console.log('Error with user_id:', error);
}
run();
