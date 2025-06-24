// This service worker handles notification events.

// Fired when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  const rootUrl = new URL('/', location).href;
  event.notification.close();
  // This looks for an open window with the app's URL and focuses it.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // If a window is already open, focus it.
      const client = clientList.find((c) => c.url === rootUrl && 'focus' in c);
      if (client) {
        return client.focus();
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(rootUrl);
      }
    })
  );
});

// Fired when the service worker receives a push event from a server.
// This is included for future-proofing, as we currently trigger notifications from the client.
self.addEventListener('push', (event) => {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Rasoi Xpress';
    const options = {
        body: data.body || 'You have a new notification.',
        // An icon can be added here, e.g., icon: '/icon-192x192.png'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});
