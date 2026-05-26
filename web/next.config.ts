import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm'],
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</manifest.json>; rel=manifest',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
