import dynamic from "next/dynamic";
import { APP_ROUTES } from '@/config/constants'
import useLocalSettings from '@/hooks/useLocalSettings'
import { getOrganDataTypeQuantities } from '@/lib/services'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});
import { searchUIQueryString } from '../js/functions'
import SenNetAccordion from '../layout/SenNetAccordion'
import {RESULTS_PER_PAGE} from "@/config/config";

/**
 * DataTypeQuantities component displays the quantities for a given organ in a SenNetAccordion.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.id - The id of the SenNetAccordion.
 * @param {import('@/config/organs').Organ} props.organ - The organ to display in the component.
 *
 * @returns {JSX.Element} The JSX code for the HumanReferenceAtlas component.
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

    const searchUrl = `${APP_ROUTES.search}?` + searchUIQueryString([
        { field: 'entity_type', values: ['Dataset'], type: 'any' },
        { field: 'origin_samples.organ', values: organ.codes, type: 'any' }
    ], 20)

    const searchUrlForDatasetType = (types) => {
        return `${APP_ROUTES.search}?` + searchUIQueryString([
            { field: 'entity_type', values: ['Dataset'], type: 'any' },
            { field: 'origin_samples.organ', values: organ.codes, type: 'any' },
            { field: 'dataset_type', values: types, type: 'any' }
        ], 20)
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
                    <Link
                        href={searchUrlForDatasetType(datasetTypes[row.datasetTypeHierarchy])}
                        onClick={handleDatasetTypeRowClick}
                    >
                        {row.datasetTypeHierarchy}
                    </Link>
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
                <Link
                    className='btn btn-outline-primary rounded-0'
                    href={searchUrl}
                    onClick={handleSearchPageClick}
                >
                    View on search page
                </Link>
            </div>
            {datasetTypeHierarchy && (
                <DataTable
                    columns={columns}
                    data={datasetTypeHierarchy}
                    fixedHeader={true}
                    paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                    pagination
                />
            )}
        </SenNetAccordion>
    )
}

export default DataTypeQuantities
