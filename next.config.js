/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'output: export' is only needed for production build
  // Commented out for development to allow proper .env.local loading
  // output: 'export',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Explicitly expose environment variables to the client
  // Hardcoded for development due to .env file loading issues
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyC-IQNeWu8Fs_ktyxtQGLkAG_mjVA470_I',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'chinmay-astro-c685b.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'chinmay-astro-c685b',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'chinmay-astro-c685b.firebasestorage.app',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '300957221965',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:300957221965:web:20545cb5811a4e37784804',
  },
};

module.exports = nextConfig;
