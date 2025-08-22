import {
    getDatasetTypes,
    getEntities,
    getOrganTypes,
    getSampleCategories,
    getSourceTypes,
    getOrgans
} from '@/lib/ontology'
import {flipObj} from "@/components/custom/js/functions";

function useCache() {

    const fetchData = async () => {
        const datasetTypes = await getDatasetTypes()
        const sampleCategories = await getSampleCategories()
        const organTypes = await getOrganTypes()
        const entities = await getEntities()
        const sourceTypes = await getSourceTypes()
        const organTypesCodes = flipObj(organTypes)
        const organs = await getOrgans()

        //TODO Remove in the future
        delete entities['publication entity']
        entities.publication = 'Publication'
        entities.collection = 'Collection'
        entities.epicollection = 'Epicollection'
        const cache = {cache: {datasetTypes, sampleCategories, organTypes, entities, sourceTypes, organTypesCodes, organs}}
        window.UBKG_CACHE = cache.cache
        return cache
    }

    return {  fetchData }
}

export default useCache
