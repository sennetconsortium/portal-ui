import React from "react";
import {withSearch} from "@elastic/react-search-ui";
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";

function CustomClearSearchBox({shouldClearFilters = true}) {
    const { clearSearchTerm, setPageSize, setPageNumber } = useSearchUIContext();

    function handleClearFiltersClick() {
        setPageSize(20)
        setPageNumber(1)
        clearSearchTerm(shouldClearFilters)
        sessionStorage.clear()
    }

    return (
        <div className="clear-filter-div">
            <button className="btn btn-primary rounded-0 clear-filter-button"
                    onClick={handleClearFiltersClick}>Clear Filters
            </button>
        </div>
    );
}

export default withSearch(({setSearchTerm, shouldClearFilters}) => ({
    setSearchTerm, shouldClearFilters
}))(CustomClearSearchBox);