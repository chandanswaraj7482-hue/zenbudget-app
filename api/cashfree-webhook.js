export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const SUPABASE_URL = 'https://oqnttkiwucvscydfehof.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTQ5NDIsImV4cCI6MjA5OTI3MDk0Mn0.QKcdsK6mFhxFa2AkW084Paj53qv5qO0GerWzXBP5cQU';

    const data = req.body || {};
    console.log('Cashfree Webhook Payload received:', data);

    const order = data.data?.order || {};
    const payment = data.data?.payment || {};

    if (payment.payment_status === 'SUCCESS' && order.customer_details?.customer_id) {
      const userId = order.customer_details.customer_id;
      const orderId = order.order_id || '';
      let tier = 'premium_monthly';
      let expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

      if (orderId.includes('scan_pay_lifetime')) {
        // Update Scan & Pay Access + Premium status
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            has_scan_pay_access: true,
            is_premium: true,
            updated_at: new Date().toISOString()
          })
        });
        console.log(`User ${userId} unlocked Scan & Pay Access via Webhook.`);
      } else {
        if (orderId.includes('yearly')) {
          tier = 'premium_yearly';
          // 1 Year (365 days) + 3 Months Free Bonus (90 days) = 455 days (15 months total!)
          expiresAt = new Date(Date.now() + 455 * 86400000).toISOString();
        } else if (orderId.includes('lifetime')) {
          tier = 'premium_lifetime';
          expiresAt = new Date(Date.now() + 100 * 365 * 86400000).toISOString();
        }

        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            subscription_tier: tier,
            premium_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
        });
        console.log(`User ${userId} upgraded to ${tier} (expires: ${expiresAt}) successfully via Webhook.`);

        // Check if user was referred by someone and check 10-paid-referral reward rule
        try {
          const userRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=referred_by`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const userData = await userRes.json();
          const referredByCode = userData?.[0]?.referred_by;

          if (referredByCode) {
            // Count total paid referrals for this inviter
            const countRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?referred_by=eq.${encodeURIComponent(referredByCode)}&subscription_tier=ilike.premium*&select=id`, {
              headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Range-Unit': 'items', 'Prefer': 'count=exact' }
            });
            const contentRange = countRes.headers.get('content-range');
            let paidCount = 0;
            if (contentRange) {
              const total = contentRange.split('/')[1];
              paidCount = parseInt(total, 10) || 0;
            } else {
              const paidList = await countRes.json();
              paidCount = Array.isArray(paidList) ? paidList.length : 0;
            }

            // Reward 1 Month (30 days) for every 10 paid members (e.g. at 10, 20, 30...)
            if (paidCount > 0 && paidCount % 10 === 0) {
              const inviterRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?referral_code=eq.${encodeURIComponent(referredByCode)}&select=id,subscription_tier,premium_expires_at`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
              });
              const inviterList = await inviterRes.json();
              const inviter = inviterList?.[0];
              if (inviter) {
                const currentExp = inviter.premium_expires_at ? new Date(inviter.premium_expires_at).getTime() : Date.now();
                const baseTime = currentExp > Date.now() ? currentExp : Date.now();
                const newExp = new Date(baseTime + 30 * 86400000).toISOString();

                await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${inviter.id}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    subscription_tier: inviter.subscription_tier?.startsWith('premium') ? inviter.subscription_tier : 'premium_monthly',
                    premium_expires_at: newExp,
                    updated_at: new Date().toISOString()
                  })
                });
                console.log(`Inviter ${inviter.id} rewarded with +30 days premium for reaching ${paidCount} paid referrals!`);
              }
            }
          }
        } catch (refRewardErr) {
          console.warn('Referral reward check error in webhook:', refRewardErr);
        }
      }
    }

    return res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
