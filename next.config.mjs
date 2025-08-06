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
      // 优化HMR配置 - 减少连接时间
      config.watchOptions = {
        poll: 500, // 减少轮询间隔
        aggregateTimeout: 200, // 减少聚合超时
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist', '**/.cache'],
      }
      
      // 优化编译性能
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
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
        // 减少编译时间
        removeAvailableModules: false,
        removeEmptyChunks: false,
      }
      
      // 优化HMR插件配置
      if (config.plugins) {
        config.plugins.forEach(plugin => {
          if (plugin.constructor.name === 'HotModuleReplacementPlugin') {
            // 优化HMR连接设置
            plugin.options = {
              ...plugin.options,
              multiStep: false, // 禁用多步模式
              fullBuildTimeout: 100, // 减少超时时间
              requestTimeout: 5000, // 减少请求超时
            }
          }
        })
      }
      
      // 添加性能优化
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        },
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
    // 优化编译
    forceSwcTransforms: true,
  },
  // 开发服务器配置
  devIndicators: {
    position: 'bottom-right',
  },
  // 优化编译性能
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 减少构建时间
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
