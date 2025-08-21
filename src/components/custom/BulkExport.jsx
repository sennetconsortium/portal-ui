import React, {useEffect, useState} from 'react'
import $ from "jquery";
import Dropdown from 'react-bootstrap/Dropdown'
import PropTypes from "prop-types";
import SenNetPopover from "../SenNetPopover";
import {autoBlobDownloader, eq} from "./js/functions";

export const getCheckboxes = () => $('.rdt_TableBody [type=checkbox]')

export const getCheckAll = () => {
    const $headers = $('.rdt_TableHeadRow .rdt_TableCol')
    const $checkAllHeader = $headers.eq(0)
    return $checkAllHeader.find('.sui-check-all input')
}

const $span = ($el) => {
    $el = $el || getCheckAll()
    return $el.parent().find('span')
}

const handleCheckAllTotal = ($el, total) => {
    $el.attr('data-total', total)
    const counter = total ? ` (${total})` : ''
    $span($el).html(counter)
}

const getTotal = () => {
    let total = 0
    getCheckboxes().each((i, el) => {
        if ($(el).is(':checked')) {
            total++
        }
    })
    return total
}

export const handleCheckbox = (e) => {
    e.stopPropagation()
    const $el = $(e.currentTarget)
    const isChecked = $el.is(':checked')
    let total = getCheckAll().attr('data-total')
    total = total ? Number(total) : 0
    total = isChecked ? ++total : --total
    getCheckAll().prop('checked', total === getCheckboxes().length)
    handleCheckAllTotal(getCheckAll(), total)
}

export const handleCheckAll = (setTotalSelected) => {
    getCheckAll().parent().parent().addClass('sui-tbl-actions-wrapper')
    handleCheckAllTotal(getCheckAll(), 0)
    getCheckAll().prop('checked', false)
}

function BulkExport({ data = [], raw, columns, filters, exportKind, onCheckAll, hiddenColumns, context = 'entities', replaceFirst = 'uuid' }) {

    const [totalSelected, setTotalSelected] = useState(0)

    const getId = (column) => column.id || column.uuid

    useEffect(() => {
        $('.clear-filter-button').on('click', ()=>{
            setTotalSelected(0)
        })

        const target = $('.sui-check-all')
        const observer = new MutationObserver((_) => setTotalSelected(getTotal()))
        observer.observe(target[0], { attributes: true, childList: true, subtree: true })

        return () => { 
            // cleanup on unmount
            $('.clear-filter-button').off('click');
            observer.disconnect()
        }
    }, [])

    const toggleCheckAll = (e, setTotalSelected) => {
        const $el = $(e.currentTarget)
        const checkAll = $el.is(':checked')
        const total = checkAll ? getCheckboxes().length : 0
        handleCheckAllTotal($el, total)
        getCheckboxes().prop('checked', checkAll)
        setTotalSelected(getTotal())
        if (onCheckAll) {
            onCheckAll(e, checkAll)
        }
    }

    const findExportColumn = () => {
        let _columns = columns.current
        for (let i = 0; i < _columns.length; i++) {
            if (eq(getId(_columns[i])?.toString(), 'bulkExport')) return i
        }
    }

    const generateTSVData = (selected, isAll) => {
        let _columns = columns.current
        if (replaceFirst) {
            const index = findExportColumn() || 0
            _columns[index] = {
                name: replaceFirst.toUpperCase(),
                selector: row => raw(row[replaceFirst]),
                sortable: true,
            }
        }
        
        let tableDataTSV = ''
        let _colName
        for (let col of _columns) {
            if (!col.omit) {
                tableDataTSV += `${col.name}\t`
            }
        }
        tableDataTSV += "\n"
        let colVal;
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }
            let row
            for (let item of data) {
                row = item.props ? item.props.result : item
                let id = raw(row.uuid)
                if (isAll || selected[id]) {
                    for (let col of _columns) {
                        if (!col.omit) {
                            _colName = col.name
                            colVal = col.selector(row) ? col.selector(row) : ''
                            tableDataTSV += `${colVal}\t`
                        }
                    }
                    tableDataTSV += "\n"
                }
            }
        } catch (e) {
            console.error(e);
        }

        return tableDataTSV
    }

    const hasFileFilter = ()=> {
        if (filters.length) {
            for (let f of filters) {
                if (eq(f.field, 'file_extension') || eq(f.field, 'is_data_product') || eq(f.field, 'is_qa_qc')) {
                    return true
                }
            }
        }
        return document.getElementById('search')?.value.length > 0
    }

    const generateManifestData = (selected, isAll) => {
        let manifestData  = ''
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }
            for (let item of data) {
                let id = item.props ? raw(item.props.result.uuid) : raw(item.uuid) || raw(item.id)
                if (isAll || selected[id]) {
                     if (!hasFileFilter() && eq(context, 'files')) {
                        manifestData += `${id} /\n`
                    } else if (item.list) {
                        for (let subItem of item.list) {
                            manifestData += `${raw(subItem.dataset_uuid)} /${raw(subItem.rel_path)}\n`
                        }
                    } else {
                        manifestData += `${id} /${raw(item.rel_path)}\n`
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        return manifestData
    }

    const atIndex = (index) => {
        return (data[index].props)  ? data[index].props.result : data[index]
    }

    const downloadData = (e, fileType, isAll) => {
        const $checkboxes = getCheckboxes()
        let selected = {}
        let results = []
        let fileName = raw(getId(atIndex(0))) + ' - ' + raw(getId(atIndex(data.length - 1)))
        let lastSelected, val

        if (!isAll) {
            $checkboxes.each((i, el) => {
                if ($(el).is(':checked')) {
                    val = $(el).val()
                    if (!Object.values(selected).length) {
                        fileName = val
                    }
                    selected[val] = true
                    lastSelected = val
                }
            })
            if (fileName !== lastSelected) {
                fileName += ` - ${lastSelected}`
            }
        }

        for (let i = 0; i < data.length; i++) {
            let id = raw(getId(atIndex(i)))

            if (isAll || selected[id]) {
                results.push(atIndex(i))
            }
        }

        let type = 'text/tab-separated-values'
        let blob
        switch(fileType) {
            case 'json':
                type = 'application/json'
                blob = [JSON.stringify(results, null, 2)]
                break;
            case 'manifest':
                type = 'text/plain'
                fileName = 'data-manifest'
                fileType = 'txt'
                blob = [generateManifestData(selected, isAll)]
                break;
            default:
                blob = [generateTSVData(selected, isAll)]
            // code block
        }

        autoBlobDownloader(blob, type, `${fileName}.${fileType}`)
    }

    const getActions = () => {
        let actions = {
            json: 'JSON',
            tsv: 'TSV'
        }
        if (eq(exportKind, 'manifest')) {
            actions = {
                manifest: 'Manifest TXT'
            }
        }

        if (filters) {
            for (let f of filters) {
                if (eq(f.field, 'entity_type') && f.values.contains('dataset')) {
                    actions.manifest = 'Manifest TXT'
                    break
                }
            }
        }

        // Disable json action output for now if there are hidden columns
        if (hiddenColumns.current && Object.keys(hiddenColumns.current).length) {
            delete actions['json']
        }

        return actions
    }

    const popoverText = (fileType) => {
        if (eq(fileType, 'json')) {
            return <>Exports all properties associated with selected entities in JSON format.</>
        } else if (eq(fileType, 'tsv')) {
            return <>Exports search result table information for selected entities in tab-separated values format.</>
        } else {
            return <>Exports to SenNet CLT manifest format.
                <br />
                <small className={'text-muted'}>Note: In order to download the files that are included in the manifest file,&nbsp;
                <a href="https://github.com/x-atlas-consortia/clt" target='_blank' className={'lnk--ic'}>install <i
                    className="bi bi-box-arrow-up-right"></i></a> the CLT and <a target='_blank' className={'lnk--ic'}
                        href="https://docs.sennetconsortium.org/libraries/clt/">follow the instructions<i
                        className="bi bi-box-arrow-up-right"></i></a> for how to use it with the manifest file.</small>
            </>
        }
    }

    const getMenuItems = (range) => {
        let results = []
        const isAll = range === 'all'
        const exportActions = getActions()
        let i = 1

        for (let action in exportActions) {
            results.push(
                <SenNetPopover key={`${range}-${action}`} text={popoverText(action)} className={`${range}-${action}`}>
                    <a onClick={(e) => downloadData(e, action, isAll)}><code>{exportActions[action]}</code></a>
                </SenNetPopover>
            )
            if (i !== Object.keys(exportActions).length) {
                results.push(<span key={`${range}-${action}-sep`}>&nbsp;|&nbsp;</span>)
            }
            i++
        }
        return results
    }

    return (
        <>
            <div className='sui-check-all'><input type="checkbox" name="toggle-check-all" onClick={(e) => toggleCheckAll(e, setTotalSelected)} /><span></span></div>
            <div id='sui-tbl-checkbox-actions' className={'js-gtm--download'}>
                <Dropdown>
                    <Dropdown.Toggle  id="dropdown-basic" variant={'secondary-outline'}>
                        <i className="bi bi-download text-primary fs-5"></i>
                    </Dropdown.Toggle>

                    <Dropdown.Menu className={`${getMenuItems().length > 2 ? 'menu--lg' : ''}`}>
                        <div className={'dropdown-item'} key={`export-all`}>Export all to&nbsp;
                            {getMenuItems('all')}
                            </div>
                        {totalSelected > 0 && <div className={'dropdown-item'}  key={`export-selected`} >Export selected to&nbsp;
                            {getMenuItems()}
                        </div>}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </>
    )
}

BulkExport.propTypes = {
    data: PropTypes.array.isRequired,
    columns: PropTypes.object.isRequired,
    exportKind: PropTypes.string
}

export default BulkExport
