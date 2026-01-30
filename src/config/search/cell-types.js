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
        beforeSearchCall: (queryOptions, next) => {
        
        queryOptions.collapse =  {
            field : "cl_id.keyword",
                inner_hits: {
                name: "cellTypes",
                    size: queryOptions.size,
                    sort: [{ "cl_id.keyword": "asc" }]
            },
            max_concurrent_group_searches: 4
        };
       
        // append additional aggregations needs for the table
        const aggs = queryOptions.aggs || {};
        aggs.total_cell_types = {
            cardinality: {
                field: "cl_id.keyword"
            }
        };

        queryOptions.aggs = aggs;

        return next(queryOptions)
    }
})

export const SEARCH_CELL_TYPES = {
    alwaysSearchOnInitialLoad: true,
    searchQuery: {
        excludeFilters: [
            
        ],
        facets: {
            'cell_label': {
                label: 'Cell Type',
                type: 'value',
                field: 'cell_label.keyword',
                filterType: 'any',
                isExpanded: false,
                isFilterable: false,
                facetType: 'term',
                // isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset']),
                // isFacetVisible: doesAggregationHaveBuckets('sources.source_type')
            },
            'organs.code': {
                label: 'Organ',
                type: 'value',
                field: 'organs.code.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                groupByField: 'organs.code.keyword',
                // isAggregationActive: true,
                // isFacetVisible: doesAggregationHaveBuckets('dataset_type')
            },
            
            // Source Human
            'dataset.age.value': {
                label: 'Age',
                type: 'range',
                field: 'dataset.age.value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'histogram',
                aggregationInterval: 1,
                isAggregationActive: (filters) => {
                    // Needs to check if entity_type:Source AND source_type:Human is selected
                    return true
                },
                isFacetVisible: doesAggregationHaveBuckets('dataset.age.value')
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
            cell_label: {type: 'value'},
            cl_id: {type: 'value'},
            cell_definition: {type: 'value'},
            'organs.type': {type: 'value'},
            all_text: {type: 'value'},
        },
        source_fields: [
            'dataset',
            'organs',
            'cell_label',
            'cell_definition',
            'cl_id',
            'cell_count' ,
            'source_metadata'
            
        ],
        // Moving this configuration into `searchQuery` so the config inside search-tools can read this
        trackTotalHits: true,
    },
    initialState: {
        current: 1,
        resultsPerPage: 20,
        sortList: [{
            field: 'dataset.uuid.keyword',
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
