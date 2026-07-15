// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// 👇 نفس القيم اللي في الملف اللي فات بالظبط
firebase.initializeApp({
  apiKey: "AIzaSyBLazJY3Hf1mzuj_ivUDny6SVrN9WvnipI",
  authDomain: "healix-b7e4a.firebaseapp.com",
  projectId: "healix-b7e4a",
  storageBucket: "healix-b7e4a.firebasestorage.app",
  messagingSenderId: "116114050808",
  appId: "1:116114050808:web:b6b00ff5a85e08f091f50d",
  measurementId: "G-N2PRR8K7VC"
});

const messaging = firebase.messaging();

// التعامل مع الإشعار في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png' // أيقونة التطبيق
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});