import { getRootURL } from '@/config/config'

const baseUrl = getRootURL().replace(/\/+$/, '')

const staticPages = [
    '/',
    '/search',
    '/search/metadata',
    '/search/files',
    '/ccf-eui',
    '/organs',
    '/discover/integrated-maps'
]

function buildStaticSitemap() {
    const urls = staticPages.map((path) => `<url><loc>${baseUrl}${path}</loc></url>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

function SiteMap() {
    return null
}

export const getServerSideProps = async ({ res }) => {
    const xml = buildStaticSitemap()

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')
    res.write(xml)
    res.end()

    return { props: {} }
}

export default SiteMap
