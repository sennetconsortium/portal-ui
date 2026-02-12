import dynamic from "next/dynamic";
import React, { useContext, useEffect, useState, useRef, memo } from "react"
import { APP_TITLE } from "@/config/config"
import AppContext from "@/context/AppContext"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import ChartContainer from "@/components/custom/visualizations/ChartContainer";
import { getDistinctOrgansAndCellTypes } from "@/lib/services";
import { formatNum,  percentage } from "@/components/custom/js/functions";
import { VisualizationsProvider } from "@/context/VisualizationsContext";
import { prepareStackedData } from "@/components/custom/visualizations/charts/StackedBar";
import { FormControlLabel, Switch } from "@mui/material";
import Stack from '@mui/material/Stack';
import { APP_ROUTES } from "@/config/constants";
import { getOrganByCode } from "@/config/organs";
import * as d3 from 'd3';
import { Card } from "react-bootstrap";
import SenNetPopover from "@/components/SenNetPopover";

const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Spinner = dynamic(() => import("@/components/custom/Spinner"))

const ChartOverview = memo(({ subGroupLabels, visualizationData }) => {
    const [isLogScale, setIsLogScale] = useState(true)
    const [isPercentage, setIsPercentage] = useState(false)
    const ticker = useRef(0)
    const totalLinearTicks = 10

    const onRectClick = (eventData) => {
        Addon.log('onBarClick', { data: eventData })
        window.location = `/cell-types/${eventData.d.key}`
    }

    const changeScale = (e) => {
        if (!isLogScale) {
            setIsPercentage(false)
        }
        setIsLogScale(!isLogScale)
    }

    const changeTickFormat = (e) => {
        setIsPercentage(!isPercentage)
    }

    const yAxisPercentageFormatter = ({y}) => {
        if (y === 0) return '0%'
        if (ticker.current === 0 && y !== 0) {
            ticker.current = y * totalLinearTicks
        }
        return percentage(y,  ticker.current) + '%'
    }

    const yAxisTotalFormatter = ({y}) => {
        return formatNum(y)
    }

    const combinedColors = d3.schemeDark2.concat(d3.schemeObservable10).concat(d3.schemePastel1).concat(d3.schemePaired);

    const onSetToolTipContent = (ops) => {
        let total = 0
        let current = 0
        let currentGroup = ops.d?.group
        for (let d of visualizationData) {
            if (d.group === currentGroup) {
                for (let c in d) {
                    if (c !== 'group') {
                        total += d[c]
                    }
                    if (subGroupLabels.current[c] === ops.label) {
                        current = d[c]
                    }
                }
            }
        }
        const label = ops.label
    
        const html = `<div"><span class="fs-6 text-secondary">${currentGroup}</span>
            <span class="fs-6"><em>${label}</em>: <strong>${ops.value} (${percentage(current, total)}%)</strong></span>
            <span><em>Other cell types</em>: <strong>${formatNum(total - current)} (${percentage(total - current, total)}%)</strong></span>
            <span><em>Total</em>: <strong>${formatNum(total)}</strong></span>
            </div>`

        ops.tooltip.getD3(ops.id)
            .style('left', ops.xPos + 40 + 'px')
            .style('top', ops.yPos + 10 + 'px')
            .attr('class', 'c-visualizations__tooltip c-visualizations__tooltip--multiLine')
            .html(html)
    }

    const yAxis = { label: "Cell Count", formatter: isPercentage ? yAxisPercentageFormatter : yAxisTotalFormatter, scaleLog: isLogScale, showLabels: true, ticks: {linear: totalLinearTicks, log: 4} }
    const xAxis = { formatter: ({x}) => formatNum(x), label: `Organs`, showLabels: true }
    console.log(subGroupLabels.current)

    return (<VisualizationsProvider options={{ onRectClick, onSetToolTipContent }}>
        <div className="d-flex">
            <Stack direction="row" spacing={0} sx={{ alignItems: 'center' }}>
                <span>Linear scale &nbsp;</span>
                <FormControlLabel
                    control={<Switch defaultChecked />}
                    label={<span>
                        <sup>
                            <SenNetPopover text={<span>Toggle between linear and symmetric log scale for the counts. Symmetric log scale is useful for visualizing data with a wide range of values.</span>}>
                                <i class="bi bi-info-circle"></i>
                            </SenNetPopover>
                        </sup>&nbsp;&nbsp;Log scale
                    </span>}
                    onChange={changeScale} />
            </Stack>
            <span style={{width: '5%'}}>&nbsp;</span>
            {!isLogScale && <Stack direction="row" spacing={0} sx={{ alignItems: 'center' }}>
                <span>Percentage&nbsp;</span>
                <FormControlLabel
                    control={<Switch defaultChecked />}
                    label={<span>
                        <sup>
                            <SenNetPopover text={<span>Toggle between displaying data as raw counts or percentages.</span>}>
                                <i class="bi bi-info-circle"></i>
                            </SenNetPopover>
                        </sup>&nbsp;&nbsp;Total count
                    </span>}
                    onChange={changeTickFormat} />
            </Stack>}
        </div>
        <ChartContainer style={{ className: 'c-visualizations--posInherit c-visualizations--boxShadow mt-3', colorScheme: combinedColors  }} subGroupLabels={subGroupLabels.current} data={visualizationData} xAxis={xAxis} yAxis={yAxis} chartType={'stackedBar'} />
    </VisualizationsProvider>)
})

function CellTypes() {
    const { isRegisterHidden } = useContext(AppContext)
    const subGroupLabels = useRef({})

    const [visualizationData, setVisualizationData] = useState([])
    const formatData = (data) => {
        let dict = {}
        let results = []
        let cellTypes = {}
        let result
        let cellId, organ
        for (let d of data) {
            cellTypes = {}

            organ = getOrganByCode(d.code)?.label
            result = dict[organ] || {}
            for (const cellType of d.cellTypes) {
                cellId = cellType.cell_id.hits?.hits[0]?._source?.cl_id
                cellTypes[cellId] = cellType.total_cell_count.value + (result[cellId] || 0)
                subGroupLabels.current[cellId] = cellType.key
            }

            results.push({
                group: organ,
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
                <Card>
                    <Card.Body>
                        <div className="p-4"><ChartOverview subGroupLabels={subGroupLabels} visualizationData={visualizationData} /></div>
                    </Card.Body>
                </Card>
            </Container>
        </>
    )
}

export default CellTypes