import {createContext, useContext, useEffect, useRef} from "react";
import AppContext from "./AppContext";
import * as d3 from "d3";
import { eq } from "@/components/custom/js/functions";

const VisualizationsContext = createContext({})

export const VisualizationsProvider = ({ children, options = {} }) => {

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)

    const chartId = useRef('main')
    const selectors = {
        base: 'c-visualizations__'
    }

    const getSubgroupLabels = (data, labels) => {
        if (Object.keys(labels).lenght) return labels
        let groups = {}
        for (let d of data) {
            for (let k in d) {
                if (k !== 'group') {
                    groups[k] = k
                }
            }
        }
        return groups
    }

    const getChartSelector = (chartId, chart = 'bar', withHash = true) => `${withHash ? '#' : ''}${selectors.base}${chart}--${chartId}`

    const appendDiv = (id, divName, chart = 'bar', index = '') => {
        d3.select(getChartSelector(id, chart))
            .insert('div')
            .attr('id', `${selectors.base}${divName}--${id}${index}`)
            .style('opacity', 0)
            .attr('class', `${selectors.base}${divName}`)
    }

    const appendTooltip = (id, chart = 'bar') => {
        chartId.current = id
        appendDiv(id, 'tooltip', chart)
    }

    const getTooltipSelector = (id) => `#${selectors.base}tooltip--${id}`

    const getTooltip = (id) => d3.select(getTooltipSelector(id))

    const handleLineLabel = (id, e, v) => {
        const $element = $(getTooltipSelector(id)).parent()
        const type = $element.attr('data-type')
        if (eq(type, 'line')) {
            const lineName = e.currentTarget.getAttribute('data-linename')
            d3.select(`.line--${lineName}`).style('opacity', v)
        }
    }

    const buildTooltip = (id, chart, e, d) => {
        const $element = $(getTooltipSelector(id)).parent()
        const marginY = 40 // add a margin to prevent chrome flickering due to overlapping with tooltip
        const label = (e.currentTarget?.getAttribute('data-label')) || d.label || d.data?.label
        const value = (e.currentTarget?.getAttribute('data-value')) || d.value || d.data?.value
        const rect = $element[0]?.getBoundingClientRect()

        const xPos = e.clientX - rect.left
        const yPos = e.clientY - rect.top - marginY

        handleLineLabel(id, e, '1')

        setToolTipContent({id, label, value, xPos, yPos, e, d, chart})
    }

    const setToolTipContent = ({id, label, value, xPos, yPos, e, d, chart}) => {
        if (options.onSetToolTipContent) {
            options.onSetToolTipContent({tooltip: {getD3: getTooltip, getSelector: getTooltipSelector }, 
                id, label, value, xPos, yPos, e, d, 
                chart})
        } else {
            getTooltip(id)
                .html(`<span><em>${label}</em>: <strong>${value}</strong></span>`)
                .style('left', xPos + 'px')
                .style('top', yPos + 'px')
        }
        return getTooltip(id)
    }

    const visibleTooltip = (id, chart, e, d) => {
        getTooltip(id)
            .style('opacity', 1)
        d3.select(this)
            .style('opacity', 0.9)
            .style('cursor', 'pointer')
    }

    const handleSvgSizing = (style, chartId, chart = 'bar') => {
        let $parent = $(getChartSelector(chartId, chart))
        let divWidth = $parent.width()
        let i = 0
        
        while (divWidth <= 0 && i < 10) {
            $parent = $parent.parent()
            divWidth = $parent.width()
            i++
        }

        const minWidth = style.minWidth || divWidth
        const minHeight = style.minHeight || 420

        divWidth = style.width || minWidth
        let divHeight = style.height || minHeight
        const margin = { top: 10, right: 30, bottom: 40, left: 80, ...(style.margin || {}) };
            
        const marginY = (margin.top + margin.bottom) * 2
        const marginX = (margin.left + margin.right) * 2
        const width = divWidth - marginX,
            height = divHeight - marginY;

        return {width, height, margin: {
            Y: marginY,
            X: marginX,
            top: margin.top,
            bottom: margin.bottom,
            right: margin.right,
            left: margin.left
        }}
    }

    const addHighlightToolTip = (id, highlight, chart = 'bar') => {
        let rect, xPos
        let name = 'highlight'
        
        $(`${getChartSelector(id, chart)} .bar--highlighted`).each(function(index, element) {
            appendDiv(id, name, chart, index)
            rect = element?.getBoundingClientRect()

            xPos = Number($(element).attr('x')) - 5
            d3.select(`#${selectors.base}${name}--${id}${index}`)
                .html(`<em class="fs-6">${highlight}</strong>`)
                .style('left', xPos + 'px')
                .style('opacity', 1)
                .style('top', '20px')
        })
    }

    const toolTipHandlers = (id, chart = 'bar') => {
        return {
            click: function (e, d) {
                if (options.onRectClick) {
                    options.onRectClick({id, chart, e, d})
                }
            },
            mouseover: function (e, d) {
                visibleTooltip(id, chart, e, d)
            },
            mouseenter: function (e, d) {
                e.stopPropagation()
                visibleTooltip(id, chart, e, d)
                buildTooltip(id, chart, e, d)
            },
            mousemove: function (e, d) {
                buildTooltip(id, chart, e, d)
            },
            mouseleave: function (e, d) {
                e.stopPropagation()
                handleLineLabel(id, e, '0')
                getTooltip(id)
                    .style('opacity', 0)
                d3.select(this)
                    .style('opacity', 1)
            }
        };
    }
   
    return (
        <VisualizationsContext.Provider
            value={{
                getChartSelector,
                toolTipHandlers,
                appendTooltip,
                addHighlightToolTip,
                getSubgroupLabels,
                handleSvgSizing,
                toolTipHandlers,
                setToolTipContent,
                selectors
            }}
        >
        {children}
    </VisualizationsContext.Provider>
    )
}

export default VisualizationsContext