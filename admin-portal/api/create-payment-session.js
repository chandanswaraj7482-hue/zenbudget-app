export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, planType, email, phone, userId, clientId: clientCustomId, clientSecret: clientCustomSecret } = req.body || {};

    if (!amount || !planType || !userId) {
      return res.status(400).json({ error: 'Missing required parameters (amount, planType, userId)' });
    }

    const clientId = clientCustomId || process.env.CASHFREE_CLIENT_ID || 'CF1070560C9TH63S1RMCV439KGL0';
    const clientSecret = clientCustomSecret || process.env.CASHFREE_CLIENT_SECRET || 'cfsk_ma_prod_3716d13db1b74704c7ef2b0125867160_51341c30';

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || `usr_${Date.now()}`;
    const orderId = `order_${planType}_${cleanUserId.slice(0, 8)}_${Date.now()}`;

    const validEmail = (email && typeof email === 'string' && email.includes('@') && !email.includes('example.com')) 
      ? email.trim().toLowerCase() 
      : `user_${cleanUserId.slice(0, 8)}@zenbudget.app`;

    const validPhone = (phone && typeof phone === 'string' && phone.replace(/\D/g, '').length === 10)
      ? phone.replace(/\D/g, '')
      : '9876543210';

    const payload = JSON.stringify({
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: cleanUserId,
        customer_phone: validPhone,
        customer_email: validEmail
      },
      order_meta: {
        return_url: `https://zenbudget-tracker.vercel.app/pay.html?session_id={order.payment_session_id}&status={order.order_status}`,
        notify_url: 'https://admin-portal-zenbudget.vercel.app/api/cashfree-webhook'
      }
    });

    const headers = {
      'x-api-version': '2023-08-01',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'Content-Type': 'application/json'
    };

    // 1. Try Cashfree Production API
    let cfResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers,
      body: payload
    });

    let cfData = await cfResponse.json();

    // 2. If Production returns auth error, fallback to Cashfree Sandbox API
    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.warn('Production Cashfree error, trying Sandbox...', cfData);
      const sandboxResponse = await fetch('https://sandbox.cashfree.com/pg/orders', {
        method: 'POST',
        headers,
        body: payload
      });
      const sandboxData = await sandboxResponse.json();
      if (sandboxResponse.ok && sandboxData.payment_session_id) {
        return res.status(200).json({
          payment_session_id: sandboxData.payment_session_id,
          order_id: orderId,
          environment: 'sandbox'
        });
      }
    }

    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.error('Cashfree Order Error:', cfData);
      return res.status(cfResponse.status || 500).json({
        error: cfData.message || 'Failed to create Cashfree payment order session.',
        code: cfData.code,
        type: cfData.type,
        is_auth_error: cfData.message?.toLowerCase().includes('authentication') || cfData.code === 'request_failed'
      });
    }

    return res.status(200).json({
      payment_session_id: cfData.payment_session_id,
      order_id: orderId,
      environment: 'production'
    });
  } catch (err) {
    console.error('Create Payment Session Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
