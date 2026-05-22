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
    ]
  },
}

export default nextConfig
