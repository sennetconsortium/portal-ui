/**
 * OrganViewHeader component displays the header information for an organ.
 *
 * @param {Object} props - The properties object.
 * @param {import('@/config/organs').Organ} props.organ - The organ object.
 *
 * @returns {JSX.Element} The JSX code for the OrganViewHeader component.
 */
const OrganViewHeader = ({ organ }) => {
    return (
        <div style={{ width: '100%' }}>
            {/* Title */}
            <h4>Organ</h4>
            <h3>{organ.label}</h3>

            {/* Badges */}
            <div className='row mb-2' style={{ minHeight: '38px' }}>
                <div className='col-md-6 col-sm-12 entity-subtitle icon-inline'>
                    <h5 className='title-badge'>
                        <span className='badge bg-secondary'>
                            <a
                                href={organ.url}
                                className='icon-inline text-white'
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {organ.subLabel}
                            </a>
                            &nbsp;
                            <i className='bi bi-box-arrow-up-right lnk--white'></i>
                        </span>
                    </h5>
                </div>
            </div>
        </div>
    )
}

export default OrganViewHeader
