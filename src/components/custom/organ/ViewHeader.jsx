import React from 'react'
import PropTypes from 'prop-types'

/**
 * OrganViewHeader component displays the header information for an organ.
 *
 * @param {Object} props - The properties object.
 * @param {import('@/config/organs').Organ} props.organ - The organ object.
 *
 * @returns {JSX.Element} The JSX code for the OrganViewHeader component.
 */
const OrganViewHeader = ({ organ }) => {
    const labelLink = (o) => {
        return (
            <div
                key={o.subLabel}
                className='d-inline-flex align-items-center gap-2 entity-subtitle icon-inline'
                style={{ margin: 0, padding: 0 }}
            >
                <h4 className='mb-0'>{o.label}</h4>
                <span className='fs-5 title-badge mb-0' style={{ lineHeight: 1 }}>
                    <span className='badge bg-secondary'>
                        <a
                            href={o.url}
                            className='icon-inline text-white mb-0'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {o.subLabel}
                        </a>
                        &nbsp;
                        <i className='bi bi-box-arrow-up-right lnk--white'></i>
                    </span>
                </span>
            </div>
        )
    }

    const formatUrl = (o) => {
        if (o.includes('UBERON')) {
            return `http://purl.obolibrary.org/obo/${o.replace(':', '_')}`
        } else {
            return `http://purl.org/sig/ont/fma/${o.replace(':', '')}`.toLowerCase()
        }
    }
    const getList = () => {
        let res = []
        if (organ.meta) {
            for (let o in organ.meta) {
                res.push(labelLink({ ...organ.meta[o], subLabel: o, url: formatUrl(o) }))
            }
        }
        return res
    }

    const subItems = getList()

    return (
        <div className='viewHeader--organ mb-3' style={{ width: '100%' }}>
            {/* Title */}
            <h4 className='mb-2'>Organ</h4>

            {/* Badges */}
            <div
                className='d-flex flex-wrap align-items-center'
                style={{ columnGap: '1.25rem', rowGap: '0.25rem' }}
            >
                {labelLink(organ)}
                {subItems}
            </div>
        </div>
    )
}

OrganViewHeader.propTypes = {
    organ: PropTypes.shape({
        label: PropTypes.string,
        subLabel: PropTypes.string,
        url: PropTypes.string,
        meta: PropTypes.objectOf(
            PropTypes.shape({
                label: PropTypes.string
            })
        )
    }).isRequired
}

export default OrganViewHeader
