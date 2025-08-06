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
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist'],
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
      
      // 添加HMR插件配置
      if (config.plugins) {
        config.plugins.forEach(plugin => {
          if (plugin.constructor.name === 'HotModuleReplacementPlugin') {
            // 确保HMR插件正确配置
            plugin.options = {
              ...plugin.options,
              multiStep: true,
              fullBuildTimeout: 200,
              requestTimeout: 10000,
            }
          }
        })
      }
    }
    
    return config
  },
  // 优化开发服务器配置
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // 启用更快的编译
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // 开发服务器配置
  devIndicators: {
    position: 'bottom-right',
  },
}

export default nextConfig
