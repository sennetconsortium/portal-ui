import { getCookie } from 'cookies-next';
import { cloneDeep } from 'lodash';
import { APP_ROUTES } from './constants';
import { SEARCH_ENTITIES } from "./search/entities";

export const APP_TITLE = 'Data Sharing Portal'
export const NAVBAR_TITLE = 'SenNet'

export const FILE_KEY_SEPARATOR = '_:_'

// Set this to be the time in milliseconds
export const IDLE_TIMEOUT = 1000 * 60 * 60

export function getLogLevel() {
    return process.env.NEXT_PUBLIC_LOG_LEVEL;
}

export function getAuth() {
    if (typeof window !== 'undefined') {
        return getCookie('groups_token')
    }
    return ''
}

export const supportedRuiSources = ['Human', 'Human Organoid']

export const lateralOrgans = ['Breast', 'Kidney', 'Lung', 'Mammary Gland', 'Ovary', 'Tonsil']

// Organs not supported by the CCF-RUI Tool are:
// Adipose, Blood, Bone Marrow, Breast, Muscle, and Other
export function supportedRuiOrgans() {
    return window.UBKG_CACHE.organs
        .filter((o) => o['rui_supported'] === true)
        .map((o) => o['organ_uberon'])
}

export function valuesRuiSupported(values, dict) {
    try {
        if (values.length > 0) {
            const supported = (value) => dict.includes(value);
            return values.some(supported)
        }
    } catch (e) {
        console.error(e)
    }
    return false
}

export function isOrganRuiSupported(organs) {
    return valuesRuiSupported(organs, supportedRuiOrgans())
}

export function isSampleRuiSupported(samples) {
    return valuesRuiSupported(samples, supportedRuiSources)
}

export function isRuiSupported(organs, sources) {
    return isOrganRuiSupported(organs) && isSampleRuiSupported(sources)
}

export function getUserName() {
    const info = atob(getCookie('info'))
    return JSON.parse(info).name
}

export function getUserEmail() {
    const info = atob(getCookie('info'))
    return JSON.parse(info).email
}

export function getCellTypesIndex() {
    return process.env.NEXT_PUBLIC_CELL_TYPES_INDEX
}

export function getEntitiesIndex() {
    return process.env.NEXT_PUBLIC_ENTITIES_INDEX
}

export function getFilesIndex() {
    return process.env.NEXT_PUBLIC_FILES_INDEX
}

// points to the search-api endpoint
export function getSearchEndPoint() {
    return process.env.NEXT_PUBLIC_SEARCH_API_ENDPOINT
}

export function getUbkgEndPoint() {
    return process.env.NEXT_PUBLIC_UBKG_API_ENDPOINT
}

export function getUbkgValuesetPath() {
    return process.env.NEXT_PUBLIC_UBKG_VALUESET_PATH
}

export function getUbkgCodes() {
    return JSON.parse(process.env.NEXT_PUBLIC_UBKG_CODES)
}

export function getUbkgCodesPath() {
    return JSON.parse(process.env.NEXT_PUBLIC_UBKG_CODES_PATHS)
}

export function getEntityEndPoint() {
    return process.env.NEXT_PUBLIC_ENTITY_API_ENDPOINT
}

export function getIngestEndPoint() {
    return process.env.NEXT_PUBLIC_INGEST_API_ENDPOINT
}

export function getIngestLogin() {
    return process.env.NEXT_PUBLIC_INGEST_LOGIN
}

export function getUUIDEndpoint() {
    return process.env.NEXT_PUBLIC_UUID_API_ENDPOINT
}

export function getAssetsEndpoint() {
    return process.env.NEXT_PUBLIC_ASSETS_ENDPOINT
}

export function getDataIngestBoardEndpoint() {
    return process.env.NEXT_PUBLIC_DATA_INGEST_BOARD_ENDPOINT
}

export function getRootURL() {
    return process.env.NEXT_PUBLIC_APP_ROOT_URL
}

export function getDocsRootURL() {
    return process.env.NEXT_PUBLIC_DOCS_ROOT_URL
}

export function getLogoutURL() {
    return getIngestEndPoint() + APP_ROUTES.logout.slice(1)
}

export function getGoogleTagManagerId() {
    return process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER
}

export function getCookieDomain() {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN
}

export const RESULTS_PER_PAGE = [10, 20, 30, 50, 100, 250, 500]

//Config options to exclude datasets from results
export let ancestor_config = cloneDeep(SEARCH_ENTITIES)
ancestor_config['trackUrlState'] = false;

export let valid_dataset_ancestor_config = cloneDeep(ancestor_config)

export let exclude_dataset_config = cloneDeep(ancestor_config);
exclude_dataset_config['searchQuery']['excludeFilters'].push(
    {
        type: 'term',
        field: 'entity_type.keyword',
        values: ['Collection', 'Dataset', 'Upload', 'Publication', 'Epicollection']
    }
)

export function FilterIsSelected(fieldName, value) {
    return ({filters, aggregations}) => {
        for (const filter of filters) {
            if (filter.field === fieldName && filter.values.includes(value)) {
                return true
            }
        }
        return false
    }
}

export const STORAGE_KEY = (key = '') => `sn-portal.${key}`

export const COLS_ORDER_KEY = (context = '') => `${context}.columnsOrder`

export function doesTermFilterContainValues(name, values) {
    return (filters, auth) => {
        const filter = filters.find((f) => f.field === name)
        return (
            filter != undefined && values.some((v) => filter.values.includes(v))
        )
    }
}

export function doFiltersContainField(field) {
    return (filters, auth) => {
        return filters.some((f) => f.field === field)
    }
}

export function doesAggregationHaveBuckets(field) {
    return (filters, aggregations, auth) => {
        try {
            return (
                aggregations[field] !== undefined && aggregations[field].buckets.length > 0
            )
        } catch {
            return false
        }
    }
}

export function doesTermOptionHaveDocCount(option, filters, aggregations, auth) {
    return option.doc_count > 0
}

export function isDateFacetVisible(filters, aggregations, auth) {
    return Object.keys(aggregations).length > 0
}