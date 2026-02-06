import dynamic from "next/dynamic";
import React, { useContext, useEffect, useState, useRef, memo } from "react"
import { APP_TITLE } from "@/config/config"
import AppContext from "@/context/AppContext"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import ChartContainer from "@/components/custom/visualizations/ChartContainer";
import { getDistinctOrgansAndCellTypes } from "@/lib/services";
import { formatNum, getUBKGFullName } from "@/components/custom/js/functions";
import { VisualizationsProvider } from "@/context/VisualizationsContext";
import { prepareStackedData } from "@/components/custom/visualizations/charts/StackedBar";
import { FormControlLabel, Switch } from "@mui/material";
import { APP_ROUTES } from "@/config/constants";

const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

const ChartOverview = memo(({ subGroupLabels, visualizationData }) => {
    const [isLogScale, setIsLogScale] = useState(true)

    const onRectClick = (eventData) => {
        Addon.log('onBarClick', { data: eventData })
    }

    const changeScale = (e) => {
        setIsLogScale(!isLogScale)
    }

    const yAxis = { label: "Cell Count", formatter: formatNum, scaleLog: isLogScale, showLabels: true, ticks: 3 }
    const xAxis = { formatter: formatNum, label: `Organs`, showLabels: true }

    return (<VisualizationsProvider options={{ onRectClick }}>
        <FormControlLabel control={<Switch defaultChecked />} label="Log scale" onChange={changeScale} />
        <ChartContainer style={{className: 'c-visualizations--boxShadow'}} subGroupLabels={subGroupLabels.current} data={visualizationData} xAxis={xAxis} yAxis={yAxis} chartType={'stackedBar'} />
    </VisualizationsProvider>)
})

function CellTypes() {
    const { isRegisterHidden } = useContext(AppContext)
    const subGroupLabels = useRef({})

    const [visualizationData, setVisualizationData] = useState([])
    const formatData = (data) => {
        let results = []
        let cellTypes = {}
        let cellId
        for (let d of data) {
            cellTypes = {}
            
            for (let cellType of d.cellTypes) {
                cellId = cellType.cell_id.hits?.hits[0]?._source?.cl_id
                cellTypes[cellId] = cellType.total_cell_count.value
                subGroupLabels.current[cellId] = cellType.key
            }
            results.push({
                group: getUBKGFullName(d.code),
                ...cellTypes
            })
        }

        setVisualizationData(prepareStackedData(results))
    }
    useEffect(() => {
        getDistinctOrgansAndCellTypes().then((data) => {
            if (data) {
                formatData(data)
            }
        })
    }, [])


    return (
        <>
            <Header title={APP_TITLE + ' Cell Types'} />
            <AppNavbar hidden={isRegisterHidden} />
            <Container className="mb-5 d-block">
                <Row>
                    <div className="py-4 d-flex bd-highlight align-items-center">
                        <h1 className="m-0 flex-grow-1 bd-highlight fs-2">Cell Types</h1>
                        <div className="bd-highlight">
                            <a href={APP_ROUTES.search + '/cell-types'} className="btn btn-outline-primary rounded-0 clear-filter-button"
                            >
                                Search All {Object.values(subGroupLabels.current).length} Cell Types
                            </a>
                        </div>
                    </div>
                </Row>
                <p>Explore annotated cell types across SenNet <code>Datasets</code>,
                    with insights into their anatomical distribution and associated biomarkers.
                    Visualize and compare cell type distribution across organs using interactive plots, and find datasets relevant to the cell type.</p>
                <ChartOverview subGroupLabels={subGroupLabels} visualizationData={visualizationData} />
            </Container>
        </>
    )
}

export default CellTypes