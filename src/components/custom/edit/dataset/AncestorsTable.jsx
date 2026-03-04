import dynamic from "next/dynamic";
import React from 'react';
import {
    getStatusColor,
    getStatusDefinition,
    getSubtypeProvenanceShape,
} from '@/components/custom/js/functions'
import Button from 'react-bootstrap/Button';
import SenNetPopover from '@/components/SenNetPopover';
import ClipboardCopy from '@/components/ClipboardCopy';

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});
import log from 'loglevel'
import useAutoHideColumns from "@/hooks/useAutoHideColumns";
import {formatOrganRow} from "@/components/custom/TableResultsEntities";

export default function AncestorsTable({formLabel, onChange, deleteAncestor, values, controlId, ancestors, disableDelete}) {
    const {columnVisibility, tableData, updateCount} = useAutoHideColumns( {data: ancestors})

    const _deleteAncestor = async (e, ancestorId) => {
        const old_uuids = [...values[controlId]]
        let updated_uuids = old_uuids.filter(e => e !== ancestorId)
        log.debug(updated_uuids)
        onChange(e, controlId, updated_uuids);
        deleteAncestor(ancestorId);
    }

    const tableColumns = () => {
        return [
            {
                name: `${formLabel.upperCaseFirst()} ID`,
                selector: row => row.sennet_id,
                sortable: true,
                format: col => {
                    return (
                        <span className='pt-1 d-block'>
                            {col.sennet_id}{' '}
                            <ClipboardCopy text={col.sennet_id} title={'Copy SenNet ID {text} to clipboard'}/>
                        </span>
                    )
                }
            },
            {
                name: 'Entity Type',
                selector: row => row.entity_type,
                sortable: true
            },
            {
                name: 'Subtype',
                id: 'sub_type',
                omit: columnVisibility.sub_type,
                selector: row => row.sample_category || row.dataset_type,
                sortable: true,
                format: row => {
                    const subType = row.sample_category || row.dataset_type
                    updateCount('sub_type', subType)
                    return getSubtypeProvenanceShape(subType)
                }
            },
            {
                name: 'Organ',
                id: 'organ',
                omit: columnVisibility.organ,
                selector: row => {
                    return formatOrganRow(row.origin_samples, row, false)
                },
                sortable: true,
                format: row => {
                    const r = formatOrganRow(row.origin_samples, row, false)
                    if (r.length) {
                        updateCount('organ', true)
                    }
                    return formatOrganRow(row.origin_samples, row)
                }
            },
            {
                name: `Status`,
                id: 'status',
                selector: row => row.status,
                sortable: true,
                omit: columnVisibility.status,
                format: col => {
                    updateCount('status', col.status)
                    return (
                        <span className={`${getStatusColor(col?.status)} badge`}>
                            <SenNetPopover text={getStatusDefinition(col?.status)}
                                           className={`status-info-${col.uuid}`}>
                                {col?.status}
                            </SenNetPopover>
                        </span>
                    )
                },
            },
            {
                name: 'Lab ID',
                id: 'lab_id',
                selector: row => {
                    updateCount('lab_id', row?.lab_tissue_sample_id || row?.lab_dataset_id)
                    return row?.lab_tissue_sample_id || row?.lab_dataset_id
                },
                sortable: true,
                omit: columnVisibility.lab_id
            },
            {
                name: 'Group',
                selector: row => row.group_name,
                sortable: true
            },
            {
                name: `Action`,
                selector: row => null,
                sortable: false,
                format: col => {
                    // Disable this button when the dataset is not 'primary'
                    return (
                        <Button className="pt-0 pb-0 btn-delete-ancestor"
                                variant="link"
                                onClick={(e) => _deleteAncestor(e, col.uuid)}
                                disabled={disableDelete}>
                            <i className={'bi bi-trash-fill'} style={{color:"red"}}/>
                        </Button>
                    )
                },
            },
        ]
    }



    return (
        <div className={'table--ancestors'}>
            <DataTable
                columns={tableColumns()}
                data={tableData}
                pagination />
        </div>
    )

}
