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
      workbox: {
        // زيادة الحد الأقصى لحجم الملف المسموح بتخزينه في الـ Service Worker إلى 5 ميجابايت
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
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
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    // رفع حد التحذير إلى 1 ميجابايت عشان ميظهرش تحذيرات كتير
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // ─── تقسيم ذكي للكود (Code Splitting) ───
        // كل مكتبة كبيرة بتتحط في ملف منفصل
        // الفايدة: المتصفح بيخزن كل ملف لوحده، ولو غيرت كود التطبيق بس
        // المستخدم مش هيحتاج يحمل المكتبات تاني (لأنها مخزنة عنده)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // ⚠️ مهم جداً: react + react-dom + scheduler لازم يكونوا في نفس الـ chunk
            // عشان scheduler هو dependency داخلي لـ react-dom ولازم يتحمل معاه
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }
            // المكتبات الكبيرة - كل واحدة في chunk منفصل
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('framer-motion')) return 'animations';
            if (id.includes('date-fns')) return 'date-utils';
            // باقي المكتبات الصغيرة في ملف vendor واحد
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['goober']
  }
});