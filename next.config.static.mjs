/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages 静态导出配置
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // 禁用图片优化（静态导出不支持）
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1', 'pjpc.tplinkdns.com'],
  },
  
  // 解决 OpenSSL 兼容性问题
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
  
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
  
  // 优化编译性能
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
