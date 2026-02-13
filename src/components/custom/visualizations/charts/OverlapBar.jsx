import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import VisualizationsContext from '@/context/VisualizationsContext';

export const prepareOverlapData = (data, desc = true) => {
    let sorted = []
    if (!data) return sorted
    for (let d of data) {
        sorted.push(Object.fromEntries(
            Object.entries(d).sort(([, a], [, b]) => desc ? (b - a) : (a - b))
        ))
    }

    Addon.log('prepareOverlapData', { data: sorted })

    return sorted
}

function OverlapBar({
    setLegend,
    filters,
    data = [],
    reload = false,
    subGroupLabels = {},
    chartId = 'overlapBar',
    style = {},
    yAxis = {},
    xAxis = {}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        getSubgroupLabels,
        handleSvgSizing,
        svgAppend,
        appendTooltip } = useContext(VisualizationsContext)


    const chartType = 'stackedBar'
    const colors = useRef({})
    const chartData = useRef([])
    const hasLoaded = useRef(false)

    const getSubGroupSum = (key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key]
        }
        return sum
    }

    const buildChart = () => {
        console.log('Stackedchart', data)

        const sizing = handleSvgSizing(style, chartId, chartType)

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, sizing.width + sizing.margin.X, sizing.height + sizing.margin.Y])

        const g = svg
            .append("g")
            .attr("transform", `translate(${sizing.margin.left * 1.5},${sizing.margin.top})`)


        subGroupLabels = getSubgroupLabels(data, subGroupLabels)

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map(d => (d.group))

        let maxY = 0;
        for (let d of data) {
            for (let subgroup of subgroups) {
                maxY = Math.max(maxY, d[subgroup] || 0)
            }
        }
        
        let stackedSorted = []
        for (let d of data) {
            let subgroupsSorted = []
            for (let k in d) {
                if (subGroupLabels[k]) {
                    subgroupsSorted.push({val: d[k] || 0, key: k, group: d.group})
                }
            }
            stackedSorted.push(subgroupsSorted)
        }

        const {y, minY, ticks} = svgAppend({}).yAxis({data, g, yAxis, sizing, maxY})

        svgAppend({xAxis, yAxis}).axisLabels({svg, sizing})    

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)

        const formatVal = (x) => xAxis.formatter ? xAxis.formatter({x}) : x

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        svgAppend({}).grid({g, y, hideGrid: yAxis.hideGrid, ticks, sizing})

        // Add X axis
        const {x} = svgAppend({xAxis}).xAxis({g, groups, sizing})

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedSorted)
            .join("g")
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d)))
            .join("rect")
            .attr("fill", d => {
                const color = style.colorScale  ? style.colorScale({d, maxY}) : colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal(getSubGroupSum(d.key)) }
                return color
            })
            .attr('data-value', d => {
                return formatVal(d.val)
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key).toDashedCase()}`)
            .attr("x", d => x(d.group))
            .attr("y", (sizing.height - sizing.margin.bottom))
            .attr("height", 0)
            .attr("width", x.bandwidth())
            .append("title")
            .text(d => {
                return `${d.group}\n${getSubgroupLabel(d.key)}: ${formatVal(d.val)}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)
            .on("click", toolTipHandlers(chartId, chartType).click)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("height", d => {
                return Math.abs((sizing.height - sizing.margin.bottom) - y(d.val))
            })
            .attr("y", d => {
                return y(d.val)
            })

        return svg.node();
    }

    const updateChart = () => {
        $(getChartSelector(chartId, chartType)).html('')
        appendTooltip(chartId, chartType)
        $(getChartSelector(chartId, chartType)).append(buildChart())

        if (setLegend) {
            setLegend(colors.current)
        }
    }

    useEffect(() => {
        if (reload || chartData.current.length !== data.length || !hasLoaded.current) {
            hasLoaded.current = true
            chartData.current = Array.from(data)
            updateChart()
        }

    }, [data])

    useEffect(() => {
        updateChart()
    }, [filters, yAxis])

    return (
        <div className={`c-visualizations__chart c-visualizations__overlapBar c-bar ${style.className || ''}`} id={`c-visualizations__overlapBar--${chartId}`}></div>
    )
}

export default OverlapBar