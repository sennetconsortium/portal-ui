import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {opsDict, ResultsPerPage} from "./ResultsPerPage";
import DataTable from "react-data-table-component";
import {
    PagingInfo
} from "@elastic/react-search-ui";
import TableResultsContext from "../../../context/TableResultsContext";
import ColumnsDropdown from "./ColumnsDropdown";
import {eq} from '../js/functions'
import {COLS_ORDER_KEY} from "@/config/config";
import Spinner from '../Spinner';

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
    } = useContext(TableResultsContext)

    useEffect(() => {
        if (isBusy !== undefined) {
            setIsSearching(isBusy)
        }
    }, [isBusy]);


    const [hiddenColumns, setHiddenColumns] = useState(null)

    return (
        <>
            <div className='sui-layout-main-header'>
                <div className='sui-layout-main-header__inner'>
                    <PagingInfo />
                    {rows.length > 0 && <ColumnsDropdown searchContext={searchContext} filters={filters} defaultHiddenColumns={defaultHiddenColumns} getTableColumns={getTableColumns} setHiddenColumns={setHiddenColumns}
                                      currentColumns={currentColumns.current} />}
                    <ResultsPerPage updateTablePagination={updateTablePagination}
                                    resultsPerPage={pageSize}
                                    setResultsPerPage={setResultsPerPage}
                                    totalRows={totalRows || rawResponse.record_count}  />
                </div>
            </div>


            {<DataTable key={`results-${new Date().getTime()}`}
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
                        paginationDefaultPage={pageNumber}
                        paginationTotalRows={totalRows || rawResponse.record_count}
                        progressPending={isSearching}
                        progressComponent={<Spinner />}
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
