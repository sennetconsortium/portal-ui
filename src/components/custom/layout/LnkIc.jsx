import PropTypes from 'prop-types'

function LnkIc({title, target='_blank', href='#', className='', icClassName='bi bi-box-arrow-up-right'}) {
    return (
        <a href={href} target={target} className={`lnk--ic ${className}`}>
            {title || href}
            <i className={icClassName}></i>
        </a>
    )
}


LnkIc.propTypes = {
    title: PropTypes.string
}

export default LnkIc