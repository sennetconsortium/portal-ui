import React, {useRef, useState, useEffect} from 'react'
import SenNetPopover from '@/components/SenNetPopover';
import PropTypes from 'prop-types';

/**
 * 
 * @param {bool} isFilterable Whether to include a search input for filtering the items
 * @param {node|string} title Legend title
 * @param {object} legend {color, label, value}
 * @param {function} onItemClick Handler for clicking on legend item
 * @param {function} onItemClick Handler for hovering on legend item
 * @param {function} labelValueFormatter A callback to apply on printing of legend item values; Returns node
 * @param {bool} sortLegend Whether the legend should be sorted by values
 * @param {array} selectedValues List of labels to highlight
 * @param {array} excludedValues List of labels to exclude
 * @param {node|string} legendToolTip The text of the tooltip when a onItemClick is applied
 * @returns 
 */
function VizLegend({isFilterable, title, legend, onItemClick, onItemHover, labelValueFormatter, sortLegend = true, selectedValues = [], excludedValues = [], legendToolTip = 'Click a legend item or graph section to filter results'}) {
    const legendItems = useRef(null)
    const [legendObj, setLegendObj] = useState(legend)

    const handleItemClick = (label) => {
        if (onItemClick) {
            onItemClick(label)
        }
    }

    const handleItemHover = (label) => {
        if (onItemHover) {
            onItemHover(label)
        }
    }

    const handleLabelValueFormatter = (label) => {
        if (labelValueFormatter) {
            return labelValueFormatter(label)
        } else {
            return <>({label.value})</>
        }
    }

    const filterLegend = (e) => {
        if (legendItems.current == null) {
            legendItems.current = JSON.parse(JSON.stringify(legendObj))
        }
        const keyword = $(e.currentTarget).parent().find('input').val()?.toLowerCase()
        if (keyword.length) {
            let _filtered = {}
            for (const l in legendItems.current) {
                if (legendItems.current[l].label.toLowerCase().includes(keyword)) {
                    _filtered[l] = legendItems.current[l]
                }
            }
            setLegendObj(_filtered)
        } else {
            setLegendObj(legendItems.current)
        }
    }

    const handleOnKeyDown = (e) => {
        filterLegend(e)
    }

    const buildLegend = () => {
        let res = []
        let _legend = Object.values(legendObj)
        if (sortLegend) {
          _legend.sort((a, b) => b.value - a.value)  
        }
        for (let l of _legend) {
            let className = 'c-vizLegend__item'
            if (!excludedValues.includes(l.label)) {
                if (selectedValues.includes(l.label)) {
                    className += ' c-vizLegend__item__selected'
                }
                res.push(
                    <li onMouseOver={() => handleItemHover(l)} onClick={() => handleItemClick(l)} className={className} key={l.label}>
                        <span className='c-vizLegend__item__col' style={{backgroundColor: l.color, ...(l.style || {})}}></span>
                        <span className='c-vizLegend__item__label'>{l.label}</span>
                        <span className='c-vizLegend__item__value'>{handleLabelValueFormatter(l)}</span>
                    </li>
                )
            }
        }
        return res
    }

    useEffect(() => {
        if (legend) {
            setLegendObj(legend)
        }
    }, [legend])

    useEffect(() => {
        if (isFilterable) {
            document.getElementById("form-filter").addEventListener("search", (e) => {
                filterLegend(e)
            })
        }
    }, [])

    return (
        <div className={`c-vizLegend mb-4 ${!onItemClick ? 'c-legend--noHover' : ''}`}>
            <div className='c-vizLegend__title'>
                {title}
                {legendToolTip && <SenNetPopover text={legendToolTip}>
                    <i className="bi bi-info-circle"></i>
                </SenNetPopover>}
            </div>
            {isFilterable && <div className='mb-2 input-group'>
              <input id="form-filter" className="form-control" type="search" onKeyDown={handleOnKeyDown} />
              <button onClick={(e) => filterLegend(e)} className="btn btn-outline-secondary" type="button" arai-label="Search" id="button-addon2"><i className="bi bi-search"></i></button>
            </div>}
            <ul className='c-vizLegend__list'>
                {buildLegend()}
            </ul>
        </div>
    )
}

VizLegend.propTypes = {
    children: PropTypes.node
}

export default VizLegend
