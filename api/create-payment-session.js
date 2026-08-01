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
    const { amount, planType, email, phone, userId } = req.body || {};

    if (!amount || !planType || !userId) {
      return res.status(400).json({ error: 'Missing required parameters (amount, planType, userId)' });
    }

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Cashfree API credentials not configured on server.' });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || `usr_${Date.now()}`;
    const orderId = `order_${planType}_${cleanUserId.slice(0, 8)}_${Date.now()}`;

    const validEmail = (email && typeof email === 'string' && email.includes('@') && !email.includes('example.com')) 
      ? email.trim().toLowerCase() 
      : `user_${cleanUserId.slice(0, 8)}@zenbudget.app`;

    const validPhone = (phone && typeof phone === 'string' && phone.replace(/\D/g, '').length === 10)
      ? phone.replace(/\D/g, '')
      : '9876543210';

    const cfResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.error('Cashfree Order Error:', cfData);
      return res.status(cfResponse.status || 500).json({
        error: cfData.message || 'Failed to create Cashfree payment order session.'
      });
    }

    return res.status(200).json({
      payment_session_id: cfData.payment_session_id,
      order_id: orderId
    });
  } catch (err) {
    console.error('Create Payment Session Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
