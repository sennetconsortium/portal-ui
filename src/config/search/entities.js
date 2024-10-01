import SearchAPIConnector from 'search-ui/packages/search-api-connector';
import {
    doesAggregationHaveBuckets,
    doesTermFilterContainValues,
    getAuth,
    getEntitiesIndex,
    getSearchEndPoint,
    isDateFacetVisible
} from '../config';

const connector = new SearchAPIConnector({
    indexName: getEntitiesIndex(),
    indexUrl: getSearchEndPoint(),
    accessToken: getAuth(),
})

const lateralOrgans = ['Breast', 'Kidney', 'Lung', 'Mammary Gland', 'Ovary', 'Tonsil']

export const SEARCH_ENTITIES = {
    alwaysSearchOnInitialLoad: true,
    searchQuery: {
        excludeFilters: [
            {
                type: 'term',
                field: 'entity_type.keyword',
                values: ['Publication']
            },
            {
                type: 'term',
                field: 'dataset_category.keyword',
                values: ['codcc-processed', 'lab-processed']
            },
            {
                type: 'exists',
                field: 'next_revision_uuid',
            }
        ],
        facets: {
            entity_type: {
                label: 'Entity Type',
                type: 'value',
                field: 'entity_type.keyword',
                isExpanded: true,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('entity_type')
            },
            // Used for when 'Sample' is selected to show organs
            source_type: {
                label: 'Source Type',
                type: 'value',
                field: 'source_type.keyword',
                filterType: 'any',
                isExpanded: false,
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Source']),
                isFacetVisible: doesAggregationHaveBuckets('source_type')
            },
            sample_category: {
                label: 'Sample Category',
                type: 'value',
                field: 'sample_category.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                isFacetVisible: doesAggregationHaveBuckets('sample_category')
            },
            has_qa_derived_dataset: {
                label: 'Has QA Derived Datasets',
                type: 'value',
                field: 'has_qa_derived_dataset.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters, authState) => {
                    if (authState.isAdmin) {
                        const isActiveFunc = doesTermFilterContainValues('entity_type', ['Dataset'])
                        return isActiveFunc(filters)
                    }
                    return false
                },
                isFacetVisible: doesAggregationHaveBuckets('has_qa_derived_dataset')
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
            organ: {
                label: 'Organ',
                type: 'value',
                field: 'organ.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'hierarchy',
                groupByField: 'organ_hierarchy.keyword', 
                isHierarchyOption: (option) => {
                    return lateralOrgans.includes(option)
                },
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                isFacetVisible: doesAggregationHaveBuckets('organ')
            },
            // Used for when 'Dataset' or Sample Block/Section/Suspension is selected to show related organs
            'origin_sample.organ': {
                label: 'Organ',
                type: 'value',
                field: 'origin_sample.organ.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'hierarchy',
                groupByField: 'origin_sample.organ_hierarchy.keyword',
                isHierarchyOption: (option) => {
                    return lateralOrgans.includes(option)
                },
                isAggregationActive: [
                    doesTermFilterContainValues('entity_type', ['Dataset']),
                    doesTermFilterContainValues('sample_category', ['Block', 'Section', 'Suspension'])
                ],
                isFacetVisible: doesAggregationHaveBuckets('origin_sample.organ')
            },
            // Used for when 'Dataset/Sample' is selected to show related sources
            'source.source_type': {
                label: 'Source Type',
                type: 'value',
                field: 'source.source_type.keyword',
                filterType: 'any',
                isExpanded: false,
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                isFacetVisible: doesAggregationHaveBuckets('source.source_type')
            },
            has_rui_information: {
                label: 'Is Spatially Registered',
                type: 'value',
                field: 'has_rui_information.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('has_rui_information')
            },
            'rui_location_anatomical_locations.label': {
                label: 'Anatomical Locations',
                type: 'value',
                field: 'rui_location_anatomical_locations.label.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                isFacetVisible: doesAggregationHaveBuckets('rui_location_anatomical_locations.label')
            },
            // 'metadata': {
            //     label: 'Has Metadata',
            //     type: 'exists',
            //     field: 'metadata',
            //     isExpanded: false,
            //     filterType: 'any',
            //     isFilterable: false,
            //     facetType: 'term',
            //     isAggregationActive: [
            //         doesTermFilterContainValues('entity_type', ['Source', 'Collection', 'Publication']),
            //         doesTermFilterContainValues('sample_category', ['Block', 'Section', 'Suspension'])
            //     ],
            //     isFacetVisible: doesAggregationHaveBuckets('metadata')
            // },
            // 'ingest_metadata.metadata': {
            //     label: 'Has Metadata',
            //     type: 'exists',
            //     field: 'ingest_metadata.metadata',
            //     isExpanded: false,
            //     filterType: 'any',
            //     isFilterable: false,
            //     facetType: 'term',
            //     isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset']),
            //     isFacetVisible: doesAggregationHaveBuckets('ingest_metadata.metadata')
            // },
            has_all_published_datasets: {
                label: 'Has All Primary Published',
                type: 'value',
                field: 'has_all_published_datasets.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: (filters, authState) => {
                    if (authState.isAdmin) {
                        const isActiveFunc = doesTermFilterContainValues('entity_type', ['Upload'])
                        return isActiveFunc(filters)
                    }
                    return false
                },
                isFacetVisible: doesAggregationHaveBuckets('has_all_published_datasets')
            },
            status: {
                label: 'Status',
                type: 'value',
                field: 'status.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('status')
            },
            group_name: {
                label: 'Data Provider Group',
                type: 'value',
                field: 'group_name.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('group_name')
            },
            created_by_user_displayname: {
                label: 'Registered By',
                type: 'value',
                field: 'created_by_user_displayname.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: true,
                isFacetVisible: doesAggregationHaveBuckets('created_by_user_displayname')
            },
            created_timestamp: {
                label: 'Creation Date',
                type: 'range',
                field: 'created_timestamp',
                isExpanded: false,
                filterType: 'any',
                isFilterable: true,
                facetType: 'daterange',
                isFacetVisible: isDateFacetVisible
            },
            last_modified_timestamp: {
                label: 'Modification Date',
                type: 'range',
                field: 'last_modified_timestamp',
                isExpanded: false,
                filterType: 'any',
                isFilterable: true,
                facetType: 'daterange',
                isFacetVisible: isDateFacetVisible
            },
        },
        disjunctiveFacets: [],
        conditionalFacets: {},
        search_fields: {
            'sennet_id^4': {type: 'value'},
            'group_name^3': {type: 'value'},
            'dataset_type^2': {type: 'value'},
            'sample_category^2': {type: 'value'},
            'entity_type^2': {type: 'value'},
            'status^2': {type: 'value'},
            all_text: {type: 'value'},
        },
        source_fields: [
            'sennet_id',
            'entity_type',
            'uuid',
            'lab_tissue_sample_id',
            'lab_source_id',
            'lab_dataset_id',
            'sample_category',
            'group_uuid',
            'group_name',
            'source_type',
            'dataset_type',
            'status',
            'origin_sample.organ',
            'organ',
            'title',
            'description',
            'dataset_type_hierarchy',
            'has_all_published_datasets'
        ]
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
    trackTotalHits: true,
    trackUrlState: true,
    apiConnector: connector,
    hasA11yNotifications: true,
    a11yNotificationMessages: {
        searchResults: ({start, end, totalResults, searchTerm}) =>
            `Searching for '${searchTerm}'. Showing ${start} to ${end} results out of ${totalResults}.`,
    },
}
