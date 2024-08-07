import {FilterIsSelected, getAuth, getEntitiesIndex, getSearchEndPoint} from "../config";
import SearchAPIConnector from "search-ui/packages/search-api-connector";

const connector = new SearchAPIConnector({
    indexName: getEntitiesIndex(),
    indexUrl: getSearchEndPoint(),
    accessToken: getAuth(),
})

export const SEARCH_METADATA = {
    alwaysSearchOnInitialLoad: true,
    searchQuery: {
        excludeFilters: [
            {
                keyword: "entity_type.keyword",
                value: "Collection"
            },
            {
                keyword: "entity_type.keyword",
                value: "Publication"
            },
            {
                keyword: "sample_category.keyword",
                value: "Organ",
            },
            {
                keyword: "dataset_category.keyword",
                value: ["codcc-processed", "lab-processed"]
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
            },
            source_type: {
                label: 'Source Type',
                type: 'value',
                field: 'source_type.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            sample_category: {
                label: 'Sample Category',
                type: 'value',
                field: 'sample_category.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            dataset_type: {
                label: 'Dataset Type',
                type: 'value',
                field: 'dataset_type.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Source Human
            "source_mapped_metadata.sex.value": {
                label: 'Sex',
                type: 'value',
                field: 'source_mapped_metadata.sex.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "source_mapped_metadata.race.value": {
                label: 'Race',
                type: 'value',
                field: 'source_mapped_metadata.race.value.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "source_mapped_metadata.age.value": {
                label: 'Age',
                type: 'range',
                field: 'source_mapped_metadata.age.value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: 1,
            },
            "source_mapped_metadata.body_mass_index.value": {
                label: 'Body Mass Index',
                type: 'range',
                field: 'source_mapped_metadata.body_mass_index.value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: 1,
            },

            // Source Mouse
            "metadata.strain": {
                label: 'Strain',
                type: 'value',
                field: 'metadata.strain.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.sex": {
                label: 'Sex',
                type: 'value',
                field: 'metadata.sex.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.is_embryo": {
                label: 'Is Embryo',
                type: 'value',
                field: 'metadata.is_embryo.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.is_deceased": {
                label: 'Is Deceased',
                type: 'value',
                field: 'metadata.is_deceased.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.euthanization_method": {
                label: 'Euthanization Method',
                type: 'value',
                field: 'metadata.euthanization_method.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Sample Block
            "metadata.volume_value": {
                label: 'Volume',
                type: 'range',
                field: 'metadata.volume_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: (filters) => {
                    if (filters.some((filter) => filter.values.includes('ml'))) {
                        return 0.1
                    }
                    return 1000
                },
            },
            "metadata.volume_unit": {
                label: 'Volume Unit',
                type: 'value',
                field: 'metadata.volume_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Sample Section
            "metadata.thickness_value": {
                label: 'Thickness',
                type: 'range',
                field: 'metadata.thickness_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: (filters) => {
                    if (filters.some((filter) => filter.values.includes('um'))) {
                        return 1
                    }
                    return 0.1
                },
            },
            "metadata.thickness_unit": {
                label: 'Thickness Unit',
                type: 'value',
                field: 'metadata.thickness_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.area_value": {
                label: 'Area',
                type: 'range',
                field: 'metadata.area_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
            },
            "metadata.area_unit": {
                label: 'Area Unit',
                type: 'value',
                field: 'metadata.area_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Sample Suspension
            "metadata.suspension_entity_type": {
                label: 'Suspension Entity Type',
                type: 'value',
                field: 'metadata.suspension_entity_type.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.suspension_entity_count": {
                label: 'Suspension Entity Number',
                type: 'range',
                field: 'metadata.suspension_entity_count',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: 100000,
            },
            "metadata.is_suspension_enriched": {
                label: 'Is Suspension Enriched',
                type: 'value',
                field: 'metadata.is_suspension_enriched.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Sample Block/Suspension Shared
            "metadata.tissue_weight_value": {
                label: 'Tissue Weight',
                type: 'range',
                field: 'metadata.tissue_weight_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: 5,
            },
            "metadata.tissue_weight_unit": {
                label: 'Tissue Weight Unit',
                type: 'value',
                field: 'metadata.tissue_weight_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Sample Shared
            "metadata.source_storage_duration_value": {
                label: 'Storage Duration',
                type: 'range',
                field: 'metadata.source_storage_duration_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
                uiInterval: (filters) => {
                    if (filters.some((filter) => filter.values.includes('day'))) {
                        return 5
                    }
                    if (filters.some((filter) => filter.values.includes('month'))) {
                        return 0.1
                    }
                    return 1
                },
            },
            "metadata.source_storage_duration_unit": {
                label: 'Storage Duration Unit',
                type: 'value',
                field: 'metadata.source_storage_duration_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.preparation_medium": {
                label: 'Preparation Medium',
                type: 'value',
                field: 'metadata.preparation_medium.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.preparation_condition": {
                label: 'Preparation Condition',
                type: 'value',
                field: 'metadata.preparation_condition.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.storage_medium": {
                label: 'Storage Medium',
                type: 'value',
                field: 'metadata.storage_medium.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.storage_method": {
                label: 'Preparation Method',
                type: 'value',
                field: 'metadata.storage_method.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            "metadata.processing_time_value": {
                label: 'Processing Time',
                type: 'range',
                field: 'metadata.processing_time_value',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
                uiType: 'numrange',
            },
            "metadata.processing_time_unit": {
                label: 'Processing Time Unit',
                type: 'value',
                field: 'metadata.processing_time_unit.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },

            // Dataset
            "metadata.metadata.assay_category": {
                label: 'Assay Category',
                type: 'value',
                field: 'metadata.metadata.assay_category.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.metadata.analyte_class": {
                label: 'Analyte Class',
                type: 'value',
                field: 'metadata.metadata.analyte_class.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.metadata.operator": {
                label: 'Operator',
                type: 'value',
                field: 'metadata.metadata.operator.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.metadata.acquisition_instrument_model": {
                label: 'Acquisition Instrument Model',
                type: 'value',
                field: 'metadata.metadata.acquisition_instrument_model.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
            "metadata.metadata.acquisition_instrument_vendor": {
                label: 'Acquisition Instrument Vendor',
                type: 'value',
                field: 'metadata.metadata.acquisition_instrument_vendor.keyword',
                isExpanded: false,
                filterType: 'any',
                isFilterable: false,
            },
        },
        disjunctiveFacets: [],
        conditionalFacets: {
            source_type: FilterIsSelected('entity_type', 'Source'),
            sample_category: FilterIsSelected('entity_type', 'Sample'),

            // Source Human
            "source_mapped_metadata.sex": FilterIsSelected('source_type', 'Human'),
            "source_mapped_metadata.race": FilterIsSelected('source_type', 'Human'),
            "source_mapped_metadata.age.value": FilterIsSelected('source_type', 'Human'),
            "source_mapped_metadata.body_mass_index.value": FilterIsSelected('source_type', 'Human'),

            // Source Mouse
            "metadata.strain": FilterIsSelected('source_type', 'Mouse'),
            "metadata.sex": FilterIsSelected('source_type', 'Mouse'),
            "metadata.is_embryo": FilterIsSelected('source_type', 'Mouse'),
            "metadata.is_deceased": FilterIsSelected('source_type', 'Mouse'),
            "metadata.euthanization_method": FilterIsSelected('source_type', 'Mouse'),

            // Sample Block
            "metadata.volume_unit": FilterIsSelected('sample_category', 'Block'),
            "metadata.volume_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.volume_unit')
            },

            // Sample Section
            "metadata.thickness_unit": FilterIsSelected('sample_category', 'Section'),
            "metadata.thickness_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.thickness_unit')
            },
            "metadata.area_unit": FilterIsSelected('sample_category', 'Section'),
            "metadata.area_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.area_unit')
            },

            // Sample Suspension
            "metadata.suspension_entity_type": FilterIsSelected('sample_category', 'Suspension'),
            "metadata.suspension_entity_count": FilterIsSelected('sample_category', 'Suspension'),
            "metadata.is_suspension_enriched": FilterIsSelected('sample_category', 'Suspension'),

            // Sample Block/Suspension Shared
            "metadata.tissue_weight_unit": ({filters}) => {
                return filters.some(
                    (filter) =>
                        filter.field === 'sample_category' &&
                        (filter.values.includes('Block') || filter.values.includes('Suspension'))
                )
           }, 
            "metadata.tissue_weight_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.tissue_weight_unit')
            }, 

            // Sample Shared
            "metadata.source_storage_duration_unit": FilterIsSelected('entity_type', 'Sample'),
            "metadata.source_storage_duration_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.source_storage_duration_unit')
            }, 
            "metadata.preparation_medium": FilterIsSelected('entity_type', 'Sample'),
            "metadata.preparation_condition": FilterIsSelected('entity_type', 'Sample'),
            "metadata.storage_medium": FilterIsSelected('entity_type', 'Sample'),
            "metadata.storage_method": FilterIsSelected('entity_type', 'Sample'),
            "metadata.processing_time_unit": FilterIsSelected('entity_type', 'Sample'),
            "metadata.processing_time_value": ({filters}) => {
                return filters.some((filter) => filter.field === 'metadata.processing_time_unit')
            }, 

            // Dataset
            "metadata.metadata.assay_category": FilterIsSelected('entity_type', 'Dataset'),
            "metadata.metadata.analyte_class": FilterIsSelected('entity_type', 'Dataset'),
            "metadata.metadata.operator": FilterIsSelected('entity_type', 'Dataset'),
            "metadata.metadata.acquisition_instrument_model": FilterIsSelected('entity_type', 'Dataset'),
            "metadata.metadata.acquisition_instrument_vendor": FilterIsSelected('entity_type', 'Dataset'),
        },
        search_fields: {
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
            'group_name',
            'source_type',
            'dataset_type',
            'status',
            'origin_sample.organ',
            'organ',
            'title',
            'description',
        ],
    },
    initialState: {
        resultsPerPage: 10000,
        sortList: [{
            field: "last_modified_timestamp",
            direction: "desc"
        }]
    },
    trackUrlState: true,
    apiConnector: connector,
    hasA11yNotifications: true,
    a11yNotificationMessages: {
        searchResults: ({start, end, totalResults, searchTerm}) =>
            `Searching for "${searchTerm}". Showing ${start} to ${end} results out of ${totalResults}.`,
    },
    discover: [
        {
            title: 'All Human Sources',
            description: 'Human sources of all ages and sexes.',
            entityType: 'source',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Source&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=source_type&filters%5B1%5D%5Bvalues%5D%5B0%5D=Human&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'C57BL/6 Mouse Sources',
            description: 'Mouse sources from the C57BL/6 strain',
            entityType: 'source',
            queryString: 'size=n_10000_n&filters[0][field]=entity_type&filters[0][values][0]=Source&filters[0][type]=any&filters[1][field]=source_type&filters[1][values][0]=Mouse&filters[1][type]=any&filters[2][field]=metadata.strain&filters[2][values][0]=C57BL%2F6&filters[2][type]=any&sort[0][field]=last_modified_timestamp&sort[0][direction]=desc'
        },
        {
            title: 'All Mouse Sources',
            description: 'Mouse sources of all strains, sexes, and embryo statuses.',
            entityType: 'source',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Source&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=source_type&filters%5B1%5D%5Bvalues%5D%5B0%5D=Mouse&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'All Block Samples',
            description: 'Block samples of all weights, volumes, and preparation conditions.',
            entityType: 'sample',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Sample&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=sample_category&filters%5B1%5D%5Bvalues%5D%5B0%5D=Block&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'All Section Samples',
            description: 'Section samples of all thicknesses and preparation conditions.',
            entityType: 'sample',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Sample&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=sample_category&filters%5B1%5D%5Bvalues%5D%5B0%5D=Section&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'All Suspension Samples',
            description: 'Suspension samples of all entity types, enrichment, and preparation conditions.',
            entityType: 'sample',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Sample&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=sample_category&filters%5B1%5D%5Bvalues%5D%5B0%5D=Suspension&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'All Nucleic Datasets',
            description: 'Datasets with the nucleic acid and protein analyte class.',
            entityType: 'dataset',
            queryString: 'size=n_10000_n&filters[0][field]=entity_type&filters[0][values][0]=Dataset&filters[0][type]=any&filters[1][field]=metadata.metadata.analyte_class&filters[1][values][0]=Nucleic acid and protein&filters[1][type]=any&sort[0][field]=last_modified_timestamp&sort[0][direction]=desc'

        },
        {
            title: 'All RNA Datasets',
            description: 'Datasets with the RNA analyte class.',
            entityType: 'dataset',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Dataset&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=metadata.metadata.analyte_class&filters%5B1%5D%5Bvalues%5D%5B0%5D=RNA&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
        {
            title: 'All Sequence Datasets',
            description: 'Datasets with the sequence assay category.',
            entityType: 'dataset',
            queryString: 'size=n_10000_n&filters%5B0%5D%5Bfield%5D=entity_type&filters%5B0%5D%5Bvalues%5D%5B0%5D=Dataset&filters%5B0%5D%5Btype%5D=any&filters%5B1%5D%5Bfield%5D=metadata.metadata.assay_category&filters%5B1%5D%5Bvalues%5D%5B0%5D=sequence&filters%5B1%5D%5Btype%5D=any&sort%5B0%5D%5Bfield%5D=last_modified_timestamp&sort%5B0%5D%5Bdirection%5D=desc'
        },
    ],
}
