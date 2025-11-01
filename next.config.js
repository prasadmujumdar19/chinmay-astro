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
  // WORKAROUND: Next.js 16 + Turbopack has a bug loading .env.local automatically
  // This env block reads from .env.local and exposes vars to the client
  // When Turbopack is fixed, this block can be removed
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
};

module.exports = nextConfig;
