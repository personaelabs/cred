/** @type {import('next').NextConfig} */


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

module.exports = nextConfig


