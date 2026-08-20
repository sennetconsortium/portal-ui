import { getSearchEndPoint } from '@/config/config'
import fs from 'fs/promises'
import path from 'path'
import process from 'process'

const CACHE_DIR = path.join(process.cwd(), 'cache')
const CACHE_FILE_TEMPLATE = path.join(CACHE_DIR, 'sitemap-<entityType>.xml')
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

async function readSitemapCache(entityType) {
    try {
        const cacheFile = CACHE_FILE_TEMPLATE.replace('<entityType>', entityType.toLowerCase())
        const stat = await fs.stat(cacheFile)
        if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
            return await fs.readFile(cacheFile, 'utf-8')
        }
        // stale
        return null
    } catch {
        // file doesn't exist yet or unreadable
        return null
    }
}

async function writeSitemapCache(xml, entityType) {
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const CACHE_FILE = CACHE_FILE_TEMPLATE.replace('<entityType>', entityType.toLowerCase())
    const tmpFile = `${CACHE_FILE}.${process.pid}.tmp`
    await fs.writeFile(tmpFile, xml)
    await fs.rename(tmpFile, CACHE_FILE)
}

async function fetchAllPublicEntities(entityType) {
    const pageSize = 1000
    let allEntities = []
    let searchAfter = null

    const titleEntityType = entityType[0].toUpperCase() + entityType.slice(1).toLowerCase()

    while (true) {
        const body = {
            query: { term: { 'entity_type.keyword': titleEntityType } },
            size: pageSize,
            sort: [{ 'uuid.keyword': 'asc' }],
            _source: { includes: ['uuid', 'last_modified_timestamp'] }
        }
        if (searchAfter) {
            body.search_after = searchAfter
        }

        // Do not add Authorization header here, we want the public index
        const res = await fetch(`${getSearchEndPoint()}entities/search`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) {
            throw new Error(`Failed to fetch public ${entityType} for sitemap (HTTP ${res.status})`)
        }

        const content = await res.json()
        const hits = content.hits?.hits || []
        if (!hits.length) {
            break
        }

        allEntities.push(
            ...hits.map((hit) => ({
                uuid: hit._source.uuid,
                lastModifiedTimestamp: hit._source.last_modified_timestamp
            }))
        )

        if (hits.length < pageSize) {
            break
        }
        searchAfter = hits[hits.length - 1].sort
    }

    return allEntities
}

function buildSitemapXml(datasets, baseUrl, entityType) {
    const urls = datasets
        .map(({ uuid, lastModifiedTimestamp }) => {
            const loc = `${baseUrl}/${entityType.toLowerCase()}?uuid=${uuid}`
            const lastMod = lastModifiedTimestamp
                ? new Date(lastModifiedTimestamp).toISOString().split('T')[0]
                : null
            return `\t<url><loc>${loc}</loc>${lastMod ? `<lastmod>${lastMod}</lastmod>` : ''}</url>`
        })
        .join('\n')

    return `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
    </urlset>
    `.trim()
}

export const getPublicEntitiesSitemap = async (baseUrl, entityType, forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = await readSitemapCache(entityType)
        if (cached) {
            return cached
        }
    }

    const datasets = await fetchAllPublicEntities(entityType)
    const xml = buildSitemapXml(datasets, baseUrl, entityType)

    await writeSitemapCache(xml, entityType)
    return xml
}
