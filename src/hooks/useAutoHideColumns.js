import {useEffect, useState, useRef} from "react";

/**
 * Automatically hides empty columns
 *
 * @param {list} data - The data
 * @returns {{columnVisibility: {}, tableData: unknown, updateCount: updateCount}}
 */
function useAutoHideColumns({data}) {

    const [columnVisibility, setColumnVisibility] = useState({})
    const counter = useRef({})
    const [tableData, setTableData] = useState(data)
    const [tableReady, setTableReady] = useState(false)
    const [triggerUpdate, setTriggerUpdate] = useState(false)

    /**
     * Counts rows under a given id/field with true condition. Used later to check for 0 values which indicates an empty column.
     *
     * @param id The id to update. Usually the field name of the data
     * @param cond The condition to evaluate that if true, will update counter under specified id
     */
    const updateCount = (id, cond) => {
        if (!counter.current[id]) {
            counter.current[id] = 0
        }
        if (cond) {
            counter.current[id]++
        }
    }

    useEffect(() => {
        if (data && data.length > 0 && (!tableReady || triggerUpdate)) {
            setTableData(data)
            setTableReady(true)
            // This will run after the table is initially rendered with data
            afterTableBuild()
        }

        // In the event the table data changed, like for edit pages' AncestorsTable that use the hook
        // we need to check data length, assert already ready (avoid multiple calls), and set to !ready to trigger a rebuild
        if (data && data.length !== tableData.length && tableReady) {
            setTableReady(false)
        }
    }, [data, tableReady, triggerUpdate])

    /**
     * Checks counts. 0 count values indicate empty columns.
     */
    const afterTableBuild = () => {

        const columnsToOmit = {}
        for (let c in counter.current) {
            if (!counter.current[c]) {
                columnsToOmit[c] = true
            }
        }
        setColumnVisibility(columnsToOmit)
    }


    return {columnVisibility, tableData, updateCount, setTriggerUpdate}
}



export default useAutoHideColumns