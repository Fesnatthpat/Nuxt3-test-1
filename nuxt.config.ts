// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL, // สาธารณะ
    },
    supabaseKey: process.env.SUPABASE_KEY, // เฉพาะฝั่งเซิร์ฟเวอร์
  },
  

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
