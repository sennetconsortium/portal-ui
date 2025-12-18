import React, {useRef, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    autoBlobDownloader,
    checkFilterType,
    checkMultipleFilterType, getEntityViewUrl,
    getUBKGFullName, matchArrayOrder, goToTransfers
} from './js/functions'
import {getOptions} from "./search/ResultsPerPage";
import ResultsBlock from "./search/ResultsBlock";
import {TableResultsProvider} from "@/context/TableResultsContext";
import ClipboardCopy from "../ClipboardCopy";
import 'primeicons/primeicons.css';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {Chip} from "@mui/material";
import SenNetPopover from "../SenNetPopover";
import AppModal from "../AppModal";
import FileTreeView from "./entities/dataset/FileTreeView";
import {COLS_ORDER_KEY, FILE_KEY_SEPARATOR} from "@/config/config";
import {fetchGlobusFilepath, parseJson} from "@/lib/services";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import DataUsageModal from "@/components/custom/entities/dataset/DataUsageModal";
import {ShimmerText} from "react-shimmer-effects";
import {Button} from 'react-bootstrap'

function TableResultsFiles({children, onRowClicked, filters, forData = false, rowFn, inModal = false, rawResponse}) {
    const fileTypeField = 'file_extension'
    let hasMultipleFileTypes = checkMultipleFilterType(filters, fileTypeField);
    const currentColumns = useRef([])
    const [showModal, setShowModal] = useState(false)
    const [fileSelection, setFileSelection] = useState(null)

    const [results, setResults] = useState([])
    const [treeViewData, setTreeViewData] = useState([])
    const [showModalDownloadBtn, setShowModalDownloadBtn] = useState(false)
    const currentDatasetUuid = useRef(null)
    const selectedFilesModal = useRef({})
    const hiddenColumns = useRef(null)
    const tableContext = useRef(null)
    const [isBusy, setIsBusy] = useState(true)
    const [searchResponse, setSearchResponse] = useState({})
    const {pageSize} = useSearchUIContext()
    const globusLinks = useRef({})
    const loadingComponent = <ShimmerText line={2} gap={10} />
    const [globusText, setGlobusText] = useState(loadingComponent)

    useEffect(() => {
        const totalFileCount = rawResponse?.record_count || 0
        $('.sui-paging-info').append(` Datasets (<strong>${totalFileCount}</strong> Total Files)`)
    }, [])

    useEffect(()=> {
        const resp = rawResponse
        const results = transformResults(rawResponse)
        setResults(results)
        setSearchResponse(resp)
        updatePagingInfo(resp?.aggregations?.total_datasets.value, resp)
        setIsBusy(false)

    }, [rawResponse, pageSize, pageSize])

    const handleChecboxSelectionsStates = (selectedRows, updateLabel) => {
        const fileTreeSelectionsUuids = Object.keys(selectedFilesModal.current)
        let _dict = {}
        let fileTreeSelections = 0
        let $el, _fileSelections

        // Store table selections in key dict for constant time access
        if (selectedRows.current) {
            for (let e of selectedRows.current) {
                _dict[e.id] = true
            }
        }
        for (let uuid of fileTreeSelectionsUuids) {
            $el = $(`[name="select-row-${uuid}"]`)
            
            if (!_dict[uuid] && $el.length) {
                // If the row is not already selected from the main table, 
                // set the checkbox to be indeterminate to reflect selections in the fileTree modal
                $el?.prop("indeterminate", true) 
                fileTreeSelections++
            } else {
                _fileSelections = {}
                // The row is already selected on the main table, 
                // so delete any fileTree modal selections on that row
                for (let fileKey in fileSelection) {
                    if (!fileKey.startsWith(uuid)) {
                        _fileSelections[fileKey] = fileSelection[fileKey]
                    }
                }
                // Update references to fileTree modal selections
                setFileSelection(_fileSelections)
                delete selectedFilesModal.current[uuid]
            }
        }

        if (updateLabel) {
            updateLabel(fileTreeSelections)
        }
    }

    const clearCheckboxSelections = () => {
        setFileSelection(null)
        selectedFilesModal.current = []
    }

    const raw = rowFn ? rowFn : ((obj) => obj ? (obj.raw || obj) : null)

    function updatePagingInfo(resultsCount, resp) {
        $('.sui-paging-info strong').eq(1).text(resultsCount)
        $('.sui-paging-info strong').eq(2).text(resp?.record_count)
    }

    function transformResults(resp) {
        if (!resp) return []
        const results = {}

        // group files by dataset_uuid
        for (let file of resp?.records?.files) {
            let uuid = file.fields['dataset_uuid.keyword'][0]
            if (!results.hasOwnProperty(uuid)) {
                let list = []
                let meta = {
                    files: file.inner_hits.files.hits.total.value,
                    extensions: []
                }
                for (let l of file.inner_hits.files.hits.hits) {
                    list.push(l._source)
                }
                for (let l of resp.aggregations.table_file_extension.buckets) {
                    if (l.key['dataset_uuid.keyword'] === uuid) {
                        meta.extensions.push({
                            name: l.key['file_extension.keyword'],
                            count: l.doc_count
                        })
                    }
                }
                const row = list[0]
                results[uuid] = {
                    dataset_type: row.dataset_type,
                    dataset_sennet_id: row.dataset_sennet_id,
                    dataset_uuid: row.dataset_uuid,
                    description: row.description,
                    data_access_level: row.data_access_level,
                    donors: row.donors,
                    id: row.dataset_uuid,
                    organs: row.organs,
                    samples: row.samples,
                    sources: row.sources,
                    entity_type: 'Dataset',
                    list: list,
                    meta: meta,
                }    
            }


        }

        return Object.values(results)
    }

    const getHotLink = (row) => getEntityViewUrl('dataset', raw(row.dataset_uuid), {}, {})

    const getId = (column) => column.id || column.dataset_uuid

    const hideModal = () => {
        setShowModal(false)
    }

    const getModalSelectedUuids = () => {
        return Object.keys(selectedFilesModal.current)
    }

    const getModalSelectedFiles = (uuids) => {
        let list = []
        let _uuids = uuids || Object.keys(selectedFilesModal.current)
        for (let uuid of _uuids) {
            for (let key in selectedFilesModal.current[uuid]?.selected) {
                let keys = key.split(FILE_KEY_SEPARATOR)
                let file = keys[keys.length - 1]
                if (file.contains('.')) {
                    let uuid = keys[0]
                    // remove the first two due to formatting of tree component, aren't needed
                    keys.shift()
                    keys.shift()
                    list.push({
                        uuid,
                        path: `/${keys.join('/')}`,
                        dataset_type: selectedFilesModal.current[uuid]?.row?.dataset_type
                    })
                }
            }
        }

        return list
    }

    const downloadManifest = () => {
        let manifestData = ''
        let list = getModalSelectedFiles([currentDatasetUuid.current])
        for (let l of list){
            manifestData += `${l.uuid} ${l.path}\n`
        }

        autoBlobDownloader([manifestData], 'text/plain', `data-manifest.txt`)
    }

    const transferModalSelectedFiles = () => {
        let list = getModalSelectedFiles([currentDatasetUuid.current])
        let transferList = []
        for (let l of list){
            transferList.push({...l, dataset: l.uuid, file_path: l.path})
        }
        goToTransfers(transferList)
    }

    const filesModal = (row) => {
        setGlobusText(loadingComponent)
        setShowModal(true)
        currentDatasetUuid.current = row.dataset_uuid
        setTreeViewData(row)
        if (globusLinks.current[row.dataset_uuid] === undefined) {
            fetchGlobusFilepath(row.dataset_uuid).then((globusData) => {
                globusLinks.current[row.dataset_uuid] = globusData.filepath
                setGlobusText(<DataUsageModal includeIntroText={true} data={row} filepath={globusData.filepath}/>)
            })
        } else {
            setGlobusText(<DataUsageModal includeIntroText={true} data={row} filepath={globusLinks.current[row.dataset_uuid]}/>)
        }

    }

    const handleFileSelection = (e, row) => {
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()

        let _dict = JSON.parse(JSON.stringify(e.value))
        let filesSelectedForRow = {}
        for (let e in _dict) {
            if (e.startsWith(row.dataset_uuid)) {
                filesSelectedForRow[e] = _dict[e]
            }
        }
        selectedFilesModal.current[row.dataset_uuid] = {row, selected: filesSelectedForRow}

        const show = Object.values(selectedFilesModal.current[row.dataset_uuid].selected).length > 0
        if (!show) {
            // remove reference for ui checkbox states and corect list downloads
            delete selectedFilesModal.current[row.dataset_uuid]
        }
        setShowModalDownloadBtn( show )
        setFileSelection(e.value)

    }

    const defaultColumns = ({hasMultipleFileTypes = true, columns = [], _isLoggedIn}) => {
        let cols = []


        cols.push(
            {
                name: 'Dataset SenNet ID',
                id: 'dataset_uuid',
                width: '200px',
                selector: row => raw(row.dataset_sennet_id),
                sortable: true,
                reorder: true,
                format: column => inModal ? raw(column.dataset_sennet_id) : <span data-field='dataset_sennet_id'><a href={getHotLink(column)}>{raw(column.dataset_sennet_id)}</a> <ClipboardCopy text={raw(column.dataset_sennet_id)} title={'Copy SenNet ID {text} to clipboard'} /></span>,
            }
        )

        cols.push(
            {
                name: 'Files',
                id: 'rel_path',
                minWidth: '25%',
                selector: row => raw(row.description),
                sortable: true,
                reorder: true,
                format: (row) => {
                    let paths = []
                    let i = 0
                    for (let item of row.list) {
                        paths.push(
                            <span key={`rel_path_${i}`} className={'cell-nowrap'}>
                                <span className={'pi pi-fw pi-file'} role={'presentation'}></span>
                                <small><span role={'button'} aria-label={`View more details for ${raw(item.rel_path)}`} className={'text-decoration-underline'} data-field='rel_path' onClick={()=> filesModal(row)}>{raw(item.rel_path)}</span></small>
                                <br />
                            </span>
                        )
                        i++
                    }
                    return (<div>
                        {paths.length > 2 ? paths.slice(0, 2) : paths}
                        <SenNetPopover text={'View more files details'} className={`popover-${getId(row)}`}>
                            <Chip label={<MoreHorizIcon />} size="small" onClick={()=> filesModal(row)} />
                        </SenNetPopover>
                    </div>)
                }
            }
        )

        cols.push(
            {
                name: 'Source',
                id: 'sources.source_type',
                width: '10%',
                selector: row => {
                    let val = raw(row.sources)
                    if (val) {
                        return Array.isArray(val) ? getUBKGFullName(val[0].source_type) : val.source_type
                    }
                },
                sortable: true,
                reorder: true,
            }
        )
        cols.push(
            {
                name: 'Organ',
                id: 'organs.label',
                width: '10%',
                selector: row => {
                    let val = raw(row.organs)
                    let organs = new Set()
                    if (val) {
                        if (Array.isArray(val)) {
                            for (let o of val) {
                                organs.add(getUBKGFullName(o.code))
                            }
                        } else {
                            organs.add(getUBKGFullName(val.code))
                        }
                        if (organs.size > 0) {
                            return [...organs].join(', ')
                        }
                    }
                    return ''
                },
                sortable: true,
                reorder: true,
            }
        )


        cols.push(
            {
                name: 'Dataset Type',
                width: '15%',
                id: 'dataset_type',
                selector: row => {
                    let val = raw(row.dataset_type)
                    if (val) {
                        return Array.isArray(val) ? getUBKGFullName(val[0]) : val
                    }
                },
                sortable: true,
                reorder: true,
            }
        )

        cols.push(
            {
                name: 'File Types',
                id: 'files_count',
                width: '18%',
                selector: row => raw(row.meta.files),
                sortable: false,
                reorder: true,
                format: row => {
                    let res = []
                    const data = {
                        uuid: row.dataset_uuid
                    }
                    for (let e of row.meta.extensions) {
                        res.push(<Chip
                            key={e.name}
                            avatar={<span className={'MuiChip--ext'}>{e.name}</span>}
                            label={<span>{e.count}</span>}
                            variant="outlined"
                        />)
                        data[e.name || 'N/A'] = e.count
                    }

                    return <div className={'table__cellFiles'}><div className='table__chips'>{row.meta.files > 1 && res.length > 1 && <small className={'badge rounded-pill bg-secondary'}>{row.meta.files} total files</small>} {res}</div></div>
                }
            }
        )

        cols = cols.concat(columns)
        return cols;
    }


    const getTableColumns = (columnsToHide) => {
        let cols;
        if (checkFilterType(filters, fileTypeField) === false) {
            tableContext.current = 'default'
            cols = defaultColumns({});
        } else {
            let typeIndex = 0;
            cols = filters.map((filter, index) => {
                let columns = []
                if (filter.field === fileTypeField) {
                    typeIndex = index
                    tableContext.current = filter.values[0]
                    return defaultColumns({hasMultipleFileTypes: hasMultipleFileTypes, columns});
                }
            })
            cols = cols[typeIndex]
        }

        if (columnsToHide) {
            hiddenColumns.current = columnsToHide
            for (let col of cols) {
                col.omit = columnsToHide[col.name]
            }
        }

        matchArrayOrder(parseJson(localStorage.getItem(COLS_ORDER_KEY(`files.${tableContext.current}`))), cols)
        currentColumns.current = cols;
        return cols;
    }

    if (forData) {
        return {defaultColumns}
    }

    // Prepare opsDict
    getOptions(children.length)

    const getSearchContext = () => `files.${tableContext.current}`

    return (
        <>
            <TableResultsProvider onRowClicked={onRowClicked} columnsRef={currentColumns} getId={getId} rows={results} filters={filters} forData={forData} raw={raw} inModal={inModal}>
                <ResultsBlock
                    onCheckboxChange={handleChecboxSelectionsStates}
                    exportKind={'manifest'}
                    searchActtionHandlers={{getModalSelectedFiles:getModalSelectedFiles, clearCheckboxSelections: clearCheckboxSelections, getModalSelectedUuids: getModalSelectedUuids}}
                    index={'files'}
                    isBusy={isBusy}
                    searchContext={getSearchContext}
                    tableClassName={'rdt_Results--Files'}
                    getTableColumns={getTableColumns}
                    totalRows={searchResponse?.aggregations?.total_datasets.value}
                />
                <AppModal
                    className={`modal--filesView`}
                    modalSize={'xl'}
                    showModal={showModal}
                    modalTitle={'Files Details'}
                    modalBody={
                        <>
                            {treeViewData && (treeViewData?.list?.length != treeViewData?.meta?.files) &&
                                <p>Currently showing <strong>{treeViewData?.list?.length}</strong> out of <strong>{treeViewData?.meta?.files}</strong> files.</p>}
                            {globusText}
                            <FileTreeView data={treeViewData}
                                          showQAButton={false}
                                          showDataProductButton={false}
                                          selection={{mode: 'checkbox', value: fileSelection, setValue: handleFileSelection, args: treeViewData }}
                                          keys={{files: 'list', uuid: 'dataset_uuid'}}
                                          loadDerived={false}
                                          treeViewOnly={true}
                                          className={'c-treeView__main--inTable'} />
                        </>
                }
                    handleSecondaryBtn={hideModal}
                    handlePrimaryBtn={downloadManifest}
                    showPrimaryBtn={showModalDownloadBtn}
                    primaryBtnLabel={'Download Manifest'}
                    footer={<>
                        {showModalDownloadBtn && <Button variant="outline-primary rounded-0" onClick={transferModalSelectedFiles}>
                            Transfer Files
                        </Button>}
                    </>}
                />
            </TableResultsProvider>
        </>
    )
}

TableResultsFiles.propTypes = {
    children: PropTypes.node,
    onRowClicked: PropTypes.func
}

export {TableResultsFiles}
