import {
    getDatasetTypes,
    getEntities,
    getOrganTypes,
    getSampleCategories,
    getSourceTypes,
    getOrgans
} from '@/lib/ontology'

import { flipObj } from '@/components/custom/js/functions'

export async function loadUBKGCache() {
    const datasetTypes = await getDatasetTypes()
    const sampleCategories = await getSampleCategories()
    const organTypes = await getOrganTypes()
    const entities = await getEntities()
    const sourceTypes = await getSourceTypes()
    const organTypesCodes = flipObj(organTypes)
    const organs = await getOrgans()

    delete entities['publication entity']
    entities.publication = 'Publication'
    entities.collection = 'Collection'
    entities.epicollection = 'Epicollection'

    const cache = {
        datasetTypes,
        sampleCategories,
        organTypes,
        entities,
        sourceTypes,
        organTypesCodes,
        organs
    }

    if (typeof window !== 'undefined') {
        window.UBKG_CACHE = cache
    }

    return cache
}