import {COLS_ORDER_KEY, getAuth, getProtocolsToken, getRootURL} from "../../../config/config";
import {APP_ROUTES} from "../../../config/constants";
import log from "loglevel";
import React from "react";

export function getHeaders() {
    const myHeaders = new Headers();
    if (getAuth() !== undefined) {
        myHeaders.append("Authorization", "Bearer " + getAuth());
    }
    myHeaders.append("Content-Type", "application/json");
    return myHeaders;
}

export function getHeadersWithoutContent() {
    return {
        "Content-Type": "Application/json",
        "Authorization": "Bearer " + getAuth()
    }
}

export function getRequestHeaders() {
    const myHeaders = getHeaders();
    return {
        method: 'GET',
        headers: myHeaders
    };
}

export function getIdRegEx() {
    return new RegExp(/SNT\d{3}\.[A-Za-z]{4}\.\d{3}/, 'ig')
}

export async function fetchEntity(ancestorId, paramKey = 'uuid') {
    const response = await fetch(`/api/find?${paramKey}=` + ancestorId, getRequestHeaders());
    // convert the data to json
    const entity = await response.json();
    if (entity.hasOwnProperty("error")) {
        log.error(entity["error"])
        return entity;
    } else {
        return entity;
    }
}

export function getProtocolId(protocolUrl) {
    // The ID is everything after "dx.doi.org/"
    const regex = new RegExp("(?<=dx.doi.org/).*")
    return regex.exec(protocolUrl)
}

export function formatCitation(data, url) {
    let result = []
    const creators = data.attributes.creators;
    for (let i = 0; i < creators.length; i++) {
        result.push(<span key={creators[i].name}>
            {creators[i].familyName} {creators[i].givenName[0]}
            {i == creators.length - 1 ? `. ` : `, `} </span>)
    }
    result.push(<span key={`${data}-title`} className={'fw-light'}>{data.attributes?.titles[0].title}</span>)
    result.push(<span key={`${data}-publisher`}>. {data.attributes?.publisher}. {data.attributes.publicationYear}.</span>)
    return <>
        {result}
        <span> Available from: <br /><a className='lnk--ic' href={url}>{url} <i
            className="bi bi-box-arrow-up-right"></i></a></span>
        <hr/>
        <span><a className='lnk--ic' href={`https://commons.datacite.org/${url.replace('https://', '')}`}>View the DataCite page<i
            className="bi bi-box-arrow-up-right"></i></a></span>
    </>
}

export async function fetchDataCite(protocolUrl) {
    if (!protocolUrl) return null
    const regex = new RegExp("(?<=doi.org/).*")
    const protocolId = regex.exec(protocolUrl)
    const response = await fetch(`https://api.datacite.org/dois/${protocolId}`)
    if (!response.ok) {
        return null
    }
    return response.json()
}

export async function fetchProtocols(protocolUrl) {
    if (!protocolUrl) return null

    const response = await fetch("/api/protocol?uri=" + encodeURIComponent(protocolUrl));

    if (!response.ok) {
        return null
    }
    return await response.json();
}

export function createDownloadUrl(fileStr, fileType) {
    return window.URL.createObjectURL(new Blob([fileStr], {type: fileType}));
}

export function tableDataToTSV(tableData) {
    let newObject = Object.entries(tableData)
        .map((entry) => ({
                key: entry[0],
                value: Array.isArray(entry[1]) ? entry[1].join(', ') : entry[1],
            })
        );

    return [["Key", "Value"],
        ...newObject.map(item => [
            item.key,
            item.value
        ])
    ].map(e => e.join("\t"))
        .join("\n")
}

export function displayBodyHeader(header) {
    if (header !== undefined)
        return (header.charAt(0).toUpperCase() + header.slice(1)).replaceAll('_', ' ');
    else
        return ""
}


export function getUBKGFullName(term) {
    if (!window.UBKG_CACHE) return term
    if (term in window.UBKG_CACHE.organTypes) {
        return window.UBKG_CACHE.organTypes[term]
    } else if (term in window.UBKG_CACHE.datasetTypes) {
        return window.UBKG_CACHE.datasetTypes[term]
    } else if (window.UBKG_CACHE.dataTypesObj.filter(data_type => data_type['data_type'] === term).length > 0) {
        return window.UBKG_CACHE.dataTypesObj.filter(data_type => data_type['data_type'] === term).map(data_type => data_type.description)[0];
    } else {
        return getNormalizedName(term)
    }
}

const normalizedNames = {
    true: "True",
    false: "False",
    m: "Male",
    f: "Female",
    imaging: "Imaging",
    sequence: "Sequence",
    protein: "Protein",
    "ambient temperature": "Ambient Temperature",
    "carbon dioxide asphixiation": "Carbon Dioxide Asphixiation",
    "frozen in liquid nitrogen": "Frozen in Liquid Nitrogen",
}

