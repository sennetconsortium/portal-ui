import SearchAPIConnector from 'search-ui/packages/search-api-connector';
import {
    doesAggregationHaveBuckets,
    doesTermFilterContainValues,
    getAuth,
    getEntitiesIndex,
    getSearchEndPoint,
    isDateFacetVisible
} from '../config';
import {getCreationActionRelationName, getUBKGFullName} from '@/components/custom/js/functions';

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
            data_class: {
                label: 'Data Class',
                type: 'value',
                field: 'creation_action.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                tooltipText: `Primaries are data registered and uploaded by SenNet data providers, this data must have a direct parent entity in the provenance graph of type Sample.
                Components are separate datasets that represent the components that make up a Multi-Assay Primary Data dataset.`,
                isAggregationActive: (filters) => {
                    const isActiveFunc = doesTermFilterContainValues('entity_type', ['Dataset'])
                    return isActiveFunc(filters)
                },
                isFacetVisible: doesAggregationHaveBuckets('data_class'),
                transformFunction: getCreationActionRelationName
            },
            status: {
                label: 'Status',
                type: 'value',
                field: 'status.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset', 'Upload']),
                isFacetVisible: doesAggregationHaveBuckets('status')
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
            'metadata.analyte_class': {
                label: 'Analyte Class',
                type: 'value',
                field: 'metadata.analyte_class.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'term',
                isAggregationActive: doesTermFilterContainValues('entity_type', ['Dataset']),
                isFacetVisible: doesAggregationHaveBuckets('metadata.analyte_class')
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
            'origin_samples.organ': {
                label: 'Organ',
                type: 'value',
                field: 'origin_samples.organ.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                facetType: 'hierarchy',
                groupByField: 'origin_samples.organ_hierarchy.keyword',
                isHierarchyOption: (option) => {
                    return lateralOrgans.includes(option)
                },
                filterSubValues: (value, subValues) => {
                    return subValues.filter((subValue) => {
                        const ubkgName = getUBKGFullName(subValue.key)
                        return ubkgName.startsWith(value)
                    })
                },
                isAggregationActive: [
                    doesTermFilterContainValues('entity_type', ['Dataset']),
                    doesTermFilterContainValues('sample_category', ['Block', 'Section', 'Suspension'])
                ],
                isFacetVisible: doesAggregationHaveBuckets('origin_samples.organ')
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

            // Data processing group
            data_processing_group: {
                label: 'Data Processing',
                facetType: 'group',
                isExpanded: false,
                isFacetVisible: (filters, aggregations, auth, visibleChildren) => {
                    return visibleChildren.length > 0
                },
                facets: {
                    has_rui_information: {
                        label: 'Has Spatial Information',
                        type: 'value',
                        field: 'has_rui_information.keyword',
                        isExpanded: false,
                        tooltipText: `Any entity that either is a tissue block containing spatial registration information or any
                                    tissue Sample or Dataset derived from a block containing spatial registration information
                                    is considered to have spatial information associated with it.`,
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
                        tooltipText: `Any tissue block containing spatial registration information that has an anatomical location associated with it.`,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                        isFacetVisible: doesAggregationHaveBuckets('rui_location_anatomical_locations.label')
                    },
                    has_metadata: {
                        label: 'Has Metadata',
                        type: 'exists',
                        field: 'has_metadata.keyword',
                        isExpanded: false,
                        tooltipText: `Any entity that has metadata associated with it.`,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('entity_type', ['Source', 'Sample', 'Dataset', 'Collection', 'Publication']),
                        isFacetVisible: doesAggregationHaveBuckets('has_metadata')
                    },
                    has_visualization: {
                        label: 'Has Visualization',
                        type: 'exists',
                        field: 'has_visualization.keyword',
                        isExpanded: false,
                        tooltipText: `Any Dataset that has a Vitessce visualization associated with it.`,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: [
                            doesTermFilterContainValues('entity_type', ['Dataset']),
                        ],
                        isFacetVisible: doesAggregationHaveBuckets('has_visualization')
                    },
                    contains_data: {
                        label: 'Contains Data',
                        type: 'value',
                        field: 'contains_data.keyword',
                        isExpanded: false,
                        tooltipText: `Any Sample that has a Dataset in its ancestry is considered to contain data.`,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('entity_type', ['Sample']),
                        isFacetVisible: doesAggregationHaveBuckets('contains_data')
                    },
                    has_qa_published_derived_dataset: {
                        label: 'Has QA Derived Datasets',
                        type: 'value',
                        field: 'has_qa_published_derived_dataset.keyword',
                        isExpanded: false,
                        tooltipText: `Any primary Dataset that has a derived dataset that either has the status of QA or Published.`,
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
                        isFacetVisible: doesAggregationHaveBuckets('has_qa_published_derived_dataset')
                    },
                    has_all_published_datasets: {
                        label: 'Has All Primary Published',
                        type: 'value',
                        field: 'has_all_published_datasets.keyword',
                        isExpanded: false,
                        tooltipText: `Any bulk data Upload where all associated Datasets are  Published.`,
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
                }
            },

            // Source metadata for Datasets
            source_metadata_group: {
                label: 'Source Metadata',
                facetType: 'group',
                isExpanded: false,
                isFacetVisible: (filters, aggregations, auth, visibleChildren) => {
                    return visibleChildren.length > 0
                },
                facets: {
                    'sources.mapped_metadata.sex.value': {
                        label: 'Source Sex',
                        type: 'value',
                        field: 'sources.mapped_metadata.sex.value.keyword',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('sources.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('sources.mapped_metadata.sex.value')
                    },
                    'sources.mapped_metadata.age.value': {
                        label: 'Source Age',
                        type: 'range',
                        field: 'sources.mapped_metadata.age.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('sources.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('sources.mapped_metadata.age.value')
                    },
                    'sources.mapped_metadata.race.value': {
                        label: 'Source Race',
                        type: 'value',
                        field: 'sources.mapped_metadata.race.value.keyword',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('sources.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('sources.mapped_metadata.race.value')
                    },
                    'sources.mapped_metadata.body_mass_index.value': {
                        label: 'Source Body Mass Index',
                        type: 'range',
                        field: 'sources.mapped_metadata.body_mass_index.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('sources.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('sources.mapped_metadata.body_mass_index.value')
                    },

                    // Source metadata for Samples
                    'source.mapped_metadata.sex.value': {
                        label: 'Source Sex',
                        type: 'value',
                        field: 'source.mapped_metadata.sex.value.keyword',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('source.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source.mapped_metadata.sex.value')
                    },
                    'source.mapped_metadata.age.value': {
                        label: 'Source Age',
                        type: 'range',
                        field: 'source.mapped_metadata.age.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('source.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source.mapped_metadata.age.value')
                    },
                    'source.mapped_metadata.race.value': {
                        label: 'Source Race',
                        type: 'value',
                        field: 'source.mapped_metadata.race.value.keyword',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('source.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source.mapped_metadata.race.value')
                    },
                    'source.mapped_metadata.body_mass_index.value': {
                        label: 'Source Body Mass Index',
                        type: 'range',
                        field: 'source.mapped_metadata.body_mass_index.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('source.source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source.mapped_metadata.body_mass_index.value')
                    },
                    // Source metadata
                    'source_mapped_metadata.sex.value': {
                        label: 'Sex',
                        type: 'value',
                        field: 'source_mapped_metadata.sex.value.keyword',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'term',
                        isAggregationActive: doesTermFilterContainValues('source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.sex.value')
                    },
                    'source_mapped_metadata.age.value': {
                        label: 'Age',
                        type: 'range',
                        field: 'source_mapped_metadata.age.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('source_type', ['Human']),
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
                        isAggregationActive: doesTermFilterContainValues('source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.race.value')
                    },
                    'source_mapped_metadata.body_mass_index.value': {
                        label: 'Body Mass Index',
                        type: 'range',
                        field: 'source_mapped_metadata.body_mass_index.value',
                        isExpanded: false,
                        filterType: 'any',
                        isFilterable: false,
                        facetType: 'histogram',
                        aggregationInterval: 1,
                        isAggregationActive: doesTermFilterContainValues('source_type', ['Human']),
                        isFacetVisible: doesAggregationHaveBuckets('source_mapped_metadata.body_mass_index.value')
                    }
                }
            },

            // Dataset processing group
            affiliation_group: {
                label: 'Affiliation',
                facetType: 'group',
                isExpanded: false,
                isFacetVisible: (filters, aggregations, auth, visibleChildren) => {
                    return visibleChildren.length > 0
                },
                facets: {
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
                    }
                }
            },
        },
        disjunctiveFacets: [],
        conditionalFacets: {},
        search_fields: {
            'sennet_id^4': {type: 'value'},
            'uuid^4': {type: 'value'},
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
            'origin_samples.organ',
            'origin_samples.organ_hierarchy',
            'organ',
            'title',
            'description',
            'dataset_type_hierarchy',
            'has_all_published_datasets',
            'primary_dataset_uuid',
            'dataset_category',
            'metadata.analyte_class',
            'sources'
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
