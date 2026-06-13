import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage as fbOnMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCa3uBxgNYxlvrVC3c9SBC6aacoYLbJ034",
  authDomain: "borgers-gestion.firebaseapp.com",
  projectId: "borgers-gestion",
  storageBucket: "borgers-gestion.firebasestorage.app",
  messagingSenderId: "323571353423",
  appId: "1:323571353423:web:78b957623b941d1265a73a",
  measurementId: "G-14GQS6Q4TY"
};

const VAPID_KEY = "BI3v9cWEBIw9y4BrfReYMsVquYReJpJj6b9sqUO4TDIFs3BvXnv4WcvHAGZeizfiJWUDmHpTPhhkkUIsWDpTWdI";

let messaging = null;
try {
  const app = initializeApp(firebaseConfig);
  if ("serviceWorker" in navigator && "Notification" in window) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn("Firebase messaging no disponible:", e.message);
}

export { messaging };

export async function requestNotificationPermission() {
  try {
    if (!("Notification" in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    if (!messaging) return null;
    const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
    return token;
  } catch (e) {
    console.error("Error FCM:", e.message);
    return null;
  }
}

export function onMessage(msg, callback) {
  if (!msg) return () => {};
  try { return fbOnMessage(msg, callback); }
  catch (e) { return () => {}; }
}
