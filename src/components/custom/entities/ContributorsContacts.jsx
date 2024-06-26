import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import DataTable, { createTheme } from 'react-data-table-component'
import SenNetAccordion from "../layout/SenNetAccordion";

function ContributorsContacts({data, title}) {
    const getColumns = () => {
        return [
            {
                name: 'Name',
                selector: row => row.name ? row.name : (row.first_name +' '+row.last_name),
                sortable: true
            },
            {
                name: 'Affiliation',
                selector: row => row.affiliation,
                sortable: true
            },
            {
                name: 'ORCID',
                selector: row => row.orcid ? row.orcid : row.orcid_id,
                sortable: true,
                format: row => <a className='lnk--ic'
                                  href={`https://orcid.org/${row.orcid ? row.orcid : row.orcid_id}`}>{row.orcid ? row.orcid : row.orcid_id}
                    <i className="bi bi-box-arrow-up-right"></i></a>,
            }
        ]
    }

    return (
        <SenNetAccordion title={title}>
            <DataTable columns={getColumns()} data={data} pagination fixedHeader={true} />
        </SenNetAccordion>

    )
}

ContributorsContacts.defaultProps = {}

ContributorsContacts.propTypes = {
    data: PropTypes.array
}

export default ContributorsContacts