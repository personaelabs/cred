/** @type {import('next').NextConfig} */
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  transpilePackages: [
    'react-syntax-highlighter',
    'react-native',
  ],
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };


    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;