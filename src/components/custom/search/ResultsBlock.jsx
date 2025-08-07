import React, {useContext, useEffect, useState, useCallback, useRef} from 'react'
import PropTypes from 'prop-types'
import {opsDict, ResultsPerPage} from "./ResultsPerPage";
import DataTable from "react-data-table-component";
import TableResultsContext from "@/context/TableResultsContext";
import ColumnsDropdown from "./ColumnsDropdown";
import {eq} from '../js/functions'
import {COLS_ORDER_KEY} from "@/config/config";
import Spinner from '../Spinner';
import SearchActions from "@/components/custom/search/SearchActions";

function ResultsBlock({getTableColumns, disableRowClick, tableClassName = '', exportKind, defaultHiddenColumns = [], searchContext, totalRows, isBusy}) {

    const {
        getTableData,
        noResultsMessage,
        inModal,
        rows,
        handleSort,
        setResultsPerPage,
        currentColumns,
        filters,
        handleRowsPerPageChange,
        handleOnRowClicked,
        handlePageChange,
        isSearching,
        setIsSearching,
        rawResponse,
        updateTablePagination,
        pageSize,
        pageNumber,
        raw,
    } = useContext(TableResultsContext)

    useEffect(() => {
        if (isBusy !== undefined) {
            setIsSearching(isBusy)
        }
    }, [isBusy]);

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

    const [hiddenColumns, setHiddenColumns] = useState(null)

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

    return (
        <>
            <div className='sui-layout-main-header'>
                <div className='sui-layout-main-header__inner'>

                    <SearchActions exportKind={exportKind} selectedRows={selectedRows.current} filters={filters} data={getTableData()} raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns.current} />
                    {rows.length > 0 && <ColumnsDropdown searchContext={searchContext} filters={filters} defaultHiddenColumns={defaultHiddenColumns} getTableColumns={getTableColumns} setHiddenColumns={setHiddenColumns}
                                      currentColumns={currentColumns.current} />}
                    <ResultsPerPage updateTablePagination={updateTablePagination}
                                    resultsPerPage={pageSize}
                                    setResultsPerPage={setResultsPerPage}
                                    totalRows={totalRows || rawResponse.record_count}  />
                </div>
            </div>


            {<DataTable
                        onColumnOrderChange={cols => {
                            currentColumns.current.current = cols
                            const headers = cols.map((col) => eq(typeof col.name, 'string') ? col.name : col.id)
                            localStorage.setItem(COLS_ORDER_KEY(searchContext()), JSON.stringify(headers))
                        }}
                        className={`rdt_Results ${!inModal ? 'rdt_Results--hascheckboxes' : ''} ${tableClassName}`}
                        columns={getTableColumns(hiddenColumns)}
                        data={getTableData()}
                        theme={'plain'}
                        defaultSortAsc={false}
                        onSort={handleSort}
                        sortServer
                        pointerOnHover={true}
                        highlightOnHover={true}
                        noDataComponent={noResultsMessage}
                        onChangePage={handlePageChange}
                        onChangeRowsPerPage={handleRowsPerPageChange}
                        onRowClicked={!disableRowClick ? handleOnRowClicked : undefined}
                        paginationPerPage={pageSize}
                        paginationRowsPerPageOptions={Object.keys(opsDict)}
                        pagination
                        paginationServer
                        //paginationServerOptions={{persistSelectedOnPageChange: true, persistSelectedOnSort: true}}
                        paginationDefaultPage={pageNumber}
                        paginationTotalRows={totalRows || rawResponse.record_count}
                        progressPending={isSearching}
                        progressComponent={<Spinner />}
                        selectableRowSelected={rowSelectCriteria}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        selectableRowsVisibleOnly={true}
                />}
        </>
    )
}

ResultsBlock.propTypes = {
    getTableColumns: PropTypes.func.isRequired,
    disableRowClick: PropTypes.bool,
    tableClassName: PropTypes.string,
    defaultHiddenColumns: PropTypes.array,
    searchContext: PropTypes.func
}

export default ResultsBlock
