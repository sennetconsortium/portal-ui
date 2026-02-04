
import SenNetPopover from '@/components/SenNetPopover';
import PropTypes from 'prop-types';

function VizLegend({legend, sortLegend = true, selectedValues = [], onItemClick}) {
    const handleItemClick = (label) => {
        if (onItemClick) {
            onItemClick(label)
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
            if (selectedValues.includes(l.label)) {
                className += ' c-vizLegend__item__selected'
            }
            res.push(
                <li onClick={() => handleItemClick(l.label)} className={className} key={l.label}>
                    <span className='c-vizLegend__item__col' style={{backgroundColor: l.color, ...(l.style || {})}}></span>
                    <span className='c-vizLegend__item__label'>{l.label}</span>
                    <span className='c-vizLegend__item__value'>({l.value})</span>
                </li>
            )
        }
        return res
    }

    return (
        <div className={`c-legend mb-4 ${!onItemClick ? 'c-legend--noHover' : ''}`}>
            <div className='c-vizLegend__title'>
                {/* <h5>Legend</h5> */}
                {onItemClick && <SenNetPopover text='Click a legend item or graph section to filter results'>
                    I
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
