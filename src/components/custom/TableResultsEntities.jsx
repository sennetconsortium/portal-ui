import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {
    checkFilterType,
    checkMultipleFilterType,
    displayBodyHeader, eq, getEntityViewUrl, getUBKGFullName,
    getStatusColor, getStatusDefinition, matchArrayOrder
} from './js/functions'
import AppContext from "../../context/AppContext"
import log from 'loglevel'
import ClipboardCopy from "../ClipboardCopy";
import BulkExport, {handleCheckbox} from "./BulkExport";
import {getOptions} from "./search/ResultsPerPage";
import ResultsBlock from "./search/ResultsBlock";
import {TableResultsProvider} from "@/context/TableResultsContext";
import SenNetPopover from "../SenNetPopover";
import {Chip} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AppModal from "../AppModal";
import {parseJson} from "@/lib/services";
import {COLS_ORDER_KEY} from "@/config/config";

function TableResultsEntities({children, filters, onRowClicked, currentColumns, forData = false, rowFn, inModal = false, rawResponse}) {

    let hasMultipleEntityTypes = checkMultipleFilterType(filters);
    const {isLoggedIn, cache, getGroupName} = useContext(AppContext)
    currentColumns = currentColumns || useRef([])
    const hiddenColumns = useRef(null)
    const [showModal, setShowModal] = useState(false)
    const [modalTitle, setModalTitle] = useState(null)
    const [modalBody, setModalBody] = useState(null)
    const defaultHiddenColumns = {SourceType:'Type', SampleCategory:'Category', DatasetType:'Dataset Type', Status:'Status'}
    const tableContext = useRef(null)

    const raw = rowFn ? rowFn : ((obj) => obj ? obj.raw || '' : '')

    useEffect(() => {
        // Reset this since on filter change the hidden columns dropdown gets reset on ln63 ColumnsDropdown
        hiddenColumns.current = {}
    }, [filters])

    const getHotLink = (row) => getEntityViewUrl(raw(row.entity_type)?.toLowerCase(), raw(row.uuid), {})

    const getId = (column) => column.id || column.uuid

    const handleModal = (row) => {
        setShowModal(true)
        setModalBody(<span>{raw(row.description)}</span>)
        setModalTitle(<h5>Description for <code>{raw(row.sennet_id)}</code><ClipboardCopy text={raw(row.sennet_id)} /></h5>)
    }

    const defaultColumns = ({hasMultipleEntityTypes = true, columns = [], includeGroupCol = true}) => {
        let cols = []
        if (!inModal) {
            cols.push({
                id: 'bulkExport',
                ignoreRowClick: true,
                name: <BulkExport filters={filters} data={children} raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns} />,
                width: '100px',
                className: 'text-center',
                selector: row => raw(row.sennet_id),
                sortable: false,
                format: column => <input type={'checkbox'} onClick={(e) => handleCheckbox(e)} value={getId(column)} name={`check-${getId(column)}`}/>
            })
        }

        cols.push(
            {
                name: 'SenNet ID',
                id: 'sennet_id',
                selector: row => raw(row.sennet_id),
                sortable: true,
                reorder: true,
                format: column => inModal ? raw(column.sennet_id) : <span data-field='sennet_id' className='has-supIcon'><a href={getHotLink(column)}>{raw(column.sennet_id)}</a> <ClipboardCopy text={raw(column.sennet_id)} title={'Copy SenNet ID {text} to clipboard'} /></span>,
            },
        )
        if (hasMultipleEntityTypes) {
            cols.push({
                name: 'Entity Type',
                id: 'entity_type',
                selector: row => raw(row.entity_type),
                sortable: true,
                reorder: true,
                format: row => <span data-field='entity_type'>{raw(row.entity_type)}</span>,
            })
        }
        cols = cols.concat(columns)
        if (includeGroupCol) {
            cols.push({
                name: 'Group',
                id: 'group_name',
                selector: row => raw(row.group_name),
                sortable: true,
                reorder: true,
                format: row => <span data-field='group_name'>{getGroupName({group_name: raw(row.group_name), group_uuid: raw(row.group_uuid)})}</span>,
            })
        }

        return cols;
    }

    const reusableColumns = {}
    reusableColumns['Status'] = {
        name: 'Status',
        id: 'status',
        selector: row => raw(row.status),
        format: (row) => <span className={`${getStatusColor(raw(row.status))} badge`}><SenNetPopover
            text={getStatusDefinition(raw(row.status))}
            className={`status-info-${getId(row)}`}>{raw(row.status)}</SenNetPopover></span>,
        sortable: true,
        reorder: true,
    }

    reusableColumns['Organ'] = {
        name: 'Organ',
        id: 'origin_samples.organ_hierarchy',
        selector: row => {
            let organs = []
            if(row.origin_samples) {
                raw(row.origin_samples).forEach((origin_sample) => {
                    organs.push(getUBKGFullName(origin_sample.organ_hierarchy))
                })
                if (organs.length > 0) {
                    return organs.join(', ')
                }
            }
            return ''
        },
        sortable: true,
        reorder: true,
    }

    reusableColumns['SourceType'] = {
        name: 'Type',
        id: 'source_type',
        selector: row => raw(row.source_type),
        sortable: true,
        reorder: true,
    }

    reusableColumns['SampleCategory'] = {
        name: 'Category',
        id: 'sample_category',
        selector: row => raw(row.sample_category) ? displayBodyHeader(raw(row.sample_category)) : '',
        sortable: true,
        reorder: true,
    }

    reusableColumns['DatasetType'] = {
        name: 'Dataset Type',
        id: 'dataset_type',
        selector: row => {
            let val = raw(row.dataset_type_hierarchy)?.second_level || raw(row.dataset_type)
            if (val) {
                return Array.isArray(val) ? getUBKGFullName(val[0]) : val
            } else {
                return ''
            }
        },
        sortable: true,
        reorder: true,
    }

    if (isLoggedIn()) {
        reusableColumns['LabSourceID'] = {
            name: 'Lab Source ID',
            id: 'lab_source_id',
            selector: row => {
                return raw(row.lab_source_id)
            },
            format: row => <span data-field='lab_source_id'>{raw(row.lab_source_id)}</span>,
            sortable: true,
            reorder: true,
        }

        reusableColumns['LabSampleID'] = {
            name: 'Lab Sample ID',
            id: 'lab_tissue_sample_id',
            selector: row => {
                return raw(row.lab_tissue_sample_id)
            },
            format: row => <span data-field='lab_tissue_sample_id'>{raw(row.lab_tissue_sample_id)}</span>,
            sortable: true,
            reorder: true,
        }

        reusableColumns['LabDatasetID'] = {
            name: 'Lab Dataset ID',
            id: 'lab_dataset_id',
            selector: row => {
                return raw(row.lab_dataset_id)
            },
            format: row => <span data-field='lab_dataset_id'>{raw(row.lab_dataset_id)}</span>,
            sortable: true,
            reorder: true,
        }
    }


    const sourceColumns = [
        reusableColumns.SourceType
    ]
    if(isLoggedIn()){
        sourceColumns.push(reusableColumns.LabSourceID)
    }

    const sampleColumns = [
        reusableColumns.SampleCategory,
        reusableColumns.Organ,
    ]
    if(isLoggedIn()){
        sampleColumns.push(reusableColumns.LabSampleID)
    }

    const datasetColumns = [
        reusableColumns.DatasetType,
        reusableColumns.Organ,
        reusableColumns.Status
    ]
     if(isLoggedIn()){
        datasetColumns.push(reusableColumns.LabDatasetID)
    }

    const uploadColumns = [
        {
            name: 'Title',
            id: 'title',
            selector: row => raw(row.title),
            sortable: true,
            reorder: true,
        },
        {
            name: 'Description',
            id: 'description',
            selector: row => raw(row.description),
            sortable: true,
            reorder: true,
            format: (row) => {
                const max = 100
                const desc = raw(row.description)
                if (!desc) {
                    return null
                }
                return (<div>
                    {desc.length > max ? desc.slice(0, max) : desc}
                    {desc.length > max && <SenNetPopover text={'Read full details'} className={`popover-${getId(row)}`}>
                        <Chip label={<MoreHorizIcon />} size="small" onClick={()=> handleModal(row)} />
                    </SenNetPopover>}
                </div>)
            }
        },
        reusableColumns.Status
    ]

    const collectionColumns = [
        {
            name: 'Title',
            id: 'title',
            selector: row => raw(row.title),
            sortable: true,
            reorder: true,
        },
        {
            name: 'Description',
            id: 'description',
            selector: row => raw(row.description),
            sortable: true,
            reorder: true,
        }
    ]

    const publicationColumns = [
        {
            name: 'Title',
            id: 'title',
            selector: row => raw(row.title),
            sortable: true,
            reorder: true,
        }
    ]

    const getTableColumns = (columnsToHide) => {
        let cols;
        if (checkFilterType(filters) === false) {
            tableContext.current = 'default'
            cols = defaultColumns({});
            if (!filters || !filters.length) {
                for (let colKey of Object.keys(defaultHiddenColumns)) {
                    reusableColumns[colKey].omit = true
                    cols.push(reusableColumns[colKey])
                }
            }
        } else {
            let typeIndex = 0;
            cols = filters.map((filter, index) => {
                let columns = []
                if (filter.field === 'entity_type') {
                    typeIndex = index
                    const hasOneEntity = filter.values.length === 1
                    const entityType = filter.values[0]
                    let includeLabIdCol = true
                    let includeGroupCol = true
                    tableContext.current = entityType
                    if (hasOneEntity && eq(entityType, cache.entities.source)) {
                        columns = sourceColumns
                    } else if (hasOneEntity && eq(entityType, cache.entities.sample)) {
                        columns = sampleColumns
                    } else if (hasOneEntity && eq(entityType, cache.entities.dataset)) {
                        columns = datasetColumns
                    } else if (hasOneEntity && eq(entityType, cache.entities.upload)) {
                        includeLabIdCol = false
                        columns = uploadColumns
                    } else if (hasOneEntity && eq(entityType, cache.entities.collection)) {
                        includeLabIdCol = false
                        includeGroupCol = false
                        columns = collectionColumns
                    } else if (hasOneEntity && eq(entityType, cache.entities.publication)) {
                        includeLabIdCol = false
                        columns = publicationColumns
                    } else {
                        tableContext.current = 'multi'
                        log.debug('Table Results', hasMultipleEntityTypes)
                    }
                    return defaultColumns({hasMultipleEntityTypes, columns, includeLabIdCol, includeGroupCol});
                }
            })
            cols = cols[typeIndex]
        }

        if (columnsToHide) {
            hiddenColumns.current = columnsToHide
            for (let col of cols) {
               col.omit = columnsToHide[col.name] || false
            }
        }
        cols = matchArrayOrder(parseJson(localStorage.getItem(COLS_ORDER_KEY(`entities.${tableContext.current}`))), cols)
        currentColumns.current = cols;
        return cols;
    }

    if (forData) {
        return {sourceColumns, sampleColumns, datasetColumns, defaultColumns}
    }

    // Prepare opsDict
    getOptions(rawResponse?.record_count || children.length)

    const getSearchContext = () => `entities.${tableContext.current}`

    return (
        <>
            {defaultHiddenColumns &&
                <TableResultsProvider columnsRef={currentColumns} getId={getId} getHotLink={getHotLink} rows={children}
                                      filters={filters} onRowClicked={onRowClicked} forData={forData} raw={raw}
                                      inModal={inModal}>
                    <ResultsBlock
                        index={'entities'}
                        searchContext={getSearchContext}
                        defaultHiddenColumns={Object.values(defaultHiddenColumns)}
                        getTableColumns={getTableColumns}
                    />
                    <AppModal
                        className={`modal--searchEntities`}
                        modalSize={'xl'}
                        showModal={showModal}
                        modalTitle={modalTitle}
                        modalBody={modalBody}
                        handleClose={() => {
                            setShowModal(false)
                        }}
                        showHomeButton={false}
                        showCloseButton={true}
                        closeButtonLabel={'Okay'}
                    />
                </TableResultsProvider>
            }
        </>
    )
}

TableResultsEntities.propTypes = {
    children: PropTypes.node,
    onRowClicked: PropTypes.func
}

export {TableResultsEntities}
