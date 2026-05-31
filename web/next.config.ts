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
    // Bloqueia e redireciona o acesso a /docs em produção, a menos que ENABLE_DOCS esteja explicitamente definido como 'true'
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DOCS !== 'true') {
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
