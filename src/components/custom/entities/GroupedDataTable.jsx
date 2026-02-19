import dynamic from "next/dynamic";
import PropTypes from 'prop-types'

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

/**
 * Component that displaying grouped metadata in a DataTable.
 *
 * @component
 * @param {Object} props - The props object for the GroupedDataTable component
 * @param {Record<string, string>} props.metadata - The metadata object. Key is the metadata key and value is the metadata value
 * @param {Record<string, string>} props.groups - The groups map. Key is the metadata key and value is the group name
 */
function GroupedDataTable({ metadata, groups }) {
    const tableStyles = {
        rows: {
            style: {
                fontWeight: 'bold'
            }
        }
    }

    const columns = [
        {
            name: 'Key',
            selector: (row) => row.name,
            sortable: true,
            wrap: true,
            style: {
                'padding-top': '16px',
                'padding-bottom': '16px',
            }
        },
        {
            name: 'Value',
            selector: () => null,
            sortable: true,
            wrap: true,
            style: {
                'padding-top': '16px',
                'padding-bottom': '16px',
            }
        }
    ]

    const groupSourceMappedMetadata = (metadata) => {
        const g = []
        for (const [key, value] of Object.entries(metadata)) {
            const groupName = groups[key]
            const groupIndex = g.findIndex((group) => group.name === groupName)
            if (groupIndex !== -1) {
                g[groupIndex].data.push({ key: key, value: value })
            } else {
                g.push({ name: groupName, data: [{ key: key, value: value }] })
            }
        }
        return g
    }

    const tableRow = ({ data }) => {
        if (data.length === 0) {
            return null
        }

        return data.data.map((row) => {
            return (
                <div key={row.key} className='d-flex ms-5 py-2 border-bottom'>
                    <div className='w-50 ps-3' style={{ fontSize: '13px' }}>
                        {row.key}
                    </div>
                    <div className='w-50 ps-3' style={{ fontSize: '13px' }}>
                        {row.value}
                    </div>
                </div>
            )
        })
    }

    return (
        <DataTable
            className='pb-4'
            columns={columns}
            customStyles={tableStyles}
            data={groupSourceMappedMetadata(metadata)}
            expandableRows
            fixedHeader={true}
            expandableRowExpanded={() => true}
            expandableRowsComponent={tableRow}
            expandOnRowClicked/>
    )
}

GroupedDataTable.propTypes = {
    metadata: PropTypes.object.isRequired,
    groups: PropTypes.object.isRequired,
}

export default GroupedDataTable