function getNormalizedName(term) {
    if (term && normalizedNames.hasOwnProperty(term.toLowerCase())) {
        return normalizedNames[term.toLowerCase()]
    }
    return term
}

export function getDataTypes() {
    return window.UBKG_CACHE.dataTypes
}

export function getDatasetTypes() {
    return window.UBKG_CACHE.datasetTypes
}

export function getDataTypesByProperty(property, value) {
    return window.UBKG_CACHE.dataTypesObj.filter(data_type => data_type[property] === value).map(data_type => data_type.data_type);
}

export function getIsPrimaryDataset(data) {
    return eq(data.dataset_category, 'primary') || eq(data.creation_action, 'Create Dataset Activity')
}

export function getDOIPattern() {
    return "(^(http(s)?:\/\/)?dx.doi.org\/10.\\d{4,9}\/protocols\.io\..+)|(^(http(s)?:\/\/)?doi.org\/10.\\d{4,9}\/protocols\.io\..+)"
}

export function formatByteSize(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    // This uses metric instead of binary (1024)
    const k = 1000
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function getStatusDefinition(status) {
    let msg
    if (status) {
        status = status.toUpperCase();
        switch (status) {
            case 'NEW':
                msg = <span>The Globus directory is ready for data upload.</span>
                break;
            case 'INCOMPLETE':
                msg = <span>The data provider has begun to upload data but is not ready for validation or processing via the ingest pipeline.</span>
                break;
            case 'VALID':
                msg = <span>The data passed validation during processing via the ingest pipeline.</span>
                break;
            case 'INVALID':
                msg = <span>The data did not pass validation prior to processing via the ingest pipeline.</span>
                break;
            case 'QA':
                msg =
                    <span>The data has been successfully processed via the ingest pipeline and is awaiting data provider curation.</span>
                break;
            case 'ERROR':
                msg = <span>An error occurred during processing via the ingest pipeline.</span>
                break;
            case 'PROCESSING':
                msg = <span>The data is currently being processed via the ingest pipeline.</span>
                break;
            case 'REORGANIZED':
                msg = <span>Datasets included in this Upload have been registered and data has been reorganized on the Globus Research Management system.</span>
                break;
            case 'SUBMITTED':
                msg = <span>The data provider has finished uploading data and the data is ready for validation.</span>
                break;
            case 'PUBLISHED':
                msg = <span>The data has been successfully curated and released for public use.</span>
                break;
            default:
                msg = <span>The <code>Dataset</code> has been {status}.</span>
                break;
        }
    }
    return msg;
}

export function getJobStatusDefinition(status) {
    let msg
    if (status) {
        status = status.toUpperCase();
        switch (status) {
            case 'QUEUED':
                msg = <span>Queued in the rq service.</span>
                break;
            case 'COMPLETE':
                msg = <span>Job returned successfully.</span>
                break;
            case 'ERROR':
                msg = <span>Job returned with errors.</span>
                break;
            case 'FAILED':
                msg = <span>Exception thrown in job.</span>
                break;
            case 'STARTED':
                msg = <span>Job started.</span>
                break;
            case 'STOPPED':
                msg = <span>Job stopped.</span>
                break;
            case 'CANCELED':
                msg = <span>Job cancelled.</span>
                break;
            default:
                msg = <span>The job has been {status}.</span>
                break;
        }
    }
    return msg;
}

export function getJobTypeColor(type) {
    if (type) {
        switch (type.toLowerCase()) {
            case "metadata validation":
                return '#ffc766'
            case "metadata registration":
                return '#fcea7e'
            case "entity validation":
                return '#3b6b23'
            case "entity registration":
                return '#47991f'
            default:
                break;
        }
    }
}

export function getStatusColor(status) {
    let badge_class = '';

    if (status) {
        switch (status.toUpperCase()) {
            case "NEW":
            case "REOPENED":
                badge_class = "badge-purple";
                break;
            case "INCOMPLETE":
            case "CANCELED":
            case "STOPPED":
                badge_class = "badge-warning";
                break;
            case "INVALID":
            case "ERROR":
            case "FAILED":
                badge_class = "badge-danger";
                break;
            case "QA":
            case "REORGANIZED":
            case "SUBMITTED":
                badge_class = "badge-info";
                break;
            case "LOCKED":
            case "PROCESSING":
            case "STARTED":
                badge_class = "badge-secondary";
                break;
            case "PUBLISHED":
            case "COMPLETE":
            case "VALID":
                badge_class = "badge-success";
                break;
            case "UNPUBLISHED":
                badge_class = "badge-light";
                break;
            case "DEPRECATED":
                break;
            case "HOLD":
            case "QUEUED":
                badge_class = "badge-dark";
                break;
            default:
                break;
        }

        return badge_class;
    }
    return badge_class

}

export function checkFilterType(filters, field = 'entity_type') {
    let hasType = false;
    filters.map((filter, index) => {
        if (filter.field === field) {
            hasType = true;
        }
    });

    return hasType;
}

export function checkMultipleFilterType(filters, field = 'entity_type') {
    let hasMultipleType = false;
    try {
        filters.map((filter, index) => {
            if (filter.field === field) {
                if (filter.values.length > 1)
                    hasMultipleType = true;
            }
        });
    } catch (e) {
        return hasMultipleType;
    }

    return hasMultipleType;
}

export function cleanJson(json) {
    Object.entries(json).forEach(([key, val]) =>
        (val && typeof val === 'object') && cleanJson(val) ||
        (key !== 'description') && (val === null || val === "" || val === undefined) && delete json[key]
    );
    return json;
}

export function getClickableLink(link) {
    return link.startsWith("http://") || link.startsWith("https://") ? link : "https://" + link;
}

export function goIntent(route, fn = 'assign') {
    window.location[fn](getRootURL() + APP_ROUTES[route])
}

export function goToSearch() {
    goIntent('search')
}

export function getEntityViewUrl(entity, uuid, {isEdit = false}) {
    const pre = isEdit ? '/edit' : ''
    return pre + "/" + entity?.toLowerCase() + "?uuid=" + uuid
}

export function autoBlobDownloader(data, type, filename) {
    const a = document.createElement('a')
    const url = window.URL.createObjectURL(new Blob(data, {type}))
    a.href = url
    a.download = filename
    document.body.append(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
}


export function urlify(text, blank = true, max = 40) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        url = url.replace('http://local', '')
        return `<a href="${url}" title="${url}" ${blank ? 'target="_blank" class="lnk--ic"' : ''}>${url.length > max ? url.substr(0, 40) + '...' : url} ${blank ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"></path><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"></path></svg>' : ''}</a>`;
    })
}

