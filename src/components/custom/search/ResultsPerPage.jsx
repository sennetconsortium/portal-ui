import {getCheckAll, handleCheckAll} from "../BulkExport";
import $ from "jquery";
import {RESULTS_PER_PAGE} from "../../../config/config";
import React, {useState} from "react";
import Select from 'react-select'
import {clearDownloadSizeLabel} from "../TableResultsFiles";

export const handlePagingInfo = (page, resultsPerPage, totalRows) => {
    try {
        handleCheckAll()
        const $pgInfo = $('.sui-paging-info')
        let from = (page - 1) * resultsPerPage + 1
        let to = page * resultsPerPage
        to = to > totalRows ? totalRows : to
        let txt = totalRows > 0 ? `${from} - ${to}` : '0 - 0'
        $pgInfo.find('strong').eq(0).html(`${txt}`)
        clearDownloadSizeLabel()
    } catch (e) {
        console.error(e)
    }
}

export let opsDict
export const getOptions = (totalRows) => {
    let result = []
    opsDict = {}
    for (let x of RESULTS_PER_PAGE) {
        if (x <= totalRows || x - totalRows < 10) {
            opsDict[x] = {value: x, label: x}
            result.push(
                {value: x, label: x}
            )
        }
    }
    return result
}

export function ResultsPerPage({resultsPerPage, setResultsPerPage, totalRows}) {
    const getDefaultValue = () => getOptions(totalRows).length > 1 ? getOptions(totalRows)[1] : getOptions(totalRows)[0]

    const [value, setValue] = useState(getDefaultValue())

    const handleChange = (e) => {
        setResultsPerPage(e.value)
        setValue(e)
        handlePagingInfo(1, e.value, totalRows)
    }

    const getCurrentValue = () => {
        const hasValue = value !== undefined
        if (hasValue && resultsPerPage !== value.value) {
            return opsDict[resultsPerPage]
        }
        return hasValue && opsDict[value.value] ? value : getDefaultValue()
    }

    return (
        <div className={'sui-react-select'}>{getOptions(totalRows).length > 0 && <Select blurInputOnSelect={false} options={getOptions(totalRows)} defaultValue={getDefaultValue()} value={getCurrentValue()} onChange={handleChange} name={'resultsPerPage'} />}</div>
    )
}
