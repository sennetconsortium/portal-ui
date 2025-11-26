import SearchAPIConnector from 'search-ui/packages/search-api-connector';
import {
    doesAggregationHaveBuckets, doesTermFilterContainValues,
    getAuth,
    getFilesIndex,
    getSearchEndPoint,
} from '../config';

const connector = new SearchAPIConnector({
    indexName: getFilesIndex(),
    indexUrl: getSearchEndPoint(),
    accessToken: getAuth(),
    beforeSearchCall: (queryOptions, next) => {

        queryOptions.collapse=  {
            "field" : "dataset_uuid.keyword",
                "inner_hits": {
                "name": "files",
                    "size": 20,
                    "sort": [{ "dataset_uuid.keyword": "asc" }]
            },
            "max_concurrent_group_searches": 4
        };
        // append additional aggregations needs for the table
        const aggs = queryOptions.aggs || {};
        aggs.total_datasets = {
            cardinality: {
                field: "dataset_uuid.keyword"
            }
        };
        aggs.table_file_extension = {
            composite: {
                size: 10000,
                sources: [
                    {
                        "dataset_uuid.keyword": {
                            terms: {
                                field: "dataset_uuid.keyword"
                            }
                        }
                    },
                    {
                        "file_extension.keyword": {
                            terms: {
                                field: "file_extension.keyword"
                            }
                        }
                    }
                ]
            }
        }
        aggs.table_organs = {
            composite: {
                size: 40,
                sources: [
                    {
                        "dataset_uuid.keyword": {
                            terms: {
                                field: "dataset_uuid.keyword"
                            }
                        }
                    },
                    {
                        "organs.label.keyword": {
                            terms: {
                                field: "organs.label.keyword"
                            }
                        }
                    }
                ]
            }
        };
        aggs.table_dataset_type = {
            composite: {
                size: 40,
                sources: [
                    {
                        "dataset_uuid.keyword": {
                            terms: {
                                field: "dataset_uuid.keyword"
                            }
                        }
                    },
                    {
                        "dataset_type.keyword": {
                            terms: {
                                field: "dataset_type.keyword"
                            }
                        }
                    }
                ]
            }
        }
        queryOptions.aggs = aggs;

        return next(queryOptions)
    }
})

const sourceItems = [
    'md5_checksum',
    'sha256_checksum',
    'dataset_uuid',
    'dataset_type',
    'dataset_type_hierarchy',
    'file_extension',
    'file_uuid',
    'organs',
    'size',
    'rel_path',
    'sources.source_type',
    'is_data_product',
    'is_qa_qc',
    'data_access_level',
    'metadata.analyte_class'
]

export const SEARCH_FILES = {
    alwaysSearchOnInitialLoad: true,
    searchQuery: {
        excludeFilters: [
            {
                type: 'exists',
                field: 'next_revision_uuid',
            }
        ],
        facets: {

            'sources.source_type': {
                label: 'Source Type',
                type: 'value',
                field: 'sources.source_type.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('sources.source_type')
            },
            'organs.label': {
                label: 'Organ',
                type: 'value',
                field: 'organs.label.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'hierarchy',
                groupByField: 'organs.hierarchy.keyword',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('organs.label')
            },
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
            'analyte_class': {
                label: 'Analyte Class',
                type: 'value',
                field: 'analyte_class.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('analyte_class')
            },
            'is_data_product': {
                label: 'Is Data Product',
                type: 'exists',
                field: 'is_data_product.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isFacetVisible: doesAggregationHaveBuckets('is_data_product')
            },
            'is_qa_qc': {
                label: 'Is Quality Assurance/Control',
                type: 'exists',
                field: 'is_qa_qc.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isFacetVisible: doesAggregationHaveBuckets('is_qa_qc')
            },
            file_extension: {
                label: 'File Extension',
                type: 'value',
                field: 'file_extension.keyword',
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('file_extension')
            }
        },
        disjunctiveFacets: [],
        conditionalFacets: {},
        search_fields: {
            rel_path: {type: 'value'},
            description: {type: 'value'},
            file_extension: {type: 'value'},
            'organs.type': {type: 'value'},
            'samples.type': {type: 'value'},
            dataset_sennet_id: {type: 'value'},
            dataset_type: {type: 'value'},
            all_text: {type: 'value'}
        },
        source_fields: sourceItems,
        // Moving this configuration into `searchQuery` so the config inside search-tools can read this
        trackTotalHits: true,
    },
    initialState: {
        current: 1,
        resultsPerPage: 20,
        sortList: [{
            field: 'dataset_uuid.keyword',
            direction: 'asc'
        }]
    },
    urlPushDebounceLength: 100,
    trackTotalHits: true,
    trackUrlState: true,
    apiConnector: connector,
    hasA11yNotifications: true,
    a11yNotificationMessages: {
        searchResults: ({start, end, totalResults, searchTerm}) =>
            `Searching for "${searchTerm}". Showing ${start} to ${end} results out of ${totalResults}.`,
    },
}