import {useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import $ from 'jquery'
import {parseJson} from "../../../lib/services";
import {COLS_ORDER_KEY} from "../../../config/config";


function ColumnsDropdown({ getTableColumns, setHiddenColumns, currentColumns, filters, searchContext, defaultHiddenColumns = [] }) {
    const multiVals = useRef(null)
    const STORE_KEY = `${searchContext}.lastHiddenColumns`

    const colourStyles = {
        multiValueRemove: (styles, { data }) => ({
            ...styles,
            ':hover': {
                backgroundColor: '#0d6efd',
                color: 'white',
            },
        }),
    }
    const updateStore = (cols) => {
        if (cols) {
            //Store what the user last did in the event they navigate away from 'no facets selected' search results view
            //Upon return, user doesn't need to reconfigure table until they click Clear Filters
            localStorage.setItem(STORE_KEY, JSON.stringify(cols))
        }
    }

    const handleChange = (e) => {
        multiVals.current = e
        // Prevent user from removing all columns
        if (e.length === (getTableColumns().length - 1)) {
            e.pop()
            return
        }
        let removeColumns = {}
        for (let out of e) {
            removeColumns[out.value] = true
        }

        setHiddenColumns(removeColumns)
        updateStore(removeColumns)
    }

    const handleDefaultHidden = () => {
        let defaultHidden = null
        if (!filters || !filters.length) {
            let currentVals = []
            defaultHidden = {}
            let lastHiddenColumns = parseJson(localStorage.getItem(STORE_KEY))
            let isHiddenColumn
            for (let col of defaultHiddenColumns) {
                isHiddenColumn = lastHiddenColumns ? lastHiddenColumns[col] : true
                if (isHiddenColumn) {
                    currentVals.push({ value: col, label: col })
                    defaultHidden[col] = true
                }
            }
            multiVals.current =  Array.from(currentVals)
        } else {
            multiVals.current = null
        }
        setHiddenColumns(defaultHidden)
    }

    const getColumnOptions = () => {
        if (!currentColumns.current) return []
        let allColumns = Array.from(currentColumns.current)
        allColumns.splice(0, 1)
        let cols = []
        for (let col of allColumns) {
            if (!col.ignoreRowClick) {
                cols.push({ value: col.name, label: col.name })
            }
        }
        return cols
    }

    useEffect(() => {
        const clearBtnSelector = '.clear-filter-button'
        // Have to listen to click from here instead of in handleClearFiltersClick
        // to manage value states of this independent component
        $('body').on('click', clearBtnSelector, () => {
            localStorage.setItem(STORE_KEY, null)
            localStorage.setItem(COLS_ORDER_KEY(searchContext), null)
            handleDefaultHidden()
        })

        handleDefaultHidden()
        
    }, [multiVals, filters])

    return (

        <Select
            isMulti
            closeMenuOnSelect={false}
            name='hiddenColumns'
            value={multiVals.current}
            options={getColumnOptions()}
            onChange={handleChange}
            classNames={{
                clearIndicator: (state) => 'sui-clear-selection',
            }}
            className='sui-columns-toggle'
            placeholder={`Choose columns to hide`}
            styles={colourStyles}
        />
    )
}

ColumnsDropdown.defaultProps = {
    defaultHiddenColumns: []
}

ColumnsDropdown.propTypes = {
    getTableColumns: PropTypes.func.isRequired,
    setHiddenColumns: PropTypes.func.isRequired,
    currentColumns: PropTypes.object,
    filters: PropTypes.array,
    defaultHiddenColumns: PropTypes.array
}

export default ColumnsDropdown