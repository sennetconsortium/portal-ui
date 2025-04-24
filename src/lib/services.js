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
export function getHeadersFromRequest(reqHeaders, headers) {
    headers = headers || new Headers();
    for (let h in reqHeaders) {
        headers.set(h.upperCaseFirst(), reqHeaders[h])
    }
    return headers;
}

export function getJsonHeader(headers) {
    headers = headers || new Headers();
    headers.append("Content-Type", "application/json");
    return headers;
}

export function getAuthHeader(ops = {}) {
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

export function getXSenNetHeader(headers) {
    headers = headers || new Headers();
    headers.append('X-SenNet-Application', 'portal-ui')
    return headers
}

export function getAuthJsonHeaders() {
    const headers = getAuthHeader();
    return getJsonHeader(headers);
}

export async function callService(reqBody, url, method, headers) {
    headers = headers ? headers : getAuthJsonHeaders()
    return await fetch(url, {
        method: method,
        headers: headers,
        body: reqBody && typeof reqBody === 'object' ? JSON.stringify(reqBody) : reqBody,
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
export async function update_create_entity(uuid, body, action = "Edit", entityType = null) {
    let headers = getAuthJsonHeaders()
    headers = getXSenNetHeader(headers)
    let raw = JSON.stringify(body)
    let url = getEntityEndPoint() + "entities/" + (action === 'Register' ? entityType : uuid + '?return_dict=true')
    let method = (action === 'Register' ? "POST" : "PUT")

    return callService(raw, url, method, headers)
}

export async function updateCreateDataset(uuid, body, action = "Edit", entityType = 'datasets') {
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
export async function getReadWritePrivileges() {
    log.info('GET READ WRITE PRIVILEGES')
    const url = getIngestEndPoint() + 'privs'
    const requestOptions = {
        method: 'GET',
        headers: getAuthJsonHeaders()
    }
    try {
        const response = await fetch(url, requestOptions)
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

export async function callIngestService(path, base='privs/') {
    const url = getIngestEndPoint() + base + path;
    const requestOptions = {
        method: 'GET',
        headers: getAuthJsonHeaders()
    }
    try {
        const response = await fetch(url, requestOptions)
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

export async function hasDataAdminPrivs() {
    log.debug('FETCHING DATA ADMIN PRIVS')
    return await callIngestService('has-data-admin')
}

export async function getWritePrivilegeForGroupUuid(groupUuid) {
    log.debug('GET WRITE PRIVILEGE FOR GROUP UUID')
    return await callIngestService(groupUuid + '/has-write')
}

export async function getUserWriteGroups() {
    log.debug('FETCHING USER WRITE GROUPS')
    return await callIngestService('user-write-groups')
}

export async function getProviderGroups() {
    log.debug('FETCHING Provider GROUPS')
    return await callIngestService('data-provider-groups', 'metadata/')
}


//////////////////////
// Entity API Requests
//////////////////////
export async function fetchEntityApi(url) {
    let headers = getAuthHeader()
    const requestOptions = {
        method: 'GET',
        headers: headers
    }

    return await fetch(url, requestOptions)
}

export async function getProvInfo(datasetUuid) {
    const url = getEntityEndPoint() + "datasets/" + datasetUuid + "/prov-info?format=json"
    let result = callService(null, url, 'GET', getAuthHeader())
    if ("error" in result) {
        return {}
    }
    return result
}

export async function getLineageInfo(entityUuid, lineage_descriptor) {
    const url = getEntityEndPoint() + lineage_descriptor + "/" + entityUuid
    const result = fetchEntityApi(url)
    if ("error" in result) {
        return []
    }
    return result
}

export async function fetchGlobusFilepath(sennetId) {
    const url = getEntityEndPoint() + "entities/" + sennetId + "/globus-url"
    const response = await fetchEntityApi(url)
    const filepath = await response.text();
    return {status: response.status, filepath: filepath};
}


export async function fetchPipelineMessage(datasetUuid, entityType) {
    let endpoint = "pipeline-message"
    if (entityType === 'Upload') {
        endpoint = 'validation-message'
    }
    const url = getEntityEndPoint() + "entities/" + datasetUuid + "/" + endpoint
    const response = await fetchEntityApi(url)
    return await response.text();
}

//////////////////////

export async function checkValidToken() {
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
export async function fetchEntityType(uuid, bearer_token) {
    const headers = getAuthHeader();
    const url = getUUIDEndpoint() + "uuid/" + uuid
    const requestOptions = {
        method: 'GET',
        headers: headers
    }
    const response = await fetch(url, requestOptions)
    if (response.status === 200) {
        const entity = await response.json();
        return (entity["type"]).toLowerCase();

    } else if (response.status === 400) {
        return "404";
    } else {
        return response.status.toString()
    }
}

export async function getAncestryData(uuid, ops = {endpoints: ['ancestors', 'descendants'], otherEndpoints: []}, entityType = null) {
    const ancestryPromises = getAncestry(uuid, ops, entityType)
    const promiseSettled = await Promise.allSettled([...Object.values(ancestryPromises)])
    let _data = {};
    let i = 0;
    for (let key of Object.keys(ancestryPromises)) {
        _data[key] = promiseSettled[i].value;
        i++;
    }
    return _data;
}

export function getAncestry(uuid, {endpoints = ['ancestors', 'descendants'], otherEndpoints = []}, entityType = null) {
    const propertyNameMap = {
        'immediate_ancestors': 'parents',
        'immediate_descendants': 'children'
    }
    const allEndpoints = endpoints.concat(otherEndpoints)
    let result = {}
    const isEdit = window.location.href.contains('edit/')
    for (let key of allEndpoints) {
        let endpoint = propertyNameMap[key] || key
        let reqBody = []
        if (isEdit) {
            reqBody =  filterProperties.ancestryEdit
        } else if (endpoint.includes('ancestors')) {
            reqBody = filterProperties.ancestors
        } else if (endpoint.includes("descendants")) {
            if (entityType && entityType === 'Dataset') {
                reqBody = filterProperties.datasetDescendants
            } else {
                reqBody = filterProperties.descendants
            }
        }

        result[key] = callService(reqBody, `${getEntityEndPoint()}${endpoint}/${uuid}`, 'POST')
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
        headers: getAuthHeader(),
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
    const headers = getJsonHeader()
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
    const headers = getAuthJsonHeaders()
    const url = getIngestEndPoint() + "vitessce/" + datasetId
    const requestOptions = {
        method: 'GET',
        headers: headers,
    }
    const response = await fetch(url, requestOptions)
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

export const getOrganQuantities = async () => {
    const body = {
        size: 0,
        query: {
            bool: {
                filter: {
                    term: {
                        'entity_type.keyword': 'Sample',
                    },
                }
            },
        },
        aggs: {
            'organ': {
                terms: {
                    field: 'organ.keyword',
                    size: 40,
                },
            },
        },
    };
    const content = await fetchSearchAPIEntities(body);
    if (!content) {
        return null;
    }
    return content.aggregations['organ'].buckets.reduce(
        (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
        },
        {}
    );
};

export const getEntityTypeQuantities = async () => {
    const body = {
        size: 0,
        query: {
            bool: {
                should: [
                    {
                        bool: {
                            must: [
                                {
                                    exists: {
                                        field: "entity_type"
                                    }
                                }
                            ],
                            must_not: [
                                {
                                    exists: {
                                        field: "creation_action"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        bool: {
                            must: [
                                {
                                    terms: {
                                        "entity_type.keyword": [
                                            "Dataset"
                                        ]
                                    }
                                },
                                {
                                    bool: {
                                        should: [
                                            {
                                                bool: {
                                                    must: [
                                                        {
                                                            terms: {
                                                                "creation_action.keyword": [
                                                                    "Create Dataset Activity"
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        bool: {
                            must: [
                                {
                                    terms: {
                                        "entity_type.keyword": [
                                            "Publication"
                                        ]
                                    }
                                },
                                {
                                    bool: {
                                        should: [
                                            {
                                                bool: {
                                                    must: [
                                                        {
                                                            terms: {
                                                                "creation_action.keyword": [
                                                                    "Create Publication Activity"
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        aggs: {
            entity_type: {
                terms: {
                    field: "entity_type.keyword",
                    size: 1000
                }
            }
        }
    };
    const content = await fetchSearchAPIEntities(body);
    if (!content) {
        return null;
    }
    return content.aggregations['entity_type'].buckets.reduce(
        (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
        },
        {}
    );
};


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

export const filterProperties = {
    ancestors: {
        filter_properties: [
            "lab_source_id",
            "lab_tissue_sample_id",
            "lab_dataset_id",
            "origin_samples",
            "creation_action",
            "metadata",
            "cedar_mapped_metadata",
            "source_mapped_metadata"
        ],
        is_include: true
    },
    descendants: {
        filter_properties: [
            "lab_source_id",
            "lab_tissue_sample_id",
            "lab_dataset_id",
            "origin_samples",
            "creation_action"
        ],
        is_include: true
    },
    datasetDescendants: {
         filter_properties: [
            "lab_source_id",
            "lab_tissue_sample_id",
            "lab_dataset_id",
            "origin_samples",
            "creation_action",
             "files"
        ],
        is_include: true
    },
    ancestryEdit: {
        filter_properties: [
            "lab_source_id",
            "lab_tissue_sample_id",
            "lab_dataset_id",
            "origin_samples",
            "creation_action",
            "protocol_url"
        ],
        is_include: true
    },
    uploadsDatasets: {
        filter_properties: [
            "status",
            "lab_dataset_id"
        ],
        is_include: true
    },
    collectionEntities: {
        filter_properties: [
            "status",
            "lab_source_id",
            "lab_tissue_sample_id",
            "lab_dataset_id"
        ],
        is_include: true
    }
}
