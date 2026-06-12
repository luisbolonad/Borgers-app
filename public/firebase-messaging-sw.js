importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCa3uBxgNYxlvrVC3c9SBC6aacoYLbJ034",
  authDomain: "borgers-gestion.firebaseapp.com",
  projectId: "borgers-gestion",
  storageBucket: "borgers-gestion.firebasestorage.app",
  messagingSenderId: "323571353423",
  appId: "1:323571353423:web:78b957623b941d1265a73a"
});

const messaging = firebase.messaging();

// Maneja notificaciones cuando la app está en segundo plano o cerrada
messaging.onBackgroundMessage(function(payload) {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Borgers", {
    body: body || "",
    icon: icon || "/favicon.png",
    badge: "/favicon.png",
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true
  });
});

// Al tocar la notificación, abre la app
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
