import {resolve} from 'path'

import pkg from './package.json' with {type: 'json'};

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Don't render components twice
    env: {
        // Exposes the version of a specific devDependency (e.g., 'tailwindcss')
        NEXT_PUBLIC_VITESSCE_VERSION: pkg['devDependencies']['vitessce']
    },
}

export default nextConfig
