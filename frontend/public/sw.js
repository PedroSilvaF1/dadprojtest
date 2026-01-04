import { precacheAndRoute } from 'workbox-precaching'

// Register precache manifest injected by Workbox during build.
// Keep the explicit reference so injectManifest can find and replace it.
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('Service Worker active')
  // Claim clients so the SW takes control without a reload
  if (self.clients && self.clients.claim) self.clients.claim()
})

self.addEventListener('push', function (event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Novo Evento!';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/android-chrome-192x192.png', // Ajusta o caminho do ícone
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Se a app já estiver aberta, foca nela
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      // Se não, abre uma nova janela
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
