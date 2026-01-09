/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['fazgame.com.br'],
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@upstash/redis']
  },
  // Remove standalone e deixar padrão
}

module.exports = nextConfig
