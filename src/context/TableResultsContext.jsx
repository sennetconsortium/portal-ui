import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import $ from "jquery";
import AppContext from "./AppContext";
import {RESULTS_PER_PAGE} from "../config/config";
import {createTheme} from "react-data-table-component";
import SearchUIContext from "search-ui/components/core/SearchUIContext";
import {handleTableControls} from "@/components/custom/search/ResultsPerPage";
import {eq} from "@/components/custom/js/functions";
const TableResultsContext = createContext({})

export const TableResultsProvider = ({ index, columnsRef, children, getHotLink, rows, filters, onRowClicked, forData = false, raw, getId, inModal = false }) => {

    const {isLoggedIn} = useContext(AppContext)
    const {isLoading, rawResponse, pageNumber,
        setPageNumber, pageSize, setPageSize, setSort} = useContext(SearchUIContext)
    const sortedFields = useRef({})

    const hasLoaded = useRef(false)
    let pageData = []
    const [resultsPerPage, setResultsPerPage] = useState(RESULTS_PER_PAGE[1])
    const currentColumns = useRef(columnsRef)

    const hasSearch = () => {
        return filters.length > 0 || $('#search').val()?.length > 0
    }

    const getNoDataMessage = () => {
        if (!hasLoaded.current) return (<></>)
        return (
            <div className={'alert alert-warning text-center'} style={{padding: '24px'}}>
                {isLoggedIn() && !hasSearch() && <span>No results to show.</span>}
                {hasSearch() && <span>No results to show. Please check search filters/keywords and try again.</span>}
                {!isLoggedIn() && !hasSearch() && <span>There are currently no published entities available to view.</span>}
                {!isLoggedIn() && <span><br /> To view non-published data, please <a href={'/login'}>log in</a>.</span>}
            </div>
        )
    }

    const [noResultsMessage, setNoResultsMessage] = useState(getNoDataMessage())


    createTheme('plain', {
        background: {
            default: 'transparent',
        }})

    const handleOnRowClicked = (row, e) => {
        e.stopPropagation()
        if (onRowClicked === undefined) {
            window.location = getHotLink(row)
        } else {
            onRowClicked(e, row.uuid?.raw, row)
        }
    }

    const updateTablePagination = (page, currentRowsPerPage) => {
        setPageSize(currentRowsPerPage)
        setPageNumber(page)
    }

    const handleSort = (column, sortDirection) => {
        let sorting = []
        let field = column.fieldName
        const direction = eq(sortedFields.current[field], 'desc') ? 'asc' : 'desc'
        const newSort = {
            field: `${field}.keyword`,
            direction
        }
        let found = false
        for (let i = 0; i < sorting.length; i++) {
            if (eq(sorting[i].field, field)) {
                found = true
                sorting[i] = newSort
                break
            }
        }
        if (!found) {
            sorting.push(newSort)
        }
        sortedFields.current[field] = direction
        setSort(sorting)
    }

    const handlePageChange = (page, totalRows) => {
        updateTablePagination(page, resultsPerPage)
        handleTableControls()
    }
    const handleRowsPerPageChange = (currentRowsPerPage, currentPage) => {
        setResultsPerPage(currentRowsPerPage)
        updateTablePagination(1, currentRowsPerPage)
        handleTableControls()
    }

    useEffect(() => {
        hasLoaded.current = true
        setNoResultsMessage(getNoDataMessage())
    }, [])

    useEffect(() => {
        setNoResultsMessage(getNoDataMessage())
    }, [filters])

    const getTableData = () => {
        pageData = []
        //handlePageChange(1, rows.length)
        if (rows.length) {
            for (let row of rows) {
                let _row = row.props ? row.props.result : row
                pageData.push({..._row, id: raw(_row.id || _row.sennet_id)})
            }
        }
        return pageData;
    }


    return <TableResultsContext.Provider value={{
        getTableData,
        hasSearch,
        inModal,
        raw,
        hasLoaded,
        pageData,
        resultsPerPage,
        setResultsPerPage,
        setPageSize, setSort,
        handleSort,
        pageSize,
        pageNumber,
        currentColumns,
        getId,
        rows,
        filters,
        handleRowsPerPageChange,
        handleOnRowClicked,
        handlePageChange,
        noResultsMessage,
        isLoading,
        rawResponse,
        updateTablePagination
    }}>
        { children }
    </TableResultsContext.Provider>
}

export default TableResultsContext
