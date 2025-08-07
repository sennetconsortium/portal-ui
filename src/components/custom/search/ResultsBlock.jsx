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
import {getCheckboxes} from "@/components/custom/BulkExport";

function ResultsBlock({getTableColumns, disableRowClick, tableClassName = '', defaultHiddenColumns = [], searchContext, totalRows, isBusy}) {

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

    const selectedRows = useRef([])
    const sel = {
        selectAllIo: 'select-all-rows',
        selectedCount: 'sui-selected-count'
    }

    const [hiddenColumns, setHiddenColumns] = useState(null)

    const handleRowSelected = useCallback(state => {
        const $selAllIo =  $(`[name="${sel.selectAllIo}"`)

        const $checkBoxAll = $($selAllIo).parent()
        $checkBoxAll.find(`.${sel.selectedCount}`).remove()

        if (state.selectedCount) {
            selectedRows.current = state.selectedRows
            // add count label
            $checkBoxAll.append(`<span for="${sel.selectAllIo}" class="${sel.selectedCount}">(${state.selectedCount})</span>`)
        }
    }, [])


    const rowSelectCriteria = row => {
        let rows = selectedRows.current.map((e)=> e.id)
        return rows.indexOf(row.id) !== -1
    }

    return (
        <>
            <div className='sui-layout-main-header'>
                <div className='sui-layout-main-header__inner'>

                    <SearchActions selectedRows={selectedRows.current} filters={filters} data={getTableData()} raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns.current} />
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
