import dynamic from "next/dynamic";
import PropTypes from 'prop-types'

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import {eq} from "@/components/custom/js/functions";


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
                name: 'Contact',
                selector: row => row.email || '',
                sortable: true,
                format: row => {
                    let view = <></>
                    if (eq(row.is_contact, 'yes') || eq(row.is_contact, 'true')) {
                        view = row.email ? <span><a href={`mailto:${row.email}`}>{row.email}</a></span> :
                            <span>No email provided.</span>
                    }
                    return view;
                }
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

ContributorsContacts.propTypes = {
    data: PropTypes.array
}

export default ContributorsContacts