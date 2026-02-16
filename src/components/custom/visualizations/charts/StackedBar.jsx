import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import VisualizationsContext from '@/context/VisualizationsContext';


function StackedBar({
    setLegend,
    filters,
    data = [],
    reload = false,
    subGroupLabels = {},
    chartId = 'stackedBar',
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
        tooltipValFormatter,
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

        const sizing = handleSvgSizing(style, chartId, chartType)

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, sizing.width + sizing.margin.X, sizing.height + sizing.margin.Y])

        const g = svg
            .append("g")
            .attr("transform", `translate(${sizing.margin.left * 1.5},${sizing.margin.top})`)
    
        subGroupLabels = getSubgroupLabels(data, subGroupLabels)

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map(d => (d?.group))

        const minY = yAxis.minY || (yAxis.scaleLog ? 1 : 0)

        const stackGen = d3.stack()
          .keys(subgroups)
          .value((d, k) => {
            return +d[k] || minY
          })

        const stackedSeries = stackGen(data)

        const maxY = d3.max(stackedSeries, d => d3.max(d, d => d[1]))

        // Add Y axis
        const {y, ticks, minRange} = svgAppend({}).yAxis({data, g, yAxis, sizing, maxY})

        svgAppend({xAxis, yAxis}).axisLabels({svg, sizing})   

        svgAppend({}).grid({g, y, hideGrid: yAxis.hideGrid, ticks, sizing})

        // Add X axis
        const {x} = svgAppend({xAxis}).xAxis({g, groups, sizing})

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)
        const _tooltipValFormatter = (ops) => tooltipValFormatter({...ops, xAxis})

        const getSubgroupLabel = (v) => subGroupLabels[v] || v
      
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
                colors.current[label] = { color, label, value: _tooltipValFormatter({d, v: getSubGroupSum(d.key)}) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            .attr('data-value', d => {
                return _tooltipValFormatter({d, v: d.data[d.key]})
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key)?.toDashedCase()} ${style.highlight === d.key ? 'bar--highlighted' : ''}`)
            
            .attr("x", d => x(d.data.group))
            .attr("y", d => {
              return y(minY)
            })
            .attr("height", 0)
            .attr("width", x.bandwidth() )
            .append("title")
            .text(d => {
                return `${d.data.group}\n${getSubgroupLabel(d.key)}: ${_tooltipValFormatter({d, v: d.data[d.key]})}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)
            .on("click", toolTipHandlers(chartId, chartType).click)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", d => {
              return y(d[1])
            })
            .attr("height", d => {
                const x = d[0] == minY ? minRange : y(d[0] || minY)
                return x - y(d[1])
            })
          

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
        window.addEventListener('resize', updateChart);
        return () => window.removeEventListener('resize', updateChart);
    }, [])

    return (
        <div className={`c-visualizations__chart c-visualizations__stackedBar c-bar ${style.className || ''}`} id={`c-visualizations__stackedBar--${chartId}`}></div>
    )
}

export default StackedBar