import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import critters from 'critters';

export default defineConfig({
  site: 'https://sunwevehicle.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/'),
      customPages: [
        'https://sunwevehicle.com/',
        'https://sunwevehicle.com/products',
        'https://sunwevehicle.com/about-us',
        'https://sunwevehicle.com/contact',
        'https://sunwevehicle.com/videos',
        'https://sunwevehicle.com/blog',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    })
  ],
  
  // i18n configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'es', 'ar', 'fr', 'ru'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  
  // Vite configuration
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': [],
          },
        },
      },
    },
  },

  // Build options - inline stylesheets to avoid render-blocking
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  
  // Server options
  server: {
    port: 4321,
    host: true,
  },
});
