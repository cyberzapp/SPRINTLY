import type { NextRequest } from "next/server";

/**
 * Serves the FCM service worker. Firebase config is passed via query string
 * at registration time (public, non-secret values), so no build-time
 * templating of a static file is needed.
 */
export function GET(_req: NextRequest) {
  const js = `
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Sprintly";
  const options = {
    body: (payload.notification && payload.notification.body) || "",
    icon: "/icon.svg",
    data: { link: (payload.data && payload.data.link) || "/app/inbox" },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/app/inbox";
  event.waitUntil(clients.openWindow(link));
});
`;
  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache",
    },
  });
}
