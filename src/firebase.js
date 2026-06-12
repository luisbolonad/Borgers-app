import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (e) {
    console.error("Error obteniendo token FCM:", e);
    return null;
  }
}

export { onMessage };
