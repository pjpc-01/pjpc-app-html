/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true'

const nextConfig = {
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
  }),

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1', 'pjpc.tplinkdns.com'],
  },
  devIndicators: {
    position: 'bottom-right',
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // WSL2 supports native inotify — no polling needed
  // Use Turbopack (npm run dev:fast) for 10x faster HMR in dev

  // Proxy handled by app/api/pocketbase-proxy/[...path]/route.ts with admin auth

  serverExternalPackages: ['googleapis'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
