import dynamic from "next/dynamic";
import React, {useRef} from 'react'
import PropTypes from 'prop-types'

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});
import {TableResultsEntities} from "../../TableResultsEntities";
import SenNetAccordion from "../../layout/SenNetAccordion";
import {eq} from "../../js/functions";
import {RESULTS_PER_PAGE} from "@/config/config";
import useAutoHideColumns from "@/hooks/useAutoHideColumns";

function Datasets({ data, label = 'Datasets' }) {
    const currentColumns = useRef([])
    const {columnVisibility, tableData, updateCount} = useAutoHideColumns( {data})

    const getColumns = () => {
        const hasMultipleEntityTypes = !eq(label, 'Datasets')
        const {datasetColumns, defaultColumns} = TableResultsEntities({filters: [{field: 'entity_type', values: ['Dataset']}], currentColumns, children: data, forData: true, rowFn: (row) => row ? row : ''})
        let cols = defaultColumns({hasMultipleEntityTypes, columns: datasetColumns, _isLoggedIn: true})
        for (let c of cols) {
            if (c.id === 'lab_dataset_id') {
                c.omit = columnVisibility.lab_dataset_id
                const format = c.format
                c.format = (row) => {
                    updateCount(c.id, row.lab_dataset_id)
                    return format(row)
                }
            }
        }
        currentColumns.current = cols.filter((col) => col.id !== 'origin_samples.organ' && col.id !== 'origin_samples.organ_hierarchy')
        return currentColumns.current
    }

    return (
        <SenNetAccordion title={label}>
            <DataTable columns={getColumns()} data={tableData} pagination paginationRowsPerPageOptions={RESULTS_PER_PAGE} fixedHeader={true}/>
        </SenNetAccordion>
    )
}

Datasets.propTypes = {
    data: PropTypes.array,
    label: PropTypes.string
}

export default Datasets