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