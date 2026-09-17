// Service Worker for Push Notifications & PWA Web Share Target
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'ZenBudget';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});

// Intercept Web Share Target POST request from Android Gallery / Netbanking apps
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.searchParams.has('shared_receipt')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const receiptFile = formData.get('receipt');
          const sharedText = formData.get('text') || formData.get('title') || '';

          const cache = await caches.open('shared-receipt-cache');

          if (receiptFile && typeof receiptFile !== 'string') {
            await cache.put('/temp-shared-receipt', new Response(receiptFile, {
              headers: { 'content-type': receiptFile.type || 'image/png' }
            }));
          } else if (sharedText) {
            await cache.put('/temp-shared-text', new Response(sharedText, {
              headers: { 'content-type': 'text/plain' }
            }));
          }

          return Response.redirect('/?shared_receipt=ready', 303);
        } catch (err) {
          return Response.redirect('/', 303);
        }
      })()
    );
  }
});
