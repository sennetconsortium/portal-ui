import React from 'react'
import PropTypes from 'prop-types'
import DataTable from 'react-data-table-component'
import {TableResultsEntities} from "../../TableResultsEntities";
import SenNetAccordion from "../../layout/SenNetAccordion";

function Datasets({ data }) {

    const getColumns = () => {
        const {datasetColumns, defaultColumns} = TableResultsEntities({forData: true, rowFn: (row) => row ? row : null})
        return defaultColumns({hasMultipleEntityTypes: false, columns: datasetColumns, _isLoggedIn: true})
    }

    return (
        <SenNetAccordion title={'Datasets'}>
            <DataTable columns={getColumns()} data={data} pagination />
        </SenNetAccordion>
    )
}

Datasets.defaultProps = {}

Datasets.propTypes = {
    data: PropTypes.array
}

export default Datasets