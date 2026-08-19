import { getRootURL } from '@/config/config'
import { getPublicDatasetsSitemap } from '@/lib/sitemap'

const baseUrl = getRootURL().replace(/\/+$/, '')

function SiteMap() {
    return null
}

export const getServerSideProps = async ({ res }) => {
    const xml = await getPublicDatasetsSitemap(baseUrl)

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.write(xml)
    res.end()

    return { props: {} }
}

export default SiteMap
