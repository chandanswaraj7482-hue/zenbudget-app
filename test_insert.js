import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://oqnttkiwucvscydfehof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTQ5NDIsImV4cCI6MjA5OTI3MDk0Mn0.QKcdsK6mFhxFa2AkW084Paj53qv5qO0GerWzXBP5cQU';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { error } = await supabase.from('app_ratings').insert([{ user_name: 'Test', user_email: 'test@example.com', rating_stars: 5, feedback: 'Test feedback' }]);
  console.log('Error:', error);
}
run();
