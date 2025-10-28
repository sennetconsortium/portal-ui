import { resolve } from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Don't render components twice
    turbopack: {
        root: resolve('..'),
        resolveAlias: {
            "@": resolve('./src')
        }
    }
}

export default nextConfig
