import { getRootURL } from '@/config/config'

const DEFAULT_CONFIG = {
    baseUrl: getRootURL().replace(/\/+$/, ''),
    consortiumName: 'SenNet'
}

export function getCanonicalUrl(entity) {
    if (!entity) {
        return undefined
    }
    const { baseUrl } = DEFAULT_CONFIG
    if (entity.uuid && entity.entity_type) {
        return `${baseUrl}/${entity.entity_type.toLowerCase()}?uuid=${entity.uuid}`
    }
    return undefined
}

export function getJsonLDMetaData(dataset, citation) {
    if (!dataset) {
        return undefined
    }

    const { baseUrl, consortiumName } = DEFAULT_CONFIG

    const meta = {
        '@context': 'https://schema.org/',
        '@type': 'Dataset',
        funder: {
            '@type': 'Organization',
            name: 'NIH Common Fund',
            sameAs: 'https://ror.org/001d55x84'
        },
        license: 'https://creativecommons.org/licenses/by/4.0/',
        isAccessibleForFree: true,
        includedInDataCatalog: {
            '@type': 'DataCatalog',
            name: 'SenNet Data Sharing Portal',
            url: baseUrl
        },
        identifier: []
    }

    if (dataset.title) {
        meta.name = dataset.title
    }
    if (dataset.description) {
        meta.description = dataset.description
    }
    if (dataset.uuid) {
        meta.url = `${baseUrl}/dataset?uuid=${dataset.uuid}`
    }
    if (dataset.sennet_id) {
        meta.identifier.push(dataset.sennet_id)
    }
    if (dataset.doi_url) {
        meta.identifier.push(dataset.doi_url)
        meta.sameAs = dataset.doi_url
    }
    if (!meta.identifier.length) {
        delete meta.identifier
    }
    if (citation) {
        meta.citation = citation
    }

    // creator
    const people = [...(dataset.contacts || []), ...(dataset.contributors || [])]
    const seenOrcids = new Set()
    const creators = []
    for (const person of people) {
        const key = person.orcid || person.display_name
        if (!key || seenOrcids.has(key)) continue
        seenOrcids.add(key)
        creators.push(toPersonCreator(person))
    }
    if (dataset.group_name) {
        creators.push({ '@type': 'Organization', name: dataset.group_name })
    }
    if (creators.length) {
        meta.creator = creators
    }

    const datePublished = toIsoDate(dataset.published_timestamp)
    if (datePublished) {
        meta.datePublished = datePublished
    }
    const dateModified = toIsoDate(dataset.last_modified_timestamp)
    if (dateModified) {
        meta.dateModified = dateModified
    }

    // keywords - consortium name, organ(s), all dataset_type_hierarchy
    const keywords = new Set()

    // organs keywords
    if (dataset.origin_samples && dataset.origin_samples.length) {
        for (const sample of dataset.origin_samples) {
            if (sample.organ_hierarchy) {
                keywords.add(sample.organ_hierarchy)
            }
        }
    }

    // dataset_type_hierarchy keywords
    if (dataset.dataset_type_hierarchy && dataset.dataset_type_hierarchy.length) {
        for (const hierarchy of dataset.dataset_type_hierarchy) {
            const { analyte, dataset_type, modality } = hierarchy
            if (analyte) {
                keywords.add(analyte)
            }
            if (dataset_type) {
                keywords.add(dataset_type)
            }
            if (modality) {
                keywords.add(modality)
            }
        }
    }

    keywords.add(consortiumName)
    meta.keywords = Array.from(keywords)

    // measurementTechnique - dataset type
    if (dataset.dataset_type) {
        meta.measurementTechnique = dataset.dataset_type
    }

    return meta
}

function toIsoDate(timestampMs) {
    if (!timestampMs) {
        return undefined
    }
    const date = new Date(Number(timestampMs))
    if (isNaN(date.getTime())) {
        return undefined
    }
    return date.toISOString().slice(0, 10)
}

function toPersonCreator(person) {
    const creator = {
        '@type': 'Person',
        name: person.display_name
    }
    if (person.first_name) {
        creator.givenName = person.first_name
    }
    if (person.last_name) {
        creator.familyName = person.last_name
    }
    if (person.orcid) {
        creator.sameAs = `https://orcid.org/${person.orcid}`
    }
    if (person.affiliation) {
        creator.affiliation = { '@type': 'Organization', name: person.affiliation }
    }
    return creator
}
