import {useCallback, useEffect, useRef} from 'react'

export const getCheckboxes = () => $('.rdt_TableBody [type=checkbox]')

function useSelectedRows({pageNumber, pageSize, filters, onCheckboxChange}) {

    const selectedRows = useRef([])
    const sel = {
        selectAllIo: 'Select all rows', // the name of the select all checkbox input in the table header, 
        // may need to be updated if the table library changes
        selectedCount: 'sui-selected-count'
    }

    // the name of the checkbox input is "Select row <uuid>", 
    // may need to be updated if the table library changes
    const getUuid = ($el) => $el.attr('name').replace('Select row ', '') 
    

    const updatedSelected = (uuid) => {
        selectedRows.current = selectedRows.current.filter((e) => e.id !== uuid)
    }

    const handleCheckboxes = () => {
        setTimeout(()=>{
            $(`[name="${sel.selectAllIo}"`).on('click', (e)=>{
                const $el = $(e.currentTarget)
                if (!$el.is(':checked')) {
                    // loop through checkboxes on current page and uncheck them
                    getCheckboxes().each((i, cbx) => {
                        $(cbx).prop('checked', false)
                        // remove reference
                        updatedSelected(getUuid($(cbx)))
                    });
                    updateLabel()
                }
            })
            getCheckboxes().on('click', (e)=>{
                const $el = $(e.currentTarget)

                if (!$el.is(':checked')) {
                    updatedSelected(getUuid($el))
                    updateLabel()
                }

            })
        }, 1000)
    }

    useEffect(() => {
        handleCheckboxes()

        // the listeners are lost on pagination updates
        // so need to bind them again
    }, [pageNumber, pageSize, filters]);

    const updateLabel = (mod = 0, ) => {
        const $selAllIo =  $(`[name="${sel.selectAllIo}"`)
        const totalSelected = selectedRows.current.length + mod

        const $checkBoxAll = $($selAllIo).parent()
        $checkBoxAll.find(`.${sel.selectedCount}`).remove()
        $checkBoxAll.append(`<span data-js-appevent="snRowsSelected" data-count="${totalSelected}" class="${sel.selectedCount}"></span>`)
        if (totalSelected) {
            // add count label
            $checkBoxAll.append(`<span class="${sel.selectedCount}">(${totalSelected})</span>`)

            // set the check all checkbox to indeterminate because row selections exit on other pages
            if (!$selAllIo.is(':checked')) {
                $selAllIo.prop("indeterminate", true) 
            } 
        }
        
    }

    const deselectRow = (id) => {
        selectedRows.current = selectedRows.current.filter((e) => e.id !== id)
    }

    const handleRowSelected = useCallback(state => {
        // For whatever weird reason,
        // the callback is triggered on pagination changes
        // due to not using the DataTable persistence options:
        // paginationServerOptions={{persistSelectedOnPageChange: true, persistSelectedOnSort: true}} ,
        // state.selectedCount is eq to 0 on pagination updates
        // thus we will only update selected rows when state contains a value
        // and use our own custom listeners to manage deletions in handleCheckboxes
        // At current version, DataTable persistence options also does not provide the check all checkbox in table header, 
        // so we can't use the persistence options if even we wanted to
        if (state.selectedCount) {
            let _dict = {}
            for (let e of selectedRows.current) {
                _dict[e.id] = true
            }
            for (let e of state.selectedRows) {
                if (!_dict[e.id]) {
                    selectedRows.current.push(e)
                }
            }
        }
        if (onCheckboxChange) {
            onCheckboxChange({selectedRows, updateLabel, deselectRow})
        } else {
            updateLabel()
        }
        
    }, [])

    // DataTable uses this to determine pre-selections like on pagination
    const rowSelectCriteria = row => {
        let rows = selectedRows.current.map((e)=> e.id)
        return rows.indexOf(row.id) !== -1
    }

    return {rowSelectCriteria, selectedRows, handleRowSelected}
}



export default useSelectedRows