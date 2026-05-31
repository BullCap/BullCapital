import { createMDX } from 'fumadocs-mdx/next'
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
  async redirects() {
    // Garante de forma estrita que /docs é redirecionado para 404 em produção
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/docs/:path*',
          destination: '/404',
          permanent: false,
        },
      ]
    }
    return []
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
