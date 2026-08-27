const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oqnttkiwucvscydfehof.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY5NDk0MiwiZXhwIjoyMDk5MjcwOTQyfQ.bkCLH5QuGMFAJ8ndnkfaDk1frdxfEBCz6_LM_Mrxgzc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function syncUsers() {
  console.log('Fetching auth.users...');
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  
  if (authErr) {
    console.error('Error fetching users:', authErr);
    return;
  }
  
  console.log(`Found ${users.length} users in Auth.`);
  
  for (const user of users) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (!existingProfile) {
      console.log(`Missing profile for user ${user.email}. Creating...`);
      
      const meta = user.user_metadata || {};
      const gName = meta.full_name || meta.name || user.email.split('@')[0] || 'User';
      const gEmail = user.email.toLowerCase();
      const gAvatar = meta.avatar_url || meta.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=22c55e&color=fff&rounded=true`;
      const myReferralCode = 'ZB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const newProf = {
        id: user.id,
        name: gName,
        email: gEmail,
        pin: '0000',
        subscription_tier: 'free',
        trial_start_date: new Date().toISOString(),
        trial_expire_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        avatar_url: gAvatar,
        referral_code: myReferralCode,
        has_scan_pay_access: false
      };
      
      const { error: insertErr } = await supabase.from('profiles').insert(newProf);
      if (insertErr) {
        console.error(`Error inserting profile for ${user.email}:`, insertErr);
      } else {
        console.log(`Successfully created profile for ${user.email}.`);
      }
    } else {
      console.log(`Profile already exists for ${user.email}.`);
    }
  }
  
  console.log('Sync complete!');
}

syncUsers();
