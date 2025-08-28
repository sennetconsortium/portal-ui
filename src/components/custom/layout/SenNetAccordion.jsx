import PropTypes from 'prop-types'
import { forwardRef } from 'react'
import { cls } from '@/components/custom/js/functions'

const SenNetAccordion = forwardRef(({ children, title, id, afterTitle, afterButton, className = '', style = {}, expanded = true }, ref) => {
    const refId = id || title

    return (
        <div id={refId} className={cls('accordion accordion-flush sui-result', className)} ref={ref}>
            <div className='accordion-item'>
                <div className='accordion-header'>
                    <button
                        className='accordion-button'
                        type='button'
                        data-bs-toggle='collapse'
                        data-bs-target={`#${refId}-collapse`}
                        aria-expanded={expanded}
                        aria-controls={`${refId}-collapse`}
                    >
                        <span className={'me-2'}>{title}</span>
                        {afterTitle}
                    </button>
                    {afterButton}
                </div>
                <div
                    id={`${refId}-collapse`}
                    style={style}
                    className={cls('accordion-collapse collapse mt-1', expanded ? 'show' : 'show-invisible')}
                >
                    <div className='accordion-body'>{children}</div>
                </div>
            </div>
        </div>
    )
})

SenNetAccordion.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string,
    className: PropTypes.string
}

export default SenNetAccordion
