import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import VisualizationsContext from '@/context/VisualizationsContext';


function HorizontalStackedBar({
    setLegend,
    filters,
    data = [],
    reload = false,
    subGroupLabels = {},
    chartId = 'hStackedBar',
    style = {},
    yAxis = {},
    xAxis = {}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        getSubgroupLabels,
        handleSvgSizing,
        appendTooltip } = useContext(VisualizationsContext)


    const chartType = 'horizontalStackedBar'
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

    const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const showYLabels = () => yAxis.showLabels !== undefined ? yAxis.showLabels : true

    const buildChart = () => {

        const sizing = handleSvgSizing(style, chartId, chartType)

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", sizing.width + sizing.margin.X)
            .attr("height", sizing.height + (style.strict ? 0 : sizing.margin.Y))

        if (!style.hideViewbox) {
            svg.attr("viewBox", [0, 0, sizing.width + sizing.margin.X, sizing.height + sizing.margin.Y])
        } 

        const g = svg
            .append("g")
            .attr("transform", style.transform || `translate(${sizing.margin.left * 1.5},${sizing.margin.top + 50})`)

    
        subGroupLabels = getSubgroupLabels(data, subGroupLabels)

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map(d => (d?.group))

        // Add Y axis
        const y = d3.scaleBand()
            .domain(groups)
            .range([0, sizing.height])
            .padding([0.2])

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

        const ticks = yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined
        const scaleMethod = yAxis.scaleLog ? d3.scaleLog : d3.scaleLinear
        const minY = yAxis.scaleLog ? 1 : 0

        // Add X axis
        const x = scaleMethod()
            .domain([minY, maxY])
            .range([0, sizing.width]);
        g.append("g")
            .attr('class', 'x-axis')
            .attr("transform", `translate(0, ${sizing.height})`)
            .call(d3.axisBottom(x).ticks(ticks))

        if (showYLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", yAxis.labelPadding || 0)
                .attr("x", (sizing.height / 2) * -1)
                .attr("dy", ".74em")
                .attr("transform", "rotate(-90)")
                .text(yAxis.label || "Frequency")
        }


        if (xAxis.label && showXLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "x label")
                .attr("text-anchor", "middle")
                .attr("x", (sizing.width / 2) + sizing.margin.left)
                .attr("y", sizing.height * 1.3)
                .text(xAxis.label)
        }

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)

        const formatVal = (v) => xAxis.formatter ? xAxis.formatter(v) : v

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        if (xAxis.showGrid) {
            g.selectAll(".x-grid")
            .data(x.ticks(ticks))
            .enter().append("line")
            .attr("class", "x-grid")
            .attr("y1", 0)
            .attr("x1", d => Math.ceil(x(d)))
            .attr("y2", sizing.width)
            .attr("x2", d => Math.ceil(x(d)))
            .style("stroke", "#eee") // Light gray
            .style("stroke-width", "1px")
        }

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
            .attr("class", d => `bar--${getSubgroupLabel(d.key)?.toDashedCase()}`)
            .attr("y", d => y(d.group))
            .attr("width", 0)
            .attr("height", y.bandwidth())
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
            .attr("width", d => {
                return x(d.val)
            })
          
           
        g.append("g")
            .attr("class", `y-axis`)
            .call(d3.axisLeft(y));

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
        addEventListener("resize", (event) => {
            updateChart()
        })
    }, [])

    return (
        <div className={`c-visualizations__chart c-visualizations__horizontalStackedBar c-bar ${style.className || ''}`} id={`c-visualizations__horizontalStackedBar--${chartId}`}></div>
    )
}

export default HorizontalStackedBar