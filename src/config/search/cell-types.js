import { getCreationActionRelationName, getUBKGFullName, searchUIQueryString } from '@/components/custom/js/functions';
import SearchAPIConnector from 'search-ui/packages/search-api-connector';
import {
    doFiltersContainField,
    doesAggregationHaveBuckets,
    doesTermFilterContainValues,
    getAuth,
    getCellTypesIndex,
    getSearchEndPoint,
    lateralOrgans,
} from '../config';

const connector = new SearchAPIConnector({
    indexName: getCellTypesIndex(),
    indexUrl: getSearchEndPoint(),
    accessToken: getAuth(),
})

export const SEARCH_CELL_TYPES = {
    alwaysSearchOnInitialLoad: true,
    searchQuery: {
        excludeFilters: [
            {
                type: 'term',
                field: 'sample_category.keyword',
                values: ['Organ'],
            },
        ],
        facets: {
            'cell_characteristics.cell_label': {
                label: 'Cell Type',
                type: 'value',
                field: 'cell_characteristics.cell_label.keyword',
                filterType: 'any',
                isExpanded: false,
                isFilterable: false,
                facetType: 'term',
                // isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset']),
                // isFacetVisible: doesAggregationHaveBuckets('sources.source_type')
            },
            organ: {
                label: 'Organ',
                type: 'value',
                field: 'organ.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                groupByField: 'organ.keyword',
                // isAggregationActive: true,
                // isFacetVisible: doesAggregationHaveBuckets('dataset_type')
            },
            
            // Source Human
            'source_metadata.age.value': {
                label: 'Age',
                type: 'range',
                field: 'source_metadata.age.value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'histogram',
                aggregationInterval: 1,
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_metadata.age.value')
            },
            
            'source_metadata.race.value': {
                label: 'Race',
                type: 'value',
                field: 'source_metadata.race.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_metadata.race.value')
            },
            'source_metadata.sex.value': {
                label: 'Sex',
                type: 'value',
                field: 'source_metadata.sex.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_metadata.sex.value')
            },
        },
        disjunctiveFacets: [],
        conditionalFacets: {},
        search_fields: {
            all_text: {type: 'value'},
        },
        source_fields: [
            'dataset_sennet_id',
            'dataset_uuid',
            'organ_sennet_id',
            'organ',
            'cell_characteristics',
            'source_metadata'
            
        ],
        // Moving this configuration into `searchQuery` so the config inside search-tools can read this
        trackTotalHits: true,
    },
    initialState: {
        current: 1,
        resultsPerPage: 20,
        sortList: [{
            field: 'dataset_sennet_id.keyword',
            direction: 'desc'
        }]
    },
    urlPushDebounceLength: 100,
    trackUrlState: true,
    apiConnector: connector,
    hasA11yNotifications: true,
    a11yNotificationMessages: {
        searchResults: ({start, end, totalResults, searchTerm}) =>
            `Searching for '${searchTerm}'. Showing ${start} to ${end} results out of ${totalResults}.`,
    },
}
