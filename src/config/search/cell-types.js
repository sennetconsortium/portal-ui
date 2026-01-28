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
          
            dataset_type: {
                label: 'Dataset Type',
                type: 'value',
                field: 'dataset_type_hierarchy.second_level.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'hierarchy',
                groupByField: 'dataset_type_hierarchy.first_level.keyword',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('dataset_type')
            },
            'sources.source_type': {
                label: 'Source Type',
                type: 'value',
                field: 'sources.source_type.keyword',
                filterType: 'any',
                isExpanded: false,
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset']),
                isFacetVisible: doesAggregationHaveBuckets('sources.source_type')
            },
            // Source Human
            'source_mapped_metadata.age.value': {
                label: 'Age',
                type: 'range',
                field: 'source_mapped_metadata.age.value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'histogram',
                aggregationInterval: 1,
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.age.value')
            },
            
            'source_mapped_metadata.race.value': {
                label: 'Race',
                type: 'value',
                field: 'source_mapped_metadata.race.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.race.value')
            },
            'source_mapped_metadata.sex.value': {
                label: 'Sex',
                type: 'value',
                field: 'source_mapped_metadata.sex.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.sex.value')
            },
        },
        disjunctiveFacets: [],
        conditionalFacets: {},
        search_fields: {
            all_text: {type: 'value'},
        },
        source_fields: [
            'sennet_id',
          
            'uuid',
            'organs',
            'source_type',
            'dataset_type',
            'status',
            'title',
            'description',
        ],
        // Moving this configuration into `searchQuery` so the config inside search-tools can read this
        trackTotalHits: true,
    },
    initialState: {
        current: 1,
        resultsPerPage: 20,
        sortList: [{
            field: 'last_modified_timestamp',
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