export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1?.toLowerCase() === s2?.toLowerCase()
    }
    return res
}

Object.assign(String.prototype, {
    upperCaseFirst() {
        return this[0].toUpperCase() + this.slice(1);
    },
    contains(needle) {
        return this.indexOf(needle) !== -1
    },
    stripTags() {
        return this.replace(/(<([^>]+)>)/gi, "")
    }
})

Object.assign(Array.prototype, {
    sortOnProperty(key) {
        return this.sort((a, b) => {
                let fa = a[key].toLowerCase(),
                    fb = b[key].toLowerCase()

                if (fa < fb) {
                    return -1
                }
                if (fa > fb) {
                    return 1
                }
                return 0
        })
    },
    contains(needle, insensitive = true) {
        return this.some((i) => eq(i, needle, insensitive))
    }
})


export const flipObj = (obj) => {
    return Object.keys(obj).reduce((ret, key) => {
        ret[obj[key]] = key;
        return ret;
    }, {})
}

export const matchArrayOrder = (ordering, data, key1 = 'name', key2 = 'id') => {
    if (!ordering) return data
    let map = {}
    let val
    let result = []
    if (Array.isArray(data)) {
        for (let i=0; i < data.length; i++) {
            val = eq(typeof data[i][key1], 'string') ? data[i][key1] : data[i][key2]
            map[val] = i
        }
    } else {
        map = data
    }

    if (Object.keys(map).length !== ordering.length) return data
    let index, item
    for (let i = 0; i < ordering.length; i++) {
        index = map[ordering[i]]
        item = data[index]
        result.push(data[index])

    }
    return result
}


export const deleteFromLocalStorage = (needle, fn = 'startsWith') => {
    Object.keys(localStorage)
        .filter(x =>
            x[fn](needle))
        .forEach(x =>
            localStorage.removeItem(x))
}

export const deleteFromLocalStorageWithSuffix = (needle) => deleteFromLocalStorage(needle, 'endsWith')

export const THEME = {
    getRGB: (color) => {
        color = +("0x" + color.slice(1).replace(
            color.length < 5 && /./g, '$&$&'));

        let r = color >> 16;
        let g = color >> 8 & 255;
        let b = color & 255;
        return {r, g, b}
    },
    isLightColor: (color) => {
        const {r, g, b} = THEME.getRGB(color)
        let hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
        return hsp > 127.5
    },
    randomColor: () => {
        let hexTab = "5553336789ABCDE0";
        let r1 = hexTab[ Math.floor( Math.random() * 16) ];
        let g1 = hexTab[ Math.floor( Math.random() * 16) ];
        let b1 = hexTab[ Math.floor( Math.random() * 16) ];
        let color = "#" + r1 + g1 + b1
        const {r, g, b} = THEME.getRGB(color)
        return {color, light: THEME.isLightColor(color), r, g, b};
    },
}
