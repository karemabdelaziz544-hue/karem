import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 👇 استبدل القيم دي بالبيانات اللي ظهرتلك في فايربيس (Project Settings -> General)
const firebaseConfig = {
    apiKey: "AIzaSyBLazJY3Hf1mzuj_ivUDny6SVrN9WvnipI",
  authDomain: "healix-b7e4a.firebaseapp.com",
  projectId: "healix-b7e4a",
  storageBucket: "healix-b7e4a.firebasestorage.app",
  messagingSenderId: "116114050808",
  appId: "1:116114050808:web:b6b00ff5a85e08f091f50d",
  measurementId: "G-N2PRR8K7VC"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// دالة طلب الإذن والحصول على التوكن
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 👇 هنا حط الـ VAPID Key اللي جبته من Cloud Messaging Tab
      const token = await getToken(messaging, { 
        vapidKey: "BKkPV9NkV4052gP0FctyVKDFEj_OiBWzdIUYmwzoYkM230KI5qabzXMyqe2_5OH3yumgJrkyqDvJA2SYbbu0ijs" 
      });
      return token;
    } else {
      console.log("Permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error getting token", error);
    return null;
  }
};

// الاستماع للرسائل والتطبيق مفتوح
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });