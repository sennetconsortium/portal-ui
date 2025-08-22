import {useCallback, useEffect, useRef} from 'react'

export const getCheckboxes = () => $('.rdt_TableBody [type=checkbox]')

function useSelectedRows({pageNumber, pageSize}) {

    const selectedRows = useRef([])
    const sel = {
        selectAllIo: 'select-all-rows',
        selectedCount: 'sui-selected-count'
    }

    const handleCheckboxes = () => {
        setTimeout(()=>{
            $(`[name="${sel.selectAllIo}"`).on('click', (e)=>{
                const $el = $(e.currentTarget)
                if (!$el.is(':checked')) {
                    selectedRows.current = []
                    updateLabel()
                }
            })
            getCheckboxes().on('click', (e)=>{
                const $el = $(e.currentTarget)
                const uuid = $el.attr('name').replace('select-row-', '')

                if (!$el.is(':checked')) {
                    selectedRows.current = selectedRows.current.filter((e) => e.id !== uuid)
                    updateLabel()
                }

            })
        }, 1000)
    }

    useEffect(() => {
        handleCheckboxes()

        // the listeners are lost on pagination updates
        // so need to bind them again
    }, [pageNumber, pageSize]);

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
        // For whatever weird reason,
        // the callback is triggered on pagination changes
        // due to not using the DataTable persistence options:
        // paginationServerOptions={{persistSelectedOnPageChange: true, persistSelectedOnSort: true}} ,
        // state.selectedCount is eq to 0 on pagination updates
        // thus we will only update selected rows when state contains a value
        // and use our own custom listeners to manage deletions in handleCheckboxes
        if (state.selectedCount) {
            selectedRows.current = state.selectedRows
        }
        updateLabel()
    }, [])

    // DataTable uses this to determine pre-selections like on pagination
    const rowSelectCriteria = row => {
        let rows = selectedRows.current.map((e)=> e.id)
        return rows.indexOf(row.id) !== -1
    }

    return {rowSelectCriteria, selectedRows, handleRowSelected}
}



export default useSelectedRows