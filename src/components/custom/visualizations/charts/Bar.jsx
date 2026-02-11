import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import VisualizationsContext from '@/context/VisualizationsContext';

function Bar({
    setLegend,
    column,
    filters,
    data = [],
    chartId = 'bar',
    reload = false,
    onSectionClick,
    style = {},
    yAxis = {},
    xAxis = {},
}) {

    const hasLoaded = useRef(false)
    const {
        getChartSelector,
        toolTipHandlers,
        handleSvgSizing,
        svgAppend,
        appendTooltip } = useContext(VisualizationsContext)

    const chartType = 'bar'
    const colors = {}
    const chartData = useRef([])

    const truncateLabel = (label) => {
        return label.length > 30 ? label.substring(0, 27) + "..." : label;
    }

    const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const buildChart = () => {
        let names 
        if (xAxis.noSortLabels) {
            names = data.map((d) => d.label)
        } else {
            data.sort((a, b) => b.value - a.value)
            const groups = d3.groupSort(data, ([d]) => -d.value, (d) => d.label);
            names = groups.map((g) => g)
        }
    
        // Declare the chart dimensions and margins.
        const sizing = handleSvgSizing(style, chartId, chartType)

        if (showXLabels()) {
            // We need to calculate the maximum label width to adjust for the label being at 45 degrees.
            const tempSvg = d3.select("body").append("svg").attr("class", "temp-svg").style("visibility", "hidden");
            let maxLabelWidth = 0;
            names.forEach(name => {
                const truncName = truncateLabel(name);
                const textElement = tempSvg.append("text").text(truncName).style("font-size", "11px");
                const bbox = textElement.node().getBBox();
                if (bbox.width > maxLabelWidth) {
                    maxLabelWidth = bbox.width;
                }
                textElement.remove();
            });
            tempSvg.remove();

            if (xAxis.rotateLabels) {
                // Adjust the bottom margin and height to not cut off the labels.
                sizing.margin.bottom = sizing.margin.bottom + maxLabelWidth * Math.sin(Math.PI / 4);
                sizing.height = sizing.height + maxLabelWidth * Math.sin(Math.PI / 4);
            }
        }

        // Create the color scale.
        const colorScale = d3.scaleOrdinal(style.colorScheme || d3.schemeCategory10)

        // Bar must have a minimum height to be able to click. 2% of the max value seems good
        const maxY = d3.max(data, (d) => d.value)

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, sizing.width + sizing.margin.X, sizing.height + sizing.margin.Y])

        const g = svg
            .append("g")
            .attr("transform", `translate(${sizing.margin.left * 1.5},${sizing.margin.top})`)

        // Declare the x (horizontal position) scale.
        const {x, xAxisLabels} = svgAppend({xAxis}).xAxis({g, groups: names, sizing})

        // Add the y-axis and label, and remove the domain line.
        const {y, minY, ticks} = svgAppend({}).yAxis({data, g, yAxis, sizing, maxY})
        

        svgAppend({}).grid({g, y, hideGrid: yAxis.hideGrid, ticks, sizing})

        // Add a rect for each bar.
        g.append("g")
            .selectAll()
            .data(data)
            .join("rect")
            .attr("class", d => `bar--${d.label?.toDashedCase()}`)
            .attr("x", (d) => x(d.label))
            .attr('data-value', (d) => yAxis.formatter ? yAxis.formatter({y: d.value}) : d.value)
            .attr("fill", function (d) {
                const color = style.colorScale  ? style.colorScale({d, maxY, column}) : colorScale(d.label)
                colors[d.label] = { color, value: yAxis.formatter ? yAxis.formatter({y: d.value}) : d.value, label: d.label };
                return color;
            })
            .attr("y", (d) => y(minY))
            .attr("height", (d) => 0)
            .attr("width", x.bandwidth())
          
      
        if (xAxis.rotateLabels) {
            xAxisLabels.style("text-anchor", "end")
                .attr("dx", "-0.8em")
                .attr("dy", "0.15em")
                .attr("transform", "rotate(-45)")
                .text(function (d) {
                    return truncateLabel(d);
                });
        }

        svgAppend({xAxis, yAxis}).axisLabels({svg, sizing}) 

        // Animation
        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", (d) => y(d.value))
            .attr("height", function (d) { return y(minY) - y(d.value); })
            .delay(function (d, i) { return (i * 100) })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId).mouseover)
            .on("mousemove", toolTipHandlers(chartId).mousemove)
            .on("mouseleave", toolTipHandlers(chartId).mouseleave)
            .on("click", toolTipHandlers(chartId, chartType).click)

        // Return the SVG element.
        return svg.node();
    }

    const updateChart = () => {
        $(getChartSelector(chartId)).html('')
        appendTooltip(chartId)
        $(getChartSelector(chartId)).append(buildChart())

        if (setLegend) {
            setLegend(colors)
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
        <div className={`c-visualizations__chart c-visualizations__bar c-bar ${style.className || ''}`} id={`c-visualizations__bar--${chartId}`}></div>
    )
}


Bar.propTypes = {
    children: PropTypes.node
}

export default Bar