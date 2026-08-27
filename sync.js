const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://oqnttkiwucvscydfehof.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY5NDk0MiwiZXhwIjoyMDk5MjcwOTQyfQ.bkCLH5QuGMFAJ8ndnkfaDk1frdxfEBCz6_LM_Mrxgzc';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function syncUsers() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  for (const user of users) {
    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existingProfile) {
      const newProf = {
        id: user.id,
        name: user.email.split('@')[0],
        email: user.email.toLowerCase(),
        pin: '0000',
        subscription_tier: 'free',
        trial_start_date: new Date().toISOString(),
        trial_expire_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        avatar_url: `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=22c55e&color=fff&rounded=true`,
        referral_code: 'ZB-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        has_scan_pay_access: false
      };
      await supabase.from('profiles').insert(newProf);
      console.log(`Created profile for ${user.email}`);
    }
  }
}
syncUsers();
