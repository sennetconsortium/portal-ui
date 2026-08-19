import { getSearchEndPoint } from '@/config/config'
import fs from 'fs/promises'
import path from 'path'
import process from 'process'

const CACHE_DIR = path.join(process.cwd(), 'cache')
const CACHE_FILE = path.join(CACHE_DIR, 'sitemap-dataset.xml')
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

async function readSitemapCache() {
    try {
        const stat = await fs.stat(CACHE_FILE)
        if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
            return await fs.readFile(CACHE_FILE, 'utf-8')
        }
        // stale
        return null
    } catch {
        // file doesn't exist yet or unreadable
        return null
    }
}

async function writeSitemapCache(xml) {
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const tmpFile = `${CACHE_FILE}.${process.pid}.tmp`
    await fs.writeFile(tmpFile, xml)
    await fs.rename(tmpFile, CACHE_FILE)
}

async function fetchAllPublicDatasets() {
    const pageSize = 1000
    let allDatasets = []
    let searchAfter = null

    while (true) {
        const body = {
            query: { term: { 'status.keyword': 'Published' } },
            size: pageSize,
            sort: [{ 'uuid.keyword': 'asc' }],
            _source: { includes: ['uuid', 'last_modified_timestamp'] }
        }
        if (searchAfter) {
            body.search_after = searchAfter
        }

        const res = await fetch(`${getSearchEndPoint()}entities/search`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) {
            break
        }

        const content = await res.json()
        const hits = content.hits?.hits || []
        if (!hits.length) {
            break
        }

        allDatasets.push(
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

    return allDatasets
}

function buildSitemapXml(datasets, baseUrl) {
    const urls = datasets
        .map(({ uuid, lastModifiedTimestamp }) => {
            const loc = `${baseUrl}/dataset?uuid=${uuid}`
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

export const getPublicDatasetsSitemap = async (baseUrl, forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = await readSitemapCache()
        if (cached) {
            return cached
        }
    }

    const datasets = await fetchAllPublicDatasets()
    const xml = buildSitemapXml(datasets, baseUrl)

    await writeSitemapCache(xml)
    return xml
}
