/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'output: export' is only needed for production build
  // Commented out for development
  // output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
