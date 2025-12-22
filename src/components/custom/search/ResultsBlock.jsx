import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {opsDict, ResultsPerPage} from "./ResultsPerPage";
import DataTable from "react-data-table-component";
import TableResultsContext from "@/context/TableResultsContext";
import ColumnsDropdown from "./ColumnsDropdown";
import {eq} from '../js/functions'
import {COLS_ORDER_KEY} from "@/config/config";
import Spinner from '../Spinner';
import SearchActions from "@/components/custom/search/SearchActions";
import useSelectedRows from "@/hooks/useSelectedRows";

/**
 * 
 * @param {function} getTableColumns Returns a list of DataTable type columns
 * @param {function} onCheckboxChange A function to run on change of DataTable checkbox
 * @param {bool} disableRowClick Whether or not to disable row clicks
 * @param {string} tableClassName
 * @param {array} defaultHiddenColumns List of DataTable type column.name
 * @param {function} searchContext The current context of the table, could be based on certain selected facets
 * @param {int} totalRows Number of rows for data table, useful when dealing with query aggregations and count won't be the rawResponse.record_count
 * @param {bool} isBusy
 * @param {string} index (entities | files) The type of search index
 * @param {object} searchActionHandlers An object of callbacks for various search actions. getModalSelectedFiles: Returns a list of files selected in row level FileTree modal
 * @returns 
 */
function ResultsBlock({getTableColumns, onCheckboxChange, disableRowClick, tableClassName = '', 
    exportKind, defaultHiddenColumns = [], searchContext, totalRows, isBusy, index, searchActionHandlers}) {

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

    const [hiddenColumns, setHiddenColumns] = useState(null)
    const {selectedRows, handleRowSelected, rowSelectCriteria  } = useSelectedRows({pageNumber, pageSize, onCheckboxChange})
    const [_, setRefresh] = useState(new Date().getMilliseconds())

    return (
        <>
            <div className='sui-layout-main-header'>
                <div className='sui-layout-main-header__inner'>

                    <SearchActions handleOnRowClicked={handleOnRowClicked}  context={index} setRefresh={setRefresh} 
                    inModal={inModal} exportKind={exportKind} selectedRows={selectedRows} filters={filters} data={getTableData()} 
                    raw={raw} hiddenColumns={hiddenColumns} columns={currentColumns.current} actionHandlers={searchActionHandlers} />
                    
                    <div className='sui-tools-right'>
                        {rows.length > 0 && <ColumnsDropdown searchContext={searchContext} filters={filters} defaultHiddenColumns={defaultHiddenColumns} getTableColumns={getTableColumns} setHiddenColumns={setHiddenColumns}
                                        currentColumns={currentColumns.current} />}
                        <ResultsPerPage updateTablePagination={updateTablePagination}
                                        resultsPerPage={pageSize}
                                        setResultsPerPage={setResultsPerPage}
                                        totalRows={totalRows || rawResponse.record_count}  />
                    </div>
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
                        selectableRows={!inModal || eq(index, 'files')}
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
