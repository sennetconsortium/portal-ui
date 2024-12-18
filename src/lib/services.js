import {getHeaders} from "@/components/custom/js/functions";
import {
    getAssetsEndpoint,
    getAuth,
    getEntityEndPoint,
    getIngestEndPoint,
    getSearchEndPoint,
    getUUIDEndpoint
} from "@/config/config";
import {getCookie} from "cookies-next";
import log from "loglevel";
import {SEARCH_ENTITIES} from "../config/search/entities";

//////////////////////
// Set header functions
//////////////////////
export function get_headers_from_req(reqHeaders, headers) {
    headers = headers || new Headers();
    for (let h in reqHeaders) {
        headers.set(h.upperCaseFirst(), reqHeaders[h])
    }
    return headers;
}

export function get_json_header(headers) {
    headers = headers || new Headers();
    headers.append("Content-Type", "application/json");
    return headers;
}

export function get_auth_header(ops = {}) {
    const headers = new Headers();
    try {
        let auth = getAuth()
        auth = (!auth || !auth.length) ? getCookie('groups_token', ops) : auth
        if (auth)
            headers.append("Authorization", "Bearer " + auth)
    } catch (e) {
        console.error(e)
    }
    return headers;
}

export function get_x_sennet_header(headers) {
    headers = headers || new Headers();
    headers.append('X-SenNet-Application', 'portal-ui')
    return headers
}

export function get_headers() {
    const headers = get_auth_header();
    return get_json_header(headers);
}

export async function callService(raw, url, method, headers) {
    headers = headers ? headers : get_headers()
    return await fetch(url, {
        method: method,
        headers: headers,
        body: raw,
    }).then(response => response.json())
        .then(result => {
            log.info(result)
            return result;
        }).catch(error => {
            log.error('error', error)
            return error;
        });
}

export function parseJson(json) {
    if (typeof json === 'string' || json instanceof String) {
        if (json === '') {
            return null
        }
        return JSON.parse(json)
    } else {
        return json
    }
}

//////////////////////
// Register/Update Entities
//////////////////////
// After creating or updating an entity, send to Entity API. Search API will be triggered during this process automatically
export async function update_create_entity(uuid, body, action = "Edit", entity_type = null) {
    let headers = get_headers()
    headers = get_x_sennet_header(headers)
    let raw = JSON.stringify(body)
    let url = getEntityEndPoint() + "entities/" + (action === 'Register' ? entity_type : uuid + '?return_dict=true')
    let method = (action === 'Register' ? "POST" : "PUT")

    return callService(raw, url, method, headers)
}

export async function update_create_dataset(uuid, body, action = "Edit", entityType = 'datasets') {
    if (action === 'Edit') {
        return update_create_entity(uuid, body, action, null);
    } else {
        let raw = JSON.stringify(body)
        let url = getIngestEndPoint() + entityType + (action === 'Register' ? '' : `/${uuid}/${action}`)
        let method = (action === 'Register' ? "POST" : "PUT")
        log.debug(url)

        return callService(raw, url, method)
    }
}

//////////////////////
// Check privileges
//////////////////////
export async function get_read_write_privileges() {
    log.info('GET READ WRITE PRIVILEGES')
    const url = getIngestEndPoint() + 'privs'
    const request_options = {
        method: 'GET',
        headers: get_headers()
    }
    try {
        const response = await fetch(url, request_options)
        if (!response.ok) {
            return {
                "read_privs": false,
                "write_privs": false
            };
        }
        let json = response.json()
        return await json
    } catch (e) {
        console.error(e)
    }
}

export async function call_ingest_service(path, base='privs/') {
    const url = getIngestEndPoint() + base + path;
    const request_options = {
        method: 'GET',
        headers: get_headers()
    }
    try {
        const response = await fetch(url, request_options)
        if (!response.ok) {
            return {status: response.status, statusText: response.statusText}
        } else {
            let json = response.json()
            log.debug(json)
            return await json
        }

    } catch (e) {
        console.error(e)
    }
}

export async function has_data_admin_privs() {
    log.debug('FETCHING DATA ADMIN PRIVS')
    return await call_ingest_service('has-data-admin')
}

export async function get_write_privilege_for_group_uuid(group_uuid) {
    log.debug('GET WRITE PRIVILEGE FOR GROUP UUID')
    return await call_ingest_service(group_uuid + '/has-write')
}

export async function get_user_write_groups() {
    log.debug('FETCHING USER WRITE GROUPS')
    return await call_ingest_service('user-write-groups')
}

export async function get_provider_groups() {
    log.debug('FETCHING Provider GROUPS')
    return await call_ingest_service('data-provider-groups', 'metadata/')
}


//////////////////////
// Entity API Requests
//////////////////////
export async function fetch_entity_api(url) {
    let headers = get_auth_header()
    const request_options = {
        method: 'GET',
        headers: headers
    }

    return await fetch(url, request_options)
}

export async function get_prov_info(dataset_uuid) {
    const url = getEntityEndPoint() + "datasets/" + dataset_uuid + "/prov-info?format=json"
    let result = callService(null, url, 'GET', get_auth_header())
    if ("error" in result) {
        return {}
    }
    return result
}

export async function get_lineage_info(entity_uuid, lineage_descriptor) {
    const url = getEntityEndPoint() + lineage_descriptor + "/" + entity_uuid
    const result = fetch_entity_api(url)
    if ("error" in result) {
        return []
    }
    return result
}

export async function fetch_globus_filepath(sennet_id) {
    const url = getEntityEndPoint() + "entities/" + sennet_id + "/globus-url"
    const response = await fetch_entity_api(url)
    const filepath = await response.text();
    return {status: response.status, filepath: filepath};
}


export async function fetch_pipeline_message(dataset_uuid, entity_type) {
    let endpoint = "pipeline-message"
    if (entity_type === 'Upload') {
        endpoint = 'validation-message'
    }
    const url = getEntityEndPoint() + "entities/" + dataset_uuid + "/" + endpoint
    const response = await fetch_entity_api(url)
    return await response.text();
}

//////////////////////

export async function check_valid_token() {
    const token = getAuth();
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + token)

    try {
        const res = await fetch("/api/auth/token", {
            method: 'GET',
            headers: headers
        });
        const status = res.status
        return status == 200;
    } catch {
        return false
    }
}

// This function requires the bearer token passed to it as the middleware can't access "getAuth()"
export async function fetch_entity_type(uuid, bearer_token) {
    const headers = get_auth_header();
    const url = getUUIDEndpoint() + "uuid/" + uuid
    const request_options = {
        method: 'GET',
        headers: headers
    }
    const response = await fetch(url, request_options)
    if (response.status === 200) {
        const entity = await response.json();
        return (entity["type"]).toLowerCase();

    } else if (response.status === 400) {
        return "404";
    } else {
        return response.status.toString()
    }
}

export async function getAncestryData(uuid, ops = {endpoints: ['ancestors', 'descendants'], otherEndpoints: []}) {
    const ancestryPromises = getAncestry(uuid, ops)
    const promiseSettled = await Promise.allSettled([...Object.values(ancestryPromises)])
    let _data = {};
    let i = 0;
    for (let key of Object.keys(ancestryPromises)) {
        _data[key] = promiseSettled[i].value;
        i++;
    }
    return _data;
}

export function getAncestry(uuid, {endpoints = ['ancestors', 'descendants'], otherEndpoints = []}) {
    const propertyNameMap = {
        'immediate_ancestors': 'parents',
        'immediate_descendants': 'children'
    }
    const allEndpoints = endpoints.concat(otherEndpoints)
    let result = {}
    for (let key of allEndpoints) {
        let endpoint = propertyNameMap[key] || key
        result[key] = callService(null, `${getEntityEndPoint()}${endpoint}/${uuid}`)
    }
    return result
}

export async function getEntityData(uuid, exclude_properties = []) {
    let url = "/api/find?uuid=" + uuid
    if (exclude_properties && exclude_properties.length > 0) {
        url += "&exclude_properties=" + encodeURIComponent(exclude_properties.join(','))
    }
    return await callService(null, url, 'GET', getHeaders())
}


export async function getJSONFromAssetsEndpoint(path) {
    if (path.startsWith('/')) {
        path = path.substring(1)
    }
    const token = getAuth()
    const tokenParam = token ? `?token=${token}` : ''
    const assetsUrl = getAssetsEndpoint() + path + tokenParam
    return callService(null, assetsUrl, 'GET', null)
}

export async function getProvenanceMetadata(uuid) {
    let url = getIngestEndPoint() + `metadata/provenance-metadata/${uuid}`
    return callService(null, url, 'GET', getHeaders())
}

export const uploadFile = async file => {
    const formData = new FormData()
    formData.append('file', file)
    const requestOptions = {
        headers: get_auth_header(),
        method: 'POST',
        body: formData
    }
    try {
        const response = await fetch(getIngestEndPoint() + 'file-upload', requestOptions)
        return await response.json()
    } catch (error) {
        throw Error('413')
    }
}

const fetchSearchAPIEntities = async (body) => {
    const token = getAuth();
    const headers = get_json_header()
    if (token) {
        headers.append("Authorization", `Bearer ${token}`)
    }
    try {
        const res = await fetch(`${getSearchEndPoint()}/entities/search`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            return null;
        }
        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function fetchVitessceConfiguration(datasetId) {
    const headers = get_headers()
    const url = getIngestEndPoint() + "vitessce/" + datasetId
    const request_options = {
        method: 'GET',
        headers: headers,
    }
    const response = await fetch(url, request_options)
    if (response.status === 200) {
        return await response.json()
    } else if (response.status === 400) {
        // This is not a primary dataset so just return empty
        return {}
    }
    log.error('error', response)
    return {}
}

export const getDatasetQuantities = async () => {
    const body = {
        size: 0,
        query: {
            bool: {
                filter: {
                    term: {
                        'entity_type.keyword': 'Dataset',
                    },
                },
                must_not: [
                    {
                        term: {
                            'dataset_category.keyword': 'codcc-processed'
                        }
                    },
                    {
                        term: {
                            'dataset_category.keyword': 'lab-processed'
                        }
                    }
                ]
            },
        },
        aggs: {
            'origin_samples.organ': {
                terms: {
                    field: 'origin_samples.organ.keyword',
                    size: 40,
                },
            },
        },
    };
    const content = await fetchSearchAPIEntities(body);
    if (!content) {
        return null;
    }
    return content.aggregations['origin_samples.organ'].buckets.reduce(
        (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
        },
        {}
    );
};

export const getOrganDataTypeQuantities = async (organCodes) => {
    // Get the must_not filters from entities config
    const mustNot = SEARCH_ENTITIES.searchQuery.excludeFilters.map((filter) => {
        switch (filter.type) {
            case 'term':
                return {terms: {[filter.field]: filter.values}};
            case 'exists':
                return {exists: {field: filter.field}};
        }
    })

    const body = {
        size: 0,
        query: {
            bool: {
                filter: {
                    terms: {
                        'origin_samples.organ.keyword': organCodes,
                    }
                },
                must: {
                    term: {
                        "entity_type.keyword": "Dataset"
                    }
                },
                must_not: mustNot
            }
        },
        aggs: {
            dataset_type: {
                terms: {
                    field: 'dataset_type_hierarchy.second_level.keyword',
                    size: 40
                }
            }
        }
    }
    const content = await fetchSearchAPIEntities(body);
    if (!content) {
        return null;
    }
    return content.aggregations['dataset_type'].buckets.reduce(
        (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
        },
        {}
    );
}

export const getSamplesByOrgan = async (organCodes) => {
    const body = {
        query: {
            bool: {
                filter: [
                    {
                        term: {
                            'entity_type.keyword': 'Sample'
                        }
                    },
                    {
                        terms: {
                            'organ.keyword': organCodes,
                        }
                    }
                ]
            }
        },
        size: 10000,
        _source: {
            includes: [
                'sennet_id',
                'lab_tissue_sample_id',
                'group_name',
                'last_touch'
            ]
        }
    }
    const content = await fetchSearchAPIEntities(body);
    if (!content) {
        return null;
    }
    return content.hits.hits.map((hit) => {
        return {
            uuid: hit._id,
            sennetId: hit._source.sennet_id,
            labId: hit._source.lab_tissue_sample_id,
            groupName: hit._source.group_name,
            lastTouch: hit._source.last_touch,
        }
    });
}
