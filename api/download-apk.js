export default function handler(req, res) {
  if (res && res.redirect) {
    return res.redirect(302, '/zenbudget.apk');
  }
  return new Response(null, {
    status: 302,
    headers: { Location: '/zenbudget.apk' }
  });
}
