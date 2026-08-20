import { getRootURL } from '@/config/config'
import { getPublicEntitiesSitemap } from '@/lib/sitemap'

const baseUrl = getRootURL().replace(/\/+$/, '')
const supportedEntityTypes = ['dataset', 'sample', 'source', 'collection', 'publication']

function SiteMap() {
    return null
}

export const getServerSideProps = async ({ res, params }) => {
    const { entityType } = params
    console.log('===============', entityType)
    if (!entityType.endsWith('.xml')) {
        return { notFound: true }
    }

    const entityTypeWithoutExtension = entityType.replace(/\.xml$/, '')
    if (!supportedEntityTypes.includes(entityTypeWithoutExtension)) {
        return { notFound: true }
    }

    const xml = await getPublicEntitiesSitemap(baseUrl, entityTypeWithoutExtension)

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600')
    res.write(xml)
    res.end()

    return { props: {} }
}

export default SiteMap
