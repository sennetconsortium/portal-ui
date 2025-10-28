import { resolve } from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Don't render components twice
    webpack: (config, options) => {
        // Set the @ alias for the src directory
        config.resolve.alias['@'] = resolve('.')
        return config
    },
    turbopack: {
        root: resolve('.'),
        resolveAlias: {
            "@": resolve('.')
        }
    }
}

export default nextConfig
