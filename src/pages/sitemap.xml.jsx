import { getRootURL } from '@/config/config'

const baseUrl = getRootURL().replace(/\/+$/, '')

function SiteMap() {
    return null
}

export const getServerSideProps = async ({ res }) => {
    const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>${baseUrl}/sitemap-dataset.xml</loc></sitemap>
    </sitemapindex>
    `.trim()

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600')
    res.write(xml)
    res.end()

    return { props: {} }
}

export default SiteMap
