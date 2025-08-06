/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 优化HMR配置
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
      
      // 确保HMR正常工作
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    return config
  },
  // 优化开发服务器配置
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
