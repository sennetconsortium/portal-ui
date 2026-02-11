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
        addHighlightToolTip,
        handleSvgSizing,
        svgAppend,
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

    const buildChart = () => {

       
        const sizing = handleSvgSizing(style, chartId, chartType)

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, sizing.width + sizing.margin.X * 1.1, sizing.height + sizing.margin.Y * 1.5])
        

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
            .padding([0.3])

        const stackGen = d3.stack()
          .keys(subgroups)

        const stackedSeries = stackGen(data); 

        const ticks = yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined
        const scaleMethod = yAxis.scaleLog ? d3.scaleLog : d3.scaleLinear
        const minY = yAxis.scaleLog ? 1 : 0
        let maxY = 0;
        for (let d of data) {
            for (let subgroup of subgroups) {
                maxY = Math.max(maxY, d[subgroup] || 0)
            }
        }

        // Add X axis
        const x = scaleMethod()
            .domain([minY, d3.max(stackedSeries, d => d3.max(d, d => d[1]))])
            .range([0, sizing.width + sizing.margin.X * .5]);
        g.append("g")
            .attr('class', 'x-axis')
            .attr("transform", `translate(0, ${sizing.height})`)
            .call(d3.axisBottom(x).ticks(ticks))

        svgAppend({xAxis, yAxis}).axisLabels({svg, sizing})   

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)

        const formatVal = (x) => xAxis.formatter ? xAxis.formatter({x}) : x

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
            .data(stackedSeries)
            .join("g")
              .attr('class', d => style.highlight === d.key ? 'g--highlight' : '')
              .attr("fill", d => {
                const color = style.colorScale  ? style.colorScale({d, maxY}) : colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal(getSubGroupSum(d.key)) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            
            .attr('data-value', d => {
                return formatVal(d.data[d.key])
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key)?.toDashedCase()} ${style.highlight === d.key ? 'bar--highlighted' : ''}`)
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d.data[0]))
            .attr("height", d => style.highlight === d.key ? y.bandwidth() + 5 : y.bandwidth() )
            .attr("width", 0)
            .append("title")
            .text(d => {
                return `${d.data.group}\n${getSubgroupLabel(d.key)}: ${formatVal(d.data[d.key])}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)
            .on("click", toolTipHandlers(chartId, chartType).click)

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
        if (style.highlight) {
          setTimeout(() => {
            addHighlightToolTip(chartId, style.highlight, chartType)
          }, 1000)
        }
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
        <div className={`c-visualizations__chart c-visualizations__horizontalDistributionBar c-bar ${style.className || ''}`} id={`c-visualizations__horizontalDistributionBar--${chartId}`}></div>
    )
}

export default HorizontalDistributionBar