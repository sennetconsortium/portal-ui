import React, {useContext} from 'react';
import DataTable from 'react-data-table-component';
import {getDatasetTypeDisplay, getOrganMeta, getSubtypeProvenanceShape, getUBKGFullName} from "../../js/functions";
import ClipboardCopy from "@/components/ClipboardCopy";
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
                className="icon-inline">{col.sennet_id}</a><ClipboardCopy text={col.sennet_id}
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
        format: row => {
            const subType = row.source_type || row.sample_category || getDatasetTypeDisplay(row)
            return getSubtypeProvenanceShape(subType, row.creation_action)
        }
    })
    columns.push({
        name: 'Organ',
        selector: row => {
            const code = row?.origin_samples?.[0]?.organ || row.organ
            const organ = getUBKGFullName(code)
            return organ || ''
        },
        sortable: true,
        omit: columnVisibility.organ,
        format: row => {
            const code = row?.origin_samples?.[0]?.organ || row.organ
            updateCount('organ', code)
            const organ = getUBKGFullName(code)
            return <span>{organ} {code && <img alt={organ} src={getOrganMeta(code).icon} width={'20px'} />}</span>
        }
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