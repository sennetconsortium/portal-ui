import {useCallback, useEffect, useRef, useState} from 'react'

function useSelectedRows({pageNumber, pageSize}) {
    useEffect(() => {
        setTimeout(()=>{
            $('.rdt_TableBody [type=checkbox]').on('click', (e)=>{
                const $el = $(e.currentTarget)
                const uuid = $el.attr('name').replace('select-row-', '')

                if (!$el.is(':checked')) {
                    selectedRows.current = selectedRows.current.filter((e) => e.id !== uuid)
                    updateLabel()
                }

            })
        }, 1000)
    }, [pageNumber, pageSize]);

    const selectedRows = useRef([])
    const sel = {
        selectAllIo: 'select-all-rows',
        selectedCount: 'sui-selected-count'
    }

    const updateLabel = () => {
        const $selAllIo =  $(`[name="${sel.selectAllIo}"`)

        const $checkBoxAll = $($selAllIo).parent()
        $checkBoxAll.find(`.${sel.selectedCount}`).remove()
        $checkBoxAll.append(`<span data-js-appevent="snRowsSelected" data-count="${selectedRows.current.length}" class="${sel.selectedCount}"></span>`)
        if (selectedRows.current.length) {
            // add count label
            $checkBoxAll.append(`<span class="${sel.selectedCount}">(${selectedRows.current.length})</span>`)
        }
    }

    const handleRowSelected = useCallback(state => {
        if (state.selectedCount) {
            selectedRows.current = state.selectedRows
        }
        updateLabel()
    }, [])


    const rowSelectCriteria = row => {
        let rows = selectedRows.current.map((e)=> e.id)
        return rows.indexOf(row.id) !== -1
    }

    return {rowSelectCriteria, selectedRows, handleRowSelected}


}



export default useSelectedRows