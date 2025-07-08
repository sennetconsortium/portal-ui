import React, {useRef, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    autoBlobDownloader,
    checkFilterType,
    checkMultipleFilterType, formatByteSize, getEntityViewUrl,
    getUBKGFullName, matchArrayOrder,
} from './js/functions'
import BulkExport, {getCheckAll, getCheckboxes, handleCheckbox} from "./BulkExport";
import {getOptions} from "./search/ResultsPerPage";
import ResultsBlock from "./search/ResultsBlock";
import {TableResultsProvider} from "@/context/TableResultsContext";
import SenNetAlert from "../SenNetAlert";
import ClipboardCopy from "../ClipboardCopy";
import 'primeicons/primeicons.css';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {Chip} from "@mui/material";
import SenNetPopover from "../SenNetPopover";
import AppModal from "../AppModal";
import FileTreeView from "./entities/dataset/FileTreeView";
import {COLS_ORDER_KEY, FILE_KEY_SEPARATOR} from "@/config/config";
import {parseJson} from "@/lib/services";

const downloadSizeAttr = 'data-download-size'
export const clearDownloadSizeLabel = () => {
    getCheckAll().removeAttr(downloadSizeAttr)
    $('.sui-paging-info .download-size').remove()
}

function TableResultsFiles({children, filters, forData = false, rowFn, inModal = false, rawResponse}) {
    const fileTypeField = 'file_extension'
    let hasMultipleFileTypes = checkMultipleFilterType(filters, fileTypeField);
    const currentColumns = useRef([])
    const hasClicked = useRef(false)
    const [showModal, setShowModal] = useState(false)
    const [fileSelection, setFileSelection] = useState(null)

    const [results, setResults] = useState(transformResults())
    const [treeViewData, setTreeViewData] = useState([])
    const [showModalDownloadBtn, setShowModalDownloadBtn] = useState(false)
    const currentDatasetUuid = useRef(null)
    const selectedFilesModal = useRef({})
    const hiddenColumns = useRef(null)
    const tableContext = useRef(null)

    useEffect(() => {
        const totalFileCount = rawResponse.records.files.length
        $('.sui-paging-info').append(` Datasets (<strong>${totalFileCount}</strong> Total Files)`)
    }, [])

    useEffect(()=> {
        const results = transformResults()
        setResults(results)
        updatePagingInfo(results.length)
    }, [rawResponse])

    const raw = rowFn ? rowFn : ((obj) => obj ? (obj.raw || obj) : null)
    const applyDownloadSizeLabel = (total) => {
        if (total > 0) {
            getCheckAll().attr(downloadSizeAttr, total)
            $('.sui-paging-info').append(`<span class="download-size"> | Estimated download ${formatByteSize(total)}</span>`)
        }
    }

    function updatePagingInfo(resultsCount) {
        $('.sui-paging-info strong').eq(1).text(resultsCount)
        $('.sui-paging-info strong').eq(2).text(rawResponse.records.files.length)
    }

    function transformResults() {
        const results = {}

        // group files by dataset_uuid
        for (let file of rawResponse.records.files) {
            if (!results.hasOwnProperty(file.dataset_uuid)) {
                results[file.dataset_uuid] = {
                    dataset_type: file.dataset_type,
                    dataset_sennet_id: file.dataset_sennet_id,
                    dataset_uuid: file.dataset_uuid,
                    donors: file.donors,
                    id: file.dataset_uuid,
                    organs: file.organs,
                    samples: file.samples,
                    list: [],
                    files_count: 0,
                }    
            }

            results[file.dataset_uuid].list.push(file)
            results[file.dataset_uuid].files_count += 1
        }

        return Object.values(results)
    }

    const onRowClicked = (e, uuid, data, clicked = false) => {
        const sel = `[name="check-${getId(data)}"]`

        if (!clicked) {
            hasClicked.current = true
            document.querySelector(sel).click()
        }
        const isChecked = $(sel).is(':checked')
        const $checkAll = getCheckAll()
        let total = $checkAll.attr(downloadSizeAttr)
        console.log('Total', total, isChecked)
        total = total ? Number(total) : 0
        total = isChecked ? total + raw(data.size) : total - raw(data.size)
        clearDownloadSizeLabel()
        applyDownloadSizeLabel(total)
        hasClicked.current = false
    }

    const getHotLink = (row) => getEntityViewUrl('dataset', raw(row.dataset_uuid), {})

    const handleFileCheckbox = (e, data) => {
        handleCheckbox(e)
        if (!hasClicked.current) {
            onRowClicked(e, data.id, data, true)
        }
    }

    const getId = (column) => column.id || column.dataset_uuid

    const onCheckAll = (e, checkAll) => {
        let total = 0
        if (checkAll) {
            getCheckboxes().each((i, el) => {
                if ($(el).is(':checked')) {
                    total += Number($(el).attr('data-size'))
                }
            })
        }
        clearDownloadSizeLabel()
        applyDownloadSizeLabel(total)
    }

    const hideModal = () => {
        setShowModal(false)
    }

    const downloadManifest = () => {
        let manifestData  = ''

        for (let key in selectedFilesModal.current[currentDatasetUuid.current].selected){
            let keys = key.split(FILE_KEY_SEPARATOR)
            manifestData += `${keys[0]} /${keys[keys.length - 1]}\n`
        }

        autoBlobDownloader([manifestData], 'text/plain', `data-manifest.txt`)
    }

    const filesModal = (row) => {
        setShowModal(true)
        currentDatasetUuid.current = row.dataset_uuid
        setTreeViewData(row)
    }

    const handleFileSelection = (e, row) => {
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()

        let _dict = JSON.parse(JSON.stringify(e.value))

        selectedFilesModal.current[row.dataset_uuid] = {row, selected: _dict}

        const show = Object.values(selectedFilesModal.current[row.dataset_uuid].selected).length > 0
        setShowModalDownloadBtn( show )
        setFileSelection(e.value)

    }

    const defaultColumns = ({hasMultipleFileTypes = true, columns = [], _isLoggedIn}) => {
        let cols = []
        if (!inModal) {
            cols.push({
                id: 'bulkExport',
                ignoreRowClick: true,
                name: <BulkExport onCheckAll={onCheckAll} data={results} raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns} exportKind={'manifest'} />,
                width: '100px',
                className: 'text-center',
                selector: row => row.id,
                sortable: false,
                format: column => <input type={'checkbox'} data-size={raw(column.size)} onClick={(e) => handleFileCheckbox(e, column)} value={getId(column)} name={`check-${getId(column)}`}/>
            })
        }

        cols.push(
            {
                name: 'Dataset UUID',
                id: 'dataset_uuid',
                width: '200px',
                selector: row => raw(row.dataset_uuid),
                sortable: true,
                reorder: true,
                format: column => inModal ? raw(column.dataset_uuid) : <span data-field='dataset_uuid'><a href={getHotLink(column)}>{raw(column.dataset_uuid)}</a> <ClipboardCopy text={raw(column.dataset_sennet_id)} title={'Copy UUID {text} to clipboard'} /></span>,
            }
        )

        cols.push(
            {
                name: 'Files',
                id: 'description',
                minWidth: '50%',
                selector: row => raw(row.description),
                sortable: true,
                reorder: true,
                format: (row) => {
                    let paths = []
                    let i = 0
                    for (let item of row.list) {
                        paths.push(
                            <span key={`rel_path_${i}`} className={'cell-nowrap'}><span className={'pi pi-fw pi-file'} role={'presentation'}></span><small><a data-field='rel_path' href={'#'}>{raw(item.rel_path)}</a></small><br /></span>
                        )
                        i++
                    }
                    return (<div>{raw(row.description)} {raw(row.description) && <br />}
                        {paths.length > 2 ? paths.slice(0, 2) : paths}
                        {paths.length > 2 && <SenNetPopover text={'View more files details'} className={`popover-${getId(row)}`}>
                            <Chip label={<MoreHorizIcon />} size="small" onClick={()=> filesModal(row)} />
                        </SenNetPopover>}
                    </div>)
                }
            }
        )

        // if (hasMultipleFileTypes) {
        //     cols.push({
        //         name: 'File Type',
        //         selector: row => raw(row.file_extension),
        //         sortable: true,
        //         format: row => <span data-field={fileTypeField}>{raw(row.file_extension)?.toUpperCase()}</span>,
        //     })
        // }

        cols.push(
            {
                name: 'Organ',
                id: 'organs',
                selector: row => {
                    let val = raw(row.organs)
                    if (val) {
                        return Array.isArray(val) ? getUBKGFullName(val[0].code) : val.code
                    }
                },
                sortable: true,
                reorder: true,
            }
        )


        cols.push(
            {
                name: 'Dataset Type',
                id: 'dataset_types',
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
                name: 'Files',
                id: 'files_count',
                selector: row => raw(row.files_count),
                sortable: true,
                reorder: true,
                format: row => <span>{raw(row.files_count)}</span>
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
            <TableResultsProvider columnsRef={currentColumns} getId={getId} rows={results} filters={filters} onRowClicked={onRowClicked} forData={forData} raw={raw} inModal={inModal}>
                <SenNetAlert variant={'warning'} className="clt-alert"
                             text=<>In order to download the files that are included in the manifest file,&nbsp;
                <a href="https://github.com/x-atlas-consortia/clt" target='_blank' className={'lnk--ic'}>install <i
                    className="bi bi-box-arrow-up-right"></i></a> the CLT and <a
                    href="https://docs.sennetconsortium.org/libraries/clt/">follow the instructions</a> for how to use it with the manifest file.
                <br /><small className={'text-muted'}>Note: For transferring data to the local machine, the <a
                    href={'https://www.globus.org/globus-connect-personal'} target='_blank' className={'lnk--ic'}>Globus
                    Connect Personal (GCP)<i className="bi bi-box-arrow-up-right"></i></a> endpoint must also be up and
                    running.</small>
                </> />
                <ResultsBlock
                    index={'files'}
                    searchContext={getSearchContext}
                    tableClassName={'rdt_Results--Files'}
                    getTableColumns={getTableColumns}
                    totalRows={results.length}
                />
                <AppModal
                    className={`modal--filesView`}
                    modalSize={'xl'}
                    showModal={showModal}
                    modalTitle={'Files Details'}
                    modalBody={
                        <FileTreeView data={treeViewData}
                        showQAButton={false}
                        showDataProductButton={false}
                        selection={{mode: 'checkbox', value: fileSelection, setValue: handleFileSelection, args: treeViewData }}
                        keys={{files: 'list', uuid: 'dataset_uuid'}}
                        loadDerived={false}
                        treeViewOnly={true}
                        className={'c-treeView__main--inTable'} />
                }
                    handleSecondaryBtn={
hideModal}
                    handlePrimaryBtn={downloadManifest}
                    showPrimaryBtn={showModalDownloadBtn}
                    primaryBtnLabel={'Download Manifest'}
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
