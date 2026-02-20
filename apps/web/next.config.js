/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared @dsgvo/db package (TypeScript source)
  transpilePackages: ['@dsgvo/db'],
}

module.exports = nextConfig
