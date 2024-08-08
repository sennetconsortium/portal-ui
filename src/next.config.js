const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Don't render components twice
    webpack: (config, options) => {
        // Set the @ alias for the src directory
        config.resolve.alias['search-ui'] = path.resolve(__dirname, 'search-ui', 'src')
        config.resolve.alias['@'] = path.resolve(__dirname)
        return config
    }
}

module.exports = nextConfig
