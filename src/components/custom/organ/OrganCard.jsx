import Image from 'next/image'
import { Card } from 'react-bootstrap'

const OrganCard = ({ organ }) => {
    const getDisplayQty = (qty) => {
        if (qty === undefined) {
            return ''
        }

        if (qty === 1) {
            return '1 dataset'
        } else {
            return `${qty} datasets`
        }
    }

    return (
        <Card className='p-4 rounded-0 h-100 text-dark card-hover'>
            <Card.Body className='d-flex flex-row justify-content-between'>
                <div>
                    <div className='mb-1 h4'>{organ.label}</div>
                    <div className='mb-1'>{organ.subLabel}</div>
                    <div className='title-badge'>
                        <span
                            className='badge bg-dataset text-dark'
                            style={{
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                width: '100px',
                                height: '25px'
                            }}
                        >
                            {getDisplayQty(organ.datasetQty)}
                        </span>
                    </div>
                </div>
                <Image
                    className='align-self-center'
                    src={organ.icon}
                    alt={organ.label}
                    width='75'
                    height='75'
                />
            </Card.Body>
        </Card>
    )
}

export default OrganCard
