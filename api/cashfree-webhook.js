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
        // Update Scan & Pay Access only
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
            updated_at: new Date().toISOString()
          })
        });
        console.log(`User ${userId} unlocked Scan & Pay Access via Webhook.`);
      } else {
        if (orderId.includes('yearly')) {
          tier = 'premium_yearly';
          expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
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
        console.log(`User ${userId} upgraded to ${tier} successfully via Webhook.`);
      }
    }

    return res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
