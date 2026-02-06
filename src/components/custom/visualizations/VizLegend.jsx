
import SenNetPopover from '@/components/SenNetPopover';
import PropTypes from 'prop-types';

/**
 * 
 * @param {object} legend
 * @param {function} onItemClick Handler for clicking on legend item
 * @param {function} onItemClick Handler for hovering on legend item
 * @param {function} labelValueFormatter A callback to apply on printing of legend item values; Returns node
 * @param {bool} sortLegend Whether the legend should be sorted by values
 * @param {array} selectedValues List of labels to highlight
 * @param {array} excludedValues List of labels to exclude
 * @param {node|string} legendTooTip The text of the tooltip when a onItemClick is applied
 * @returns 
 */
function VizLegend({legend, onItemClick, onItemHover, labelValueFormatter, sortLegend = true, selectedValues = [], excludedValues = [], legendTooTip = 'Click a legend item or graph section to filter results'}) {
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

    const buildLegend = () => {
        let res = []
        let _legend = Object.values(legend)
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

    return (
        <div className={`c-vizLegend mb-4 ${!onItemClick ? 'c-legend--noHover' : ''}`}>
            <div className='c-vizLegend__title'>
                {onItemClick && <SenNetPopover text={legendTooTip}>
                    <i className="bi bi-info-circle"></i>
                </SenNetPopover>}
            </div>
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
