import { getUBKGFullName } from "@/components/custom/js/functions";
import { getAuth, getSearchEntitiesIndexEndPoint } from "@/config/config";

function isTermAggregationActive(field, values) {
    return (filters, authenticated) => {
        for (let filter of filters) {
            if (filter.type !== 'term')
                continue
            if (filter.field === field && values.includes(filter.value))
                return true
        }
        return false
    }
}

function isTermFacetVisible(field) {
    return (filters, aggregations) => {
        return aggregations[field] && aggregations[field].length > 0
    }
}

function isDateFacetVisible(filters, aggregations) {
    return Object.keys(aggregations).length > 0
}

export const SEARCH_ENTITIES = {
    connection: {
        url: getSearchEntitiesIndexEndPoint(),
        token: getAuth,
    },
    initial: {
        filters: [],
        sort: {
            field: "last_modified_timestamp",
            order: "desc"
        },
        pageNumber: 1,
        pageSize: 10,
    },
    trackTotalHits: true,
    trackUrlState: true,
    facets: [
        {
            label: 'Entity Type',
            name: 'entity_type',
            field: 'entity_type.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('entity_type'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Source Type',
            name: 'source_type',
            field: 'source_type.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Source']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('source_type'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Sample Category',
            name: 'sample_category',
            field: 'sample_category.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Sample']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('sample_category'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Dataset Type',
            name: 'dataset_type',
            field: 'dataset_type.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('dataset_type'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Source Type',
            name: 'sources.source_type',
            field: 'sources.source_type.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Dataset']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('sources.source_type'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Organ',
            name: 'organ',
            field: 'organ.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Sample']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('organ'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Organ',
            name: 'origin_sample.organ',
            field: 'origin_sample.organ.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: (filters, authenticated) => {
                    for (let filter of filters) {
                        if (filter.type !== 'term')
                            continue
                        if (filter.field === 'entity_type' && filter.value === 'Dataset')
                            return true
                        if (filter.field === 'sample_category' && ['Block', 'Section', 'Suspension'].includes(filter.value))
                            return true
                    }
                    return false
                },
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('origin_sample.organ'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Source Type',
            name: 'source.source_type',
            field: 'source.source_type.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Sample']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('source.source_type'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Is Spatially Registered',
            name: 'has_rui_information',
            field: 'has_rui_information.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('has_rui_information'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Anatomical Locations',
            name: 'rui_location_anatomical_locations.label',
            field: 'rui_location_anatomical_locations.label.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Sample']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('rui_location_anatomical_locations.label'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Has Metadata',
            name: 'has_metadata',
            field: 'has_metadata.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: (filters, authenticated) => {
                    for (let filter of filters) {
                        if (filter.type !== 'term')
                            continue
                        if (filter.field === 'entity_type' && ['Source', 'Collection', 'Publication'].includes(filter.value))
                            return true
                        if (filter.field === 'sample_category' && ['Block', 'Section', 'Suspension'].includes(filter.value))
                            return true
                    }
                    return false
                },
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('has_metadata'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Has Metadata',
            name: 'ingest_metadata.metadata',
            field: 'ingest_metadata.metadata.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: isTermAggregationActive('entity_type', ['Dataset']),
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('ingest_metadata.metadata'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Status',
            name: 'status',
            field: 'status.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('status'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Data Provider Group',
            name: 'group_name',
            field: 'group_name.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('group_name'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Registered By',
            name: 'created_by_user_displayname',
            field: 'created_by_user_displayname.keyword',
            type: 'term',
            aggregation: {
                type: 'term',
                isActive: true,
                size: 40,
            },
            transformFunction: getUBKGFullName,
            isVisible: isTermFacetVisible('created_by_user_displayname'),
            isOptionVisible: (option, _, _) => option.count > 0
        },
        {
            label: 'Creation Date',
            name: 'created_timestamp',
            field: 'created_timestamp',
            type: 'daterange',
            isVisible: isDateFacetVisible
        },
        {
            label: 'Modification Date',
            name: 'last_modified_timestamp',
            field: 'last_modified_timestamp',
            type: 'daterange',
            isVisible: isDateFacetVisible
        },
    ],
    exclude: [
        { type: 'term', field: 'entity_type.keyword', value: 'Publication' },
        { type: 'term', field: 'dataset_category.keyword', value: 'codcc-processed' },
        { type: 'term', field: 'dataset_category.keyword', value: 'lab-processed' },
    ],
    sourceFields: [
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
    ],
}
