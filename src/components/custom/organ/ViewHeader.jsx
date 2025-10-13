/**
 * OrganViewHeader component displays the header information for an organ.
 *
 * @param {Object} props - The properties object.
 * @param {import('@/config/organs').Organ} props.organ - The organ object.
 *
 * @returns {JSX.Element} The JSX code for the OrganViewHeader component.
 */
const OrganViewHeader = ({ organ }) => {
    const labelLink = (o, colSize = 3) => {
        return (<div key={o.subLabel} className={`col-lg-${colSize} col-sm-12 entity-subtitle icon-inline`}>
                    <h4 className='me-2'>{o.label}</h4>
                    <span className='fs-5 title-badge'>
                        <span className='badge bg-secondary'>
                            <a
                                href={o.url}
                                className='icon-inline text-white'
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {o.subLabel}
                            </a>
                            &nbsp;
                            <i className='bi bi-box-arrow-up-right lnk--white'></i>
                        </span>
                    </span>
                </div>)
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
                res.push(labelLink({...organ.meta[o], subLabel: o, url: formatUrl(o)}))
            }
        }
        return res 
    }

    return (
        <div className='viewHeader--organ' style={{ width: '100%' }}>
            {/* Title */}
            <h4>Organ</h4>
            

            {/* Badges */}
            <div className='row mb-2' style={{ minHeight: '38px' }}>
                {labelLink(organ, 4)}
                {getList()}
            </div>
        </div>
    )
}

export default OrganViewHeader
