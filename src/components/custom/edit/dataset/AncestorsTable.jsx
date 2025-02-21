import React, {useEffect, useState, useRef} from 'react';
import {getStatusColor, getStatusDefinition, getUBKGFullName} from '@/components/custom/js/functions'
import Button from 'react-bootstrap/Button';
import SenNetPopover from '@/components/SenNetPopover';
import ClipboardCopy from '@/components/ClipboardCopy';
import DataTable from 'react-data-table-component';
import log from 'loglevel'
import useAutoHideColumns from "@/hooks/useAutoHideColumns";

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
                name: 'Sample Category',
                id: 'sample_category',
                omit: columnVisibility.sample_category,
                selector: row => row.sample_category,
                sortable: true,
                format: col => {
                    updateCount('sample_category', col.sample_category)
                    return col.sample_category
                }
            },
            {
                name: 'Dataset Type',
                id: 'dataset_type',
                omit: columnVisibility.dataset_type,
                selector: row => row.dataset_type,
                sortable: true,
                format: col => {
                    updateCount('dataset_type', col.dataset_type)
                    return col.dataset_type
                }
            },
            {
                name: 'Organ',
                id: 'organ',
                omit: columnVisibility.organ,
                selector: row => {
                    const organs = row.origin_samples?.map((origin_sample) => {
                        return getUBKGFullName(origin_sample.organ_hierarchy)
                    }) || []

                    if (organs.length > 0) {
                        updateCount('organ', true)
                        return organs.join(', ')
                    }
                    return ''
                },
                sortable: true
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
                selector: row => row?.lab_tissue_sample_id || row?.lab_dataset_id,
                sortable: true
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
                        <Button className="pt-0 pb-0"
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
