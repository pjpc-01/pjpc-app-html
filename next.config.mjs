/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用HTTPS开发环境
  experimental: {
    https: true,
  },
  // 解决 OpenSSL 兼容性问题
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
  
  // HTTPS 配置 - 移除不支持的配置
  // 注意：Next.js 15 不支持 server.https 配置，需要使用自定义服务器
  // 设置 Node.js 选项
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 为服务器端添加 Node.js 选项
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1'],
  },
  // 优化HMR配置 - 减少连接时间
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // 增加轮询间隔到1秒
        aggregateTimeout: 500, // 增加聚合超时到500ms
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist', '**/.cache', '**/public', '**/*.log'],
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
              fullBuildTimeout: 200, // 增加超时时间
              requestTimeout: 10000, // 增加请求超时
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
