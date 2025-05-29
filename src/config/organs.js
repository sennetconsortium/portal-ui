/**
 * Retrieves an organ object by its rui code.
 *
 * @param {string} code - The rui code of the organ.
 * @returns {Organ|undefined} The organ object, undefined if not found.
 */
export function getOrganByCode(code) {
    return Object.values(organs).find((organ) => organ.codes.includes(code))
}

/**
 * Retrieves an organ object by its url path parameter name.
 *
 * @param {string} path - The url path parameter name for the organ's page.
 * @returns {Organ|undefined} The organ object, undefined if not found.
 */
export function getOrganByPath(path) {
    return Object.values(organs).find((organ) => organ.path === path)
}

const BASE_ICON_URL = 'https://cdn.humanatlas.io/hra-design-system/icons'

export const organIcons = {
    'UBERON:0001013': `${BASE_ICON_URL}/organs/organ-icon-skin.svg`,
    'UBERON:0000178': `${BASE_ICON_URL}/organs/organ-icon-blood.svg`,
    'UBERON:0002371': `${BASE_ICON_URL}/organs/organ-icon-bone-marrow.svg`,
    'UBERON:0000955': `${BASE_ICON_URL}/organs/organ-icon-brain.svg`,
    'UBERON:0004538': `${BASE_ICON_URL}/organs/organ-icon-kidney-left.svg`,
    'UBERON:0004539': `${BASE_ICON_URL}/organs/organ-icon-kidney-right.svg`,
    'UBERON:0000059': `${BASE_ICON_URL}/organs/organ-icon-large-intestine.svg`,
    'UBERON:0002107': `${BASE_ICON_URL}/organs/organ-icon-liver.svg`,
    'UBERON:0002168': `${BASE_ICON_URL}/organs/organ-icon-lung-left.svg`,
    'UBERON:0002167': `${BASE_ICON_URL}/organs/organ-icon-lung-right.svg`,
    'UBERON:0000029': `${BASE_ICON_URL}/organs/organ-icon-lymph-nodes.svg`,
    'FMA:57991': `${BASE_ICON_URL}/organs/organ-icon-breast.svg`,
    'FMA:57987': `${BASE_ICON_URL}/organs/organ-icon-breast.svg`,
    'UBERON:0005090': 'https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-united.svg',
    'UBERON:0002119': `${BASE_ICON_URL}/organs/organ-icon-ovary-left.svg`,
    'UBERON:0002118': `${BASE_ICON_URL}/organs/organ-icon-ovary-right.svg`,
    'UBERON:0001264': `${BASE_ICON_URL}/organs/organ-icon-pancreas.svg`,
    'UBERON:0001987': `${BASE_ICON_URL}/organs/organ-icon-placenta.svg`,
    'UBERON:0002240': `${BASE_ICON_URL}/organs/organ-icon-spinal-cord.svg`,
    'UBERON:0002097': `${BASE_ICON_URL}/organs/organ-icon-skin.svg`,
    'UBERON:0001474': `${BASE_ICON_URL}/organs/organ-icon-bone-marrow.svg`,
    'UBERON:0002370': `${BASE_ICON_URL}/organs/organ-icon-thymus.svg`,
    'UBERON:0003126': `${BASE_ICON_URL}/organs/organ-icon-trachea.svg`,
    'UBERON:0000948': `${BASE_ICON_URL}/organs/organ-icon-heart.svg`,
    'FMA:54974': `${BASE_ICON_URL}/organs/organ-icon-palatine-tonsil.svg`,
    'FMA:54973': `${BASE_ICON_URL}/organs/organ-icon-palatine-tonsil.svg`,
    'UBERON:0010000': "https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-united.svg",
}

/**
 * An organ supported on the organs page.
 *
 * @typedef {Object} Organ
 * @property {string[]} codes - An array of rui codes for  the organ.
 * @property {boolean} hraSupported - Indicates if the organ is supported by HRA.
 * @property {string} icon - The URL of the icon for the organ.
 * @property {string} label - The label dor the organ.
 * @property {string} path - The url path parameter name for the organ's page.
 * @property {string} subLabel - The sub-label for the organ, uberon/fma code.
 * @property {string} url - The uberon/fma URL used in the HRA.
 */

/**
 * The organs supported on the organs page.
 *
 * @type {Organ[]}
 */
export const organs = [
    {
        codes: ['UBERON:0001013'],
        hraSupported: false,
        icon: organIcons['UBERON:0001013'],
        label: 'Adipose Tissue',
        path: 'adipose-tissue',
        subLabel: 'UBERON:0001013',
        url: 'http://purl.obolibrary.org/obo/UBERON_0001013'
    },
    {
        codes: ['UBERON:0000178'],
        hraSupported: false,
        icon: organIcons['UBERON:0000178'],
        label: 'Blood',
        path: 'blood',
        subLabel: 'UBERON:0000178',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000178'
    },
    {
        codes: ['UBERON:0001474'],
        hraSupported: false,
        icon: organIcons['UBERON:0001474'],
        label: 'Bone',
        path: 'bone',
        subLabel: 'UBERON:0001474',
        url: 'http://purl.obolibrary.org/obo/UBERON_0001474'
    },
    {
        codes: ['UBERON:0002371'],
        hraSupported: false,
        icon: organIcons['UBERON:0002371'],
        label: 'Bone Marrow',
        path: 'bone-marrow',
        subLabel: 'UBERON:0002371',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002371'
    },
    {
        codes: ['UBERON:0000955'],
        hraSupported: true,
        icon: organIcons['UBERON:0000955'],
        label: 'Brain',
        path: 'brain',
        subLabel: 'UBERON:0000955',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000955'
    },
    {
        codes: ['UBERON:0000948'],
        hraSupported: true,
        icon: organIcons['UBERON:0000948'],
        label: 'Heart',
        path: 'heart',
        subLabel: 'UBERON:0000948',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000948'
    },
    {
        codes: ['UBERON:0004538', 'UBERON:0004539'],
        hraSupported: true,
        icon: `${BASE_ICON_URL}/organs/organ-icon-kidneys.svg`,
        label: 'Kidney',
        path: 'kidney',
        subLabel: 'UBERON:0002113',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002113'
    },
    {
        codes: ['UBERON:0000059'],
        hraSupported: true,
        icon: organIcons['UBERON:0000059'],
        label: 'Large Intestine',
        path: 'large-intestine',
        subLabel: 'UBERON:0000059',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000059'
    },
    {
        codes: ['UBERON:0002107'],
        hraSupported: true,
        icon: organIcons['UBERON:0002107'],
        label: 'Liver',
        path: 'liver',
        subLabel: 'UBERON:0002107',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002107'
    },
    {
        codes: ['UBERON:0002168', 'UBERON:0002167'],
        hraSupported: true,
        icon: `${BASE_ICON_URL}/organs/organ-icon-lungs.svg`,
        label: 'Lung',
        path: 'lung',
        subLabel: 'UBERON:0002048',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002048'
    },
    {
        codes: ['UBERON:0000029'],
        hraSupported: true,
        icon: organIcons['UBERON:0000029'],
        label: 'Lymph Node',
        path: 'lymph-node',
        subLabel: 'UBERON:0000029',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000029'
    },
    {
        codes: ['FMA:57991', 'FMA:57987'],
        hraSupported: true,
        icon: `${BASE_ICON_URL}/organs/organ-icon-breast.svg`,
        label: 'Mammary Gland',
        path: 'mammary-gland',
        subLabel: 'FMA:57991',
        url: 'http://purl.org/sig/ont/fma/fma57991'
    },
    {
        codes: ['UBERON:0005090'],
        hraSupported: false,
        icon: organIcons['UBERON:0005090'],
        label: 'Muscle',
        path: 'muscle',
        subLabel: 'UBERON:0005090',
        url: 'http://purl.obolibrary.org/obo/UBERON_0005090'
    },
    {
        codes: ['UBERON:0002119', 'UBERON:0002118'],
        hraSupported: true,
        icon: `${BASE_ICON_URL}/organs/organ-icon-ovaries.svg`,
        label: 'Ovary',
        path: 'ovary',
        subLabel: 'UBERON:0000992',
        url: 'http://purl.obolibrary.org/obo/UBERON_0000992'
    },
    {
        codes: ['UBERON:0001264'],
        hraSupported: true,
        icon: organIcons['UBERON:0001264'],
        label: 'Pancreas',
        path: 'pancreas',
        subLabel: 'UBERON:0001264',
        url: 'http://purl.obolibrary.org/obo/UBERON_0001264'
    },
    {
        codes: ['UBERON:0001987'],
        hraSupported: true,
        icon: organIcons['UBERON:0001987'],
        label: 'Placenta',
        path: 'placenta',
        subLabel: 'UBERON:0001987',
        url: 'http://purl.obolibrary.org/obo/UBERON_0001987'
    },
    {
        codes: ['UBERON:0002097'],
        hraSupported: true,
        icon: organIcons['UBERON:0002097'],
        label: 'Skin',
        path: 'skin',
        subLabel: 'UBERON:0002097',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002097'
    },
    {
        codes: ['UBERON:0002240'],
        hraSupported: true,
        icon: organIcons['UBERON:0002240'],
        label: 'Spinal Cord',
        path: 'spinal-cord',
        subLabel: 'UBERON:0002240',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002240'
    },
    {
        codes: ['UBERON:0002370'],
        hraSupported: true,
        icon: organIcons['UBERON:0002370'],
        label: 'Thymus',
        path: 'thymus',
        subLabel: 'UBERON:0002370',
        url: 'http://purl.obolibrary.org/obo/UBERON_0002370'
    },
    {
        codes: ['FMA:54974', 'FMA:54973'],
        hraSupported: true,
        icon: `${BASE_ICON_URL}/organs/organ-icon-palatine-tonsil.svg`,
        label: 'Tonsil',
        path: 'tonsil',
        subLabel: 'FMA:54973',
        url: 'http://purl.org/sig/ont/fma/fma54973'
    },
     {
        codes: ['UBERON:0003126'],
        hraSupported: true,
        icon: organIcons['UBERON:0003126'],
        label: 'Trachea',
        path: 'trachea',
        subLabel: 'UBERON:0003126',
        url: 'http://purl.obolibrary.org/obo/UBERON_0003126'
    }
]
