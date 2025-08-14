/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@modular-ai-scaffold/core']
  },
  env: {
    ENABLE_SUPABASE: process.env.ENABLE_SUPABASE,
    ENABLE_DATABASE: process.env.ENABLE_DATABASE
  }
};

module.exports = nextConfig;