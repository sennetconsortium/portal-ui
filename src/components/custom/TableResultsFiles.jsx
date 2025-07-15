import React, {useRef, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    autoBlobDownloader,
    checkFilterType,
    checkMultipleFilterType, formatByteSize, getEntityViewUrl, getHeaders,
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
import {fetchGlobusFilepath, parseJson} from "@/lib/services";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import DataUsageModal from "@/components/custom/entities/dataset/DataUsageModal";
import {ShimmerText} from "react-shimmer-effects";

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

    const [results, setResults] = useState([])
    const [treeViewData, setTreeViewData] = useState([])
    const [showModalDownloadBtn, setShowModalDownloadBtn] = useState(false)
    const currentDatasetUuid = useRef(null)
    const selectedFilesModal = useRef({})
    const hiddenColumns = useRef(null)
    const tableContext = useRef(null)
    const [isBusy, setIsBusy] = useState(true)
    const [searchResponse, setSearchResponse] = useState({})
    const {pageNumber, pageSize} = useSearchUIContext()
    const globusLinks = useRef({})
    const [globusText, setGlobusText] = useState(<ShimmerText line={2} gap={5} />)

    useEffect(() => {
        const totalFileCount = rawResponse.record_count
        $('.sui-paging-info').append(` Datasets (<strong>${totalFileCount}</strong> Total Files)`)
    }, [])

    useEffect(()=> {
        const resp = rawResponse
        const results = transformResults(rawResponse)
        setResults(results)
        setSearchResponse(resp)
        updatePagingInfo(resp.aggregations?.total_datasets.value, resp)
        setIsBusy(false)

    }, [rawResponse, pageSize, pageSize])

    const raw = rowFn ? rowFn : ((obj) => obj ? (obj.raw || obj) : null)
    const applyDownloadSizeLabel = (total) => {
        if (total > 0) {
            getCheckAll().attr(downloadSizeAttr, total)
            $('.sui-paging-info').append(`<span class="download-size"> | Estimated download ${formatByteSize(total)}</span>`)
        }
    }

    function updatePagingInfo(resultsCount, resp) {
        $('.sui-paging-info strong').eq(1).text(resultsCount)
        $('.sui-paging-info strong').eq(2).text(resp.record_count)
    }

    function transformResults(resp) {
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
                results[uuid] = {
                    dataset_type: list[0].dataset_type,
                    dataset_sennet_id: list[0].dataset_sennet_id,
                    dataset_uuid: list[0].dataset_uuid,
                    donors: list[0].donors,
                    id: list[0].dataset_uuid,
                    organs: list[0].organs,
                    samples: list[0].samples,
                    sources: list[0].sources,
                    list: list,
                    meta: meta,
                }    
            }


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
        setGlobusText(<ShimmerText line={2} gap={5} />)
        setShowModal(true)
        currentDatasetUuid.current = row.dataset_uuid
        setTreeViewData(row)
        if (globusLinks.current[row.dataset_uuid] === undefined) {
            fetchGlobusFilepath(row.dataset_uuid).then((globusData) => {
                globusLinks.current[row.dataset_uuid] = globusData.filepath
                setGlobusText(<DataUsageModal data={row} filepath={globusData.filepath}/>)
            })
        } else {
            setGlobusText(<DataUsageModal data={row} filepath={globusLinks.current[row.dataset_uuid]}/>)
        }

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
                name: <BulkExport filters={filters} onCheckAll={onCheckAll} data={results} raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns} exportKind={'manifest'} />,
                width: '100px',
                className: 'text-center',
                selector: row => row.id,
                sortable: false,
                format: column => <input type={'checkbox'} data-size={raw(column.size)} onClick={(e) => handleFileCheckbox(e, column)} value={getId(column)} name={`check-${getId(column)}`}/>
            })
        }

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

                    return <div className={'table__cellFiles'}><div className='table__chips'>{res}</div></div>
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
                    isBusy={isBusy}
                    searchContext={getSearchContext}
                    tableClassName={'rdt_Results--Files'}
                    getTableColumns={getTableColumns}
                    totalRows={searchResponse.aggregations?.total_datasets.value}
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
