import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'

function SenNetAccordion({children, title, id, afterTitle, className = '', expanded = true}) {
    const [refId, setRefId] = useState(id)
    useEffect(() => {
        if (id == null && typeof title === 'string') {
            setRefId(title)
        }
    }, [])

    return (
        <div className={`accordion accordion-flush sui-result ${className}`} id={refId}>
            <div className="accordion-item ">
                <div className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse"
                            data-bs-target={`#${refId}-collapse`} aria-expanded={expanded}
                            aria-controls={`${refId}-collapse`}><span className={"me-2"}>{title}</span>{afterTitle}
                    </button>
                </div>
                <div id={`${refId}-collapse`} className={`accordion-collapse collapse ${expanded ? 'show' : 'show-invisible'}`}>
                    <div className="accordion-body">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

SenNetAccordion.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string,
    className: PropTypes.string
}

export default SenNetAccordion