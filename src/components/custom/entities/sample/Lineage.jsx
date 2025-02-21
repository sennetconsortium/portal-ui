import React, {useContext} from 'react';
import DataTable from 'react-data-table-component';
import {getDatasetTypeDisplay, getSubtypeProvenanceShape, getUBKGFullName} from "../../js/functions";
import ClipboardCopy from "../../../ClipboardCopy";
import AppContext from "@/context/AppContext";
import {RESULTS_PER_PAGE} from "@/config/config";
import useAutoHideColumns from "@/hooks/useAutoHideColumns";

const Lineage = ({ lineage }) => {
    const {isLoggedIn} = useContext(AppContext)
    const {columnVisibility, tableData, updateCount} = useAutoHideColumns( {data: lineage})

    let columns = []
    columns.push({
        name: 'SenNet ID',
        selector: row => row.sennet_id,
        sortable: false,
        format: col => {
            return <span className={'has-supIcon'}><a
                href={'/' + col.entity_type.toLowerCase() + '?uuid=' + col.uuid}
                className="icon_inline">{col.sennet_id}</a><ClipboardCopy text={col.sennet_id}
                                                                                   size={10}
                                                                                   title={'Copy SenNet ID {text} to clipboard'}/></span>
        }
    })

    columns.push(
        {
            name: 'Entity Type',
            selector: row => row.entity_type,
            sortable: true,
        })
    columns.push({
        name: 'Subtype',
        selector: row => {
            const subType = row.source_type || row.sample_category || getDatasetTypeDisplay(row)
            updateCount('sub_type', subType)
            return subType || ''
        },
        sortable: true,
        omit: columnVisibility.sub_type,
        format: col => {
            const subType = col.source_type || col.sample_category || getDatasetTypeDisplay(col)
            return getSubtypeProvenanceShape(subType, col.creation_action)
        }
    })
    columns.push({
        name: 'Organ',
        selector: row => {
            const organ = getUBKGFullName(row?.origin_samples?.[0]?.organ || row.organ)
            updateCount('organ', organ)
            return organ || ''
        },
        sortable: true,
        omit: columnVisibility.organ,
    })
    if (isLoggedIn()) {
        columns.push({
            name: 'Lab ID',
            selector: row => {
                const labId = row.lab_tissue_sample_id || row.lab_source_id || row.lab_dataset_id
                updateCount('lab_id', labId)
                return labId || ''
            },
            sortable: true,
            omit: columnVisibility.lab_id
        })
    }
    columns.push({
        name: 'Group Name',
        selector: row => row.group_name,
        sortable: true,
    })

    return (
        <DataTable
            columns={columns}
            data={tableData}
            fixedHeader={true}
            paginationRowsPerPageOptions={RESULTS_PER_PAGE}
            pagination/>
    )
}

export default Lineage