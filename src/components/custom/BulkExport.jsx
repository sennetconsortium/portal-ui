import React, {useContext, useEffect, useState} from 'react'
import $ from "jquery";
import Dropdown from 'react-bootstrap/Dropdown'
import PropTypes from "prop-types";
import SenNetPopover from "../SenNetPopover";

const getCheckboxes = () => $('.rdt_TableBody [type=checkbox]')

const getCheckAll = () => {
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
}

function BulkExport({ data, raw, columns,  replaceFirst = 'uuid' }) {

    const [totalSelected, setTotalSelected] = useState(0)

    useEffect(() => {
        $('.clear-filter-button').on('click', ()=>{
            setTotalSelected(0)
        })

        $('.sui-check-all').on('DOMSubtreeModified', (e) =>{
            setTotalSelected(getTotal())
        })
    })

    const toggleCheckAll = (e, setTotalSelected) => {
        const $el = $(e.currentTarget)
        const checkAll = $el.is(':checked')
        const total = checkAll ? getCheckboxes().length : 0
        handleCheckAllTotal($el, total)
        getCheckboxes().prop('checked', checkAll)
        setTotalSelected(getTotal())
    }

    const generateTSVData = (selected, isAll) => {
        let _columns = columns.current
        if (replaceFirst) {
            _columns[0] = {
                name: replaceFirst.toUpperCase(),
                selector: row => raw(row[replaceFirst]),
                sortable: true,
            }
        }
        
        let tableDataTSV = ''
        let _colName
        for (let col of _columns) {
            tableDataTSV += `${col.name}\t`
        }
        tableDataTSV += "\n"
        let colVal;
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }
            let row
            for (let item of data) {
                let id = raw(item.props.result.sennet_id)
                if (isAll || selected[id]) {
                    for (let col of _columns) {
                        row = item.props.result
                        _colName = col.name
                        colVal = col.selector(row) ? col.selector(row) : ''
                        tableDataTSV += `${colVal}\t`
                    }
                    tableDataTSV += "\n"
                }
            }
        } catch (e) {
            console.error(e);
        }

        return tableDataTSV
    }

    const downloadData = (e, fileType, isAll) => {
        const $checkboxes = getCheckboxes()
        let selected = {}
        let results = []
        let fileName = raw(data[0].props.result.sennet_id) + ' - ' + raw(data[data.length - 1].props.result.sennet_id)
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
            fileName += ` - ${lastSelected}`
        }

        for (let item of data) {
            let id = raw(item.props.result.sennet_id)

            if (isAll || selected[id]) {
                results.push(item.props.result)
            }
        }

        const isJson =  fileType === 'json'
        const a = document.createElement('a')
        const type = isJson ? 'application/json' : 'text/tab-separated-values'
        const blob = isJson ? [JSON.stringify(results, null, 2)] : [generateTSVData(selected, isAll)]

        const url = window.URL.createObjectURL(new Blob(blob, {type}))
        a.href = url
        a.download = `${fileName}.${fileType}`
        document.body.append(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
    }

    const jsonPopoverText = <>Exports all properties associated with selected entities in JSON format.</>
    const tsvPopoverText = <>Exports search result table information for selected entities in tab-separated values format.</>

    return (
        <>
            <div className='sui-check-all'><input type="checkbox" name="toggle-check-all" onClick={(e) => toggleCheckAll(e, setTotalSelected)} /><span></span></div>
            <div id='sui-tbl-checkbox-actions'>
                <Dropdown>
                    <Dropdown.Toggle  id="dropdown-basic" variant={'secondary-outline'}>
                        ...
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <div className={'dropdown-item'} key={`export-all`}>Export all to&nbsp;
                            <SenNetPopover text={tsvPopoverText} className='all-tsv'>
                                <a onClick={(e) => downloadData(e, 'tsv', true)}><code>TSV</code></a>
                            </SenNetPopover>
                            &nbsp;|&nbsp;
                            <SenNetPopover text={jsonPopoverText} className='all-json'>
                                <a onClick={(e) => downloadData(e, 'json', true)}><code>JSON</code></a>
                            </SenNetPopover>
                            </div>
                        {totalSelected > 0 && <div className={'dropdown-item'}  key={`export-selected`} >Export selected to&nbsp;
                            <SenNetPopover text={tsvPopoverText} className='selected-tsv'>
                                <a onClick={(e) => downloadData(e, 'tsv')}><code>TSV</code></a>
                            </SenNetPopover>
                            &nbsp;|&nbsp;
                            <SenNetPopover text={jsonPopoverText} className='selected-json'>
                                <a onClick={(e) => downloadData(e, 'json')}><code>JSON</code></a>
                            </SenNetPopover>
                        </div>}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </>
    )
}

BulkExport.propTypes = {
    data: PropTypes.array.isRequired,
    columns: PropTypes.object.isRequired
}

export default BulkExport