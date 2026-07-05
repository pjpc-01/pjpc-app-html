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

  // WSL2 file watching is unreliable with inotify — use polling to avoid phantom change events
  // that cause constant recompilation and Fast Refresh flicker.

  // Exclude pb_data, .next, node_modules from file watching
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,           // poll every 1s instead of inotify (fixes WSL phantom changes)
        aggregateTimeout: 300, // debounce 300ms before recompile
        ignored: [
          '**/pb_data/**',
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
        ],
      }
    }
    return config
  },

  // Proxy handled by app/api/pocketbase-proxy/[...path]/route.ts with admin auth

  serverExternalPackages: ['googleapis'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
