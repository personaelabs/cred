/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  scope: '/app',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
      },
    ],
  },
    webpack: (config) => {
      config.externals.push("pino-pretty", "lokijs", "encoding");
      config.experiments = {
        asyncWebAssembly: true,
        layers: true,
      };

      return config;
    }
}

module.exports = withPWA(nextConfig)


// Injected content via Sentry wizard below

module.exports = module.exports;
