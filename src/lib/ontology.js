import { getUbkgCodes, getUbkgCodesPath, getUbkgEndPoint, getUbkgValuesetPath } from '@/config/config'
import { getJsonHeader } from './services'
import log from 'loglevel'

export async function getOnotologyValueset(code) {
    const valuesetPath = getUbkgValuesetPath()
    const path = getUbkgCodesPath() ? getUbkgCodesPath()[code] : null
    if (!path && !valuesetPath) {
        log.debug(`ONTOLOGY API > Missing UBKG_VALUESET_PATH configuration on code ${code}`)
        return []
    }
    const ep = path ? path : valuesetPath?.replace('{code}', code)
    const url = getUbkgEndPoint() + ep
    const request_options = {
        method: 'GET',
        headers: getJsonHeader()
    }
    const response = await fetch(url, request_options)
    let result = []
    if (response.ok) {
        result = await response.json()
    }
    return result
}

async function getOntologyFromCache(key) {
    let ontology = []
    const url = '/api/ontology/' + key
    try {
        const response = await fetch(url)
        ontology = await response.json()
    } catch (error) {
        console.error(`ONTOLOGY API > ${key} cache not initialized`)
    }
    return ontology
}

function toKeyVal(list, lowerProp = false, key = 'term', key2 = 'term') {
    if (!Array.isArray(list)) return null
    let result = {}
    let prop
    let val
    for (let i of list) {
        prop = i[key]
        val = i[key2]
        prop = prop ? prop.trim() : prop
        val = val ? val.trim() : val
        prop = lowerProp ? prop.toLowerCase() : prop
        result[prop] = val
    }
    return result
}

function add_other(list, key = 'Other') {
    list[key] = 'Other'
    return list
}

export async function getSampleCategories() {
    let list = await getOntologyFromCache(getUbkgCodes().specimen_categories)
    return toKeyVal(list)
}

export async function getDatasetTypes() {
    let list = await getOntologyFromCache(getUbkgCodes().dataset_types) //C000001
    // Filter out 'UNKNOWN' from list
    list = list.filter(dataset_type => dataset_type.dataset_type !== 'UNKNOWN');
    return toKeyVal(list, false, 'dataset_type', 'dataset_type')
}

const uberon_url_base = "http://purl.obolibrary.org/obo/UBERON_"
const fma_url_base = "http://purl.org/sig/ont/fma/fma"

export async function getOrgans() {
    const organs = await getOntologyFromCache(getUbkgCodes().organ_types)
    for (let organ of organs) {
        if (!organ['organ_uberon']) continue

        const [organ_code_type, organ_code] = organ['organ_uberon'].split(':');
        if (organ_code_type.includes("UBERON")) {
            organ["organ_uberon_url"] = uberon_url_base + organ_code
        } else {
            organ["organ_uberon_url"] = fma_url_base + organ_code
        }
    }
    return organs
}

export async function getOrganTypes() {
    let list = await getOntologyFromCache(getUbkgCodes().organ_types)
    list = toKeyVal(list, false,'organ_uberon')
    return add_other(list,'OT')
}

export async function getSourceTypes() {
    let list = await getOntologyFromCache(getUbkgCodes().source_types)
    return toKeyVal(list)
}

export async function getEntities() {
    let list = await getOntologyFromCache(getUbkgCodes().entities)
    // order the list
    list.sort((a, b) => b.code.localeCompare(a.code))
    return toKeyVal(list, true)
}
