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
    config.resolve.fallback = { fs: false, net: false, tls: false };
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

  async redirects() {
  return [
      {
        "source": "/proof/0x01a1925956045684eef6bfa1f10f2ed79f81007d8a6f10baf04230268ccf3559",
        "destination": "/user/test-user",
        "permanent": true
      },
      {
        "source": "/proof/0x614d647f5721da12ac47f95c90c5774525d8059895b29fa356fc8bb2988bc745",
        "destination": "/user/atheartengineer",
        "permanent": true
      },
      {
        "source": "/proof/0xeb3211b6eccf65138e43ce0e4f296b2f9f654a324f8582ab4bac017481992066",
        "destination": "/user/cheekygorilla0x",
        "permanent": true
      },
      {
        "source": "/proof/0x0d4cb65e116e72a384de63602f09799fa0acf41408babf07c887a1f90316025f",
        "destination": "/user/cheekygorilla0x",
        "permanent": true
      },
      {
        "source": "/proof/0x03d4c7a25f3e02b6be93c989d0d3ac86b9c63857ad2e047236a69ff87bf14ff9",
        "destination": "/user/orangemochafrappuccino",
        "permanent": true
      },
      {
        "source": "/proof/0x988f35d4a7edf63ac8704b89e4aefd979c80eee6cf75ce980b5060d68eec2e9d",
        "destination": "/user/billyrennekamp",
        "permanent": true
      },
      {
        "source": "/proof/0x9d1996524a17a6255ae2ca4e72269caa1f77f55e674dfcfac177887842bfc329",
        "destination": "/user/0xlindhquist",
        "permanent": true
      },
      {
        "source": "/proof/0xc52f4527280ac6e6d76d2130b3d43d782d605fbffcfa6b7a8ed2ae8f6302e710",
        "destination": "/user/0x_pixl",
        "permanent": true
      },
      {
        "source": "/proof/0x688bfc2187617ff7d768ad91e030dd56888792b586462b5a0a7be36f59402658",
        "destination": "/user/noun_null",
        "permanent": true
      },
      {
        "source": "/proof/0x7bed8b740b18ec269ac569d982c3d58b22f95fa1d5ac7433140673f12c61897b",
        "destination": "/user/superphiz",
        "permanent": true
      },
      {
        "source": "/proof/0x804b5bf199986eaa41007e99ffbbdc3e16b9df245578becac88c9f5333421116",
        "destination": "/user/superphiz",
        "permanent": true
      },
      {
        "source": "/proof/0x40a354173f6782aea3bc6e9a2f7d3cb1818d9d8df420cee2640ea4aadd0c7c26",
        "destination": "/user/asdf",
        "permanent": true
      },
      {
        "source": "/proof/0x483082e7546b38627f235a48a6161824f857f49b022276cfd44697008525ba1c",
        "destination": "/user/Xofee",
        "permanent": true
      },
      {
        "source": "/proof/0x04d3cc1e6a83608afcb497af8d73b719c5589881c0ad91ded9d911100196873a",
        "destination": "/user/apatriksvensson",
        "permanent": true
      },
      {
        "source": "/proof/0x2c04ef7213f1cde56472217b54b86bc95e612e3421b6f7330cbf61c89a0d487e",
        "destination": "/user/apatriksvensson",
        "permanent": true
      },
      {
        "source": "/proof/0x7fdfff3de350bd138ccf9b372fe46efa641bd6736dc2a91fb791214bbc007723",
        "destination": "/user/apatriksvensson",
        "permanent": true
      }
    ]
  }
};

module.exports = nextConfig;