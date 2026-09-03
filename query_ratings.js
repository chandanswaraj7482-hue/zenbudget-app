import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://oqnttkiwucvscydfehof.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY5NDk0MiwiZXhwIjoyMDk5MjcwOTQyfQ.bkCLH5QuGMFAJ8ndnkfaDk1frdxfEBCz6_LM_Mrxgzc';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function run() {
  const { data, error } = await supabase.from('app_ratings').select('*');
  console.log(error || data);
}
run();
