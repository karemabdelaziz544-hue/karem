import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // التحديث التلقائي عند وجود نسخة جديدة
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // ملفات ثابتة للكاش
      manifest: {
        name: 'Healix - منصة الصحة الذكية', // الاسم الكامل
        short_name: 'Healix', // الاسم اللي هيظهر تحت الأيقونة
        description: 'رفيقك الصحي الذكي للأنظمة الغذائية والمتابعة',
        theme_color: '#ffffff', // لون شريط الحالة في الموبايل
        background_color: '#fdfbf7', // لون الخلفية (Cream)
        display: 'standalone', // يفتح كأنه تطبيق (بدون شريط متصفح)
        orientation: 'portrait', // يفضل بالطول
        icons: [
          {
            src: 'pwa-192x192.png', // لازم نوفر الصورة دي (هقولك ازاي تحت)
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // ودي كمان
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // عشان يدعم أشكال الأيقونات المختلفة (دائرة/مربع)
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['goober'] // عشان مشكلة المكتبة اللي ظهرت قبل كده
  }
});