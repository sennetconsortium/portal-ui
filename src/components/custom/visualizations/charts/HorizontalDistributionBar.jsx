import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import VisualizationsContext from '@/context/VisualizationsContext';


function HorizontalDistributionBar({
    setLegend,
    filters,
    data = [],
    reload = false,
    subGroupLabels = {},
    chartId = 'horizontalDistributionBar',
    style = {},
    yAxis = {},
    xAxis = {}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        getSubgroupLabels,
        appendTooltip } = useContext(VisualizationsContext)


    const chartType = 'horizontalDistributionBar'
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

        const dyWidth = style.width || (Math.max(460, data.length * 150))
        const margin = { top: 10, right: 30, bottom: 40, left: 100 },
            width = (Math.min((dyWidth), 1000)) - margin.left - margin.right,
            height = (style.height || 420) - margin.top - margin.bottom;
        const marginY = (margin.top + margin.bottom) * 3
        const marginX = margin.left + margin.right * 3

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", width + marginX)
            .attr("height", height + (style.strict ? 0 : marginY))

        if (!style.hideViewbox) {
            svg.attr("viewBox", [0, 0, width + marginX, height + marginY])
        } 

        const g = svg
            .append("g")
            .attr("transform", style.transform || `translate(${margin.left * 1.5},${margin.top + 50})`)

    
        subGroupLabels = getSubgroupLabels(data, subGroupLabels)

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map(d => (d?.group))

        // Add Y axis
        const y = d3.scaleBand()
            .domain(groups)
            .range([0, height])
            .padding([0.2])

        const stackGen = d3.stack()
          .keys(subgroups)

        const stackedSeries = stackGen(data); 

        const ticks = yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined
        const scaleMethod = yAxis.scaleLog ? d3.scaleLog : d3.scaleLinear
        const minY = yAxis.scaleLog ? 1 : 0

        // Add X axis
        const x = scaleMethod()
            .domain([minY, d3.max(stackedSeries, d => d3.max(d, d => d[1]))])
            .range([0, width]);
        g.append("g")
            .attr('class', 'x-axis')
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(ticks))

        if (showYLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", yAxis.labelPadding || 0)
                .attr("x", (height / 2) * -1)
                .attr("dy", ".74em")
                .attr("transform", "rotate(-90)")
                .text(yAxis.label || "Frequency")
        }

        if (xAxis.label && showXLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "x label")
                .attr("text-anchor", "middle")
                .attr("x", (width / 2) + margin.left)
                .attr("y", height * 1.3)
                .text(xAxis.label)
        }

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const formatVal = (v) => xAxis.formatter ? xAxis.formatter(v) : v

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        if (xAxis.showGrid) {
            g.selectAll(".x-grid")
            .data(x.ticks(ticks))
            .enter().append("line")
            .attr("class", "x-grid")
            .attr("y1", 0)
            .attr("x1", d => Math.ceil(x(d)))
            .attr("y2", width)
            .attr("x2", d => Math.ceil(x(d)))
            .style("stroke", "#eee") // Light gray
            .style("stroke-width", "1px")
        }
      
        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedSeries)
            .join("g")
              .attr("fill", d => {
                const color = colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal(getSubGroupSum(d.key)) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            
            .attr('data-value', d => {
                return formatVal(d[0])
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key)?.toDashedCase()}`)
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d.data[0]))
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .append("title")
            .text(d => {
                return `${d.group}\n${getSubgroupLabel(d.key)}: ${formatVal(d.val)}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("width", d => x(d[1]) - x(d[0]))
          
           
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

    return (
        <div className={`c-visualizations__chart c-visualizations__horizontalDistributionBar c-bar ${style.className || ''}`} id={`c-visualizations__horizontalDistributionBar--${chartId}`}></div>
    )
}

export default HorizontalDistributionBar