import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import VisualizationsContext from '@/context/VisualizationsContext';

/***
 * @param {useState method} setLegend The react useState method for setting legend items
 * @param {useState value} filters Used to trigger a rerender on filter changes
 * @param {array} data List to visualize [{group: 'x-axis label', groupLabel1: x, groupLabel2: y}, {group: 'x-axis label 2', groupLabel1: x, groupLabel2: y}]
 * @param {bool} reload An additional flag if want to prevent or allow rerendering even on filters and yAxis changes
 * @param {subGroupLabels} {object} A map of labels to use for groupLabels e.g. {groupLabel1: 'A Group Label', groupLabel2: 'Another Group Label'}
 * @param {chartId} {string} Imperative for multiple charts on same page.
 * @param {style} {object} {width, height, className}
 * @param {xAxis} {object} {formatter: function(v) for formatting axis ticks, label: string, showLabels: bool}
 * @param {yAxis} {object} {scaleLog: bool, ticks: int, label: string, showLabels: bool, showGrid: bool}
 */
function GroupedBar({
    setLegend,
    filters,
    data = [],
    reload = false,
    subGroupLabels = {},
    chartId = 'groupedBar',
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
        tooltipValFormatter,
        appendTooltip } = useContext(VisualizationsContext)


    const chartType = 'groupedBar'
    const colors = useRef({})
    const chartData = useRef([])
    const hasLoaded = useRef(false)

    const getSubGroupSum = (key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key] || 0
        }
        return sum
    }

    const buildChart = () => {

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

        // Add Y axis
        const {y, minY, ticks} = svgAppend({}).yAxis({data, g, yAxis, sizing, maxY})

        svgAppend({xAxis, yAxis}).axisLabels({svg, sizing})   

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)
        const _tooltipValFormatter = (ops) => tooltipValFormatter({...ops, xAxis})

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        svgAppend({}).grid({g, y, hideGrid: yAxis.hideGrid, ticks, sizing})

        // Add X axis
        const {x} = svgAppend({xAxis}).xAxis({g, groups, sizing})

        var xSubgroup = d3.scaleBand()
            .domain(subgroups)
            .range([0, x.bandwidth()])
            .padding([0.05])

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(data)
            .join("g")
                .attr("transform", (d) => { return "translate(" + x(d.group) + ",0)"; })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data((d) => {
                return subgroups.map((key) => {
                    return {key: key, group: d.group, val: d[key] || 0}; }); })
            .join("rect")
            .attr("fill", d => {
                const color = style.colorScale  ? style.colorScale({d, maxY}) : colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value:  _tooltipValFormatter({d, v: getSubGroupSum(d.key)}) }
                return color
            })
            .attr('data-value', d => {
                return  _tooltipValFormatter({d, v: d.val})
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key).toDashedCase()}`)
            .attr("x", d => xSubgroup(d.key))
            .attr("y", y(minY))
            .attr("height", 0)
            .attr("width", xSubgroup.bandwidth())
            .append("title")
            .text(d => {
                return `${d.group}\n${getSubgroupLabel(d.key)}: ${ _tooltipValFormatter({d, v: d.val})}`
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
                return y(minY) - y(d.val)
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

    useEffect(() => {
        window.addEventListener('resize', updateChart);
        return () => window.removeEventListener('resize', updateChart);
    }, [])

    return (
        <div className={`c-visualizations__chart c-visualizations__groupedBar c-bar ${style.className || ''}`} id={`c-visualizations__groupedBar--${chartId}`}></div>
    )
}

export default GroupedBar