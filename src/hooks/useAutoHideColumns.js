import {useEffect, useState} from "react";

function useAutoHideColumns({data}) {

    const [columnVisibility, setColumnVisibility] = useState({})
    const counter = {}
    const [tableData, setTableData] = useState(data)
    const [tableReady, setTableReady] = useState(false)

    const updateCount = (id, cond) => {
        if (!counter[id]) {
            counter[id] = 0
        }
        if (cond) {
            counter[id]++
        }
    }

    useEffect(() => {
        if (data && data.length > 0 && !tableReady) {
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
    }, [data, tableReady])

    const afterTableBuild = () => {

        const columnsToOmit = {}
        for (let c in counter) {
            if (!counter[c]) {
                columnsToOmit[c] = true
            }
        }
        setColumnVisibility(columnsToOmit)
    }


    return {columnVisibility, tableData, updateCount}
}



export default useAutoHideColumns