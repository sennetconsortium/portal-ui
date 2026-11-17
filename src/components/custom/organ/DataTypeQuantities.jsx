import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import { RESULTS_PER_PAGE } from '@/config/config'
import useLocalSettings from '@/hooks/useLocalSettings'
import { getOrganDataTypeQuantities } from '@/lib/services'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import DataTypeQuantitiesChart from './DataTypeQuantitiesChart'
import { APP_ROUTES } from '@/config/constants';
import { SEARCH_ENTITIES } from '@/config/search/entities';
import { encodeSearchQueryParam } from "@/search-ui/lib/search-tools";

const DataTable = dynamic(() => import('react-data-table-component'), {
    ssr: false
})

/**
 * Displays dataset type counts for an organ in a table.
 *
 * @param {Object} props Component props.
 * @param {string} props.id Accordion element id.
 * @param {import('@/config/organs').Organ} props.organ Organ metadata used to filter dataset quantities.
 * @returns {JSX.Element}
 */
const DataTypeQuantities = ({ id, organ }) => {
    const { setLocalSettings } = useLocalSettings()
    const [datasetTypeHierarchy, setDatasetTypeHierarchy] = useState(null)
    const [datasetTypes, setDatasetTypes] = useState(null)

    useEffect(() => {
        const getQuantities = async () => {
            const qtys = await getOrganDataTypeQuantities(organ.codes)
            const hierarchy = Object.entries(qtys['dataset_type_hierarchy'] || []).map((qty) => {
                return { datasetTypeHierarchy: qty[0], count: qty[1] }
            })
            setDatasetTypeHierarchy(hierarchy)

            setDatasetTypes(qtys['dataset_types'])
        }
        getQuantities()
    }, [organ])

    const searchUrl = (organCodes) => {
        return (
            APP_ROUTES.search + "?s=" +
            encodeSearchQueryParam(
                [
                    { field: 'entity_type', values: ['Dataset'] },
                    { field: 'origin_samples.organ.keyword', values: organCodes }
                ],
                SEARCH_ENTITIES.searchQuery.facets
            )
        )
    }

    const searchUrlForDatasetType = (types, organCodes) => {
        return (
            APP_ROUTES.search + "?s=" +
            encodeSearchQueryParam(
                [
                    { field: 'entity_type', values: ['Dataset'] },
                    { field: 'origin_samples.organ.keyword', values: organCodes },
                    { field: 'dataset_type_hierarchy.dataset_type.keyword', values: types }
                ],
                SEARCH_ENTITIES.searchQuery.facets
            )
        )
    }

    const handleSearchPageClick = (e) => {
        e.preventDefault()
        // Expand the relevant facets on the search page
        setLocalSettings('entities', {
            entity_type: { isExpanded: true },
            'origin_samples.organ': { isExpanded: true }
        })
        window.location = e.target.href
    }

    const handleDatasetTypeRowClick = (e) => {
        e.preventDefault()
        // Expand the relevant facets on the search page
        setLocalSettings('entities', {
            entity_type: { isExpanded: true },
            'origin_samples.organ': { isExpanded: true },
            dataset_type: { isExpanded: true }
        })
        window.location = e.target.href
    }

    const columns = [
        {
            name: 'Dataset Type',
            sortable: true,
            cell: (row, index, column, id) => {
                return (
                    <a
                        href={searchUrlForDatasetType(datasetTypes[row.datasetTypeHierarchy], organ.codes)}
                        onClick={handleDatasetTypeRowClick}
                    >
                        {row.datasetTypeHierarchy}
                    </a>
                )
            }
        },
        {
            name: 'Count',
            selector: (row) => row.count,
            sortable: true
        }
    ]

    return (
        <SenNetAccordion id={id} title='Dataset Types' afterTitle={undefined}>
            <div className='d-flex flex-row-reverse'>
                <a
                    className='btn btn-outline-primary '
                    href={searchUrl(organ.codes)}
                    onClick={handleSearchPageClick}
                >
                    View on search page
                </a>
            </div>
            {datasetTypeHierarchy && (
                <DataTable
                    className='rdt_Results'
                    columns={columns}
                    data={datasetTypeHierarchy}
                    fixedHeader={true}
                    paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                    pagination
                />
            )}
            <DataTypeQuantitiesChart organ={organ} />
        </SenNetAccordion>
    )
}

export default DataTypeQuantities
