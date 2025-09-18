import path from 'node:path'

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
  webpack(config) {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@headlessui/react': path.join(process.cwd(), 'lib', 'headlessui.tsx'),
      'motion/react': path.join(process.cwd(), 'lib', 'motion.tsx'),
    }

    return config
  },
}

export default nextConfig
