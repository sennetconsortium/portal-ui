import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import $ from "jquery";
import { useRouter } from 'next/router'
import AppContext from "./AppContext";
import {RESULTS_PER_PAGE} from "@/config/config";
import {createTheme} from "react-data-table-component";
import {handleTableControls} from "@/components/custom/search/ResultsPerPage";
import {eq} from "@/components/custom/js/functions";
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";
import {SEARCH_ENTITIES} from "@/config/search/entities";

const TableResultsContext = createContext({})

export const TableResultsProvider = ({ index, columnsRef, children, getHotLink, rows, filters, onRowClicked, forData = false, raw, getId, inModal = false }) => {

    const {isLoggedIn} = useContext(AppContext)
    const {isLoading, rawResponse, pageNumber, setPageNumber, pageSize, setPageSize, setSort, addFilter, clearSearchTerm} = useSearchUIContext()
    const sortedFields = useRef({})
    const router = useRouter()

    const hasLoaded = useRef(false)
    let pageData = []
    const [resultsPerPage, setResultsPerPage] = useState(RESULTS_PER_PAGE[1])

    const currentColumns = useRef(columnsRef)


    useEffect(() => {
        if (!router.isReady) return

        // ?addFilters=organ=LL,RL
        let reqFilters = router.query.addFilters
        if (reqFilters) {
            clearSearchTerm()
            reqFilters = reqFilters.trim().split(';')

            for (let f of reqFilters) {

                // handle the actual facets sent in request
                let kv = f.split('=')
                let values = kv[1].split(',')
                for (let v of values) {
                    addFilter(kv[0], v)
                }

                // check for conditional facets
                const deps = SEARCH_ENTITIES.searchQuery.facets[kv[0]]?.dependencies
                if (deps) {
                    for (let d of deps) {
                        let values = d[1]?.split(',')
                        for (let v of values) {
                            addFilter(d[0], v)
                        }
                    }
                }
            }
        }

    }, [router.isReady, router.query])

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
        if (page * currentRowsPerPage > 10000) {
            page = Math.floor(10000 / currentRowsPerPage)
        }
        setPageSize(currentRowsPerPage)
        setPageNumber(page)
    }

    const handleSort = (column, order) => {
        let sorting = []
        let field = column.id
        if (sortedFields.current[field] === undefined) sortedFields.current[field] = order
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

        // This is an unfortunate hack because react-data-table-component uses defaultValue as Select prop,
        // no value prop is exposed. We can either use our own custom Pagination component or
        // if we want to keep the one from react-data-table-component need to add a dynamic key prop to the DataTable component
        // and manually apply these css classes to indicate sorting
        $('[role="columnheader"]').removeClass('is-activeSort')
        setTimeout(() => {
            $(`[data-column-id="${field}"][role="columnheader"]`).addClass(`is-activeSort`).attr('data-sort-direction', direction)
        }, 500)
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
