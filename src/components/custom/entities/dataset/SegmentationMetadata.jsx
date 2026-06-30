import React from 'react'
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import { Row, Col, Card } from 'react-bootstrap'
import SenNetPopover from '@/components/SenNetPopover'

function SegmentationMetadata({ data }) {

    const getChannels = (item) => {
        const list = []
        const fields = [
            {
                name: 'NucleusSegmentationChannels',
                label: 'Nucleus Segmentation Channels',
                tooltip: 'Channels used for nucleus segmentation.'
            },
            {
                name: 'CellSegmentationChannels',
                label: 'Cell Segmentation Channels',
                tooltip: 'Channels used for cell segmentation.'
            }
        ]
        let field
        for(const f of fields) {
            field = f.name
            if(item[field] && item[field].length > 0) {
                list.push(<p key={field}><strong>{f.label}:</strong> <br /> {item[field].join(', ')}</p>)
            }
        }
        return list
    }

    const getSegmentationQuality = (item) => {
        const list = []
        const fields = [
            {
                name: 'QualityScore',
                label: 'Quality Score',
                tooltip: 'Overall quality score of image and segmentation results, computed from all available metrics weighted by a PCA model.'
            },
            {
                name: 'Mean_SNZ',
                label: 'Mean SNZ',
                tooltip: 'Signal to noise ratio of expression image, averaged across all channels.'
            },
            {
                name: 'ACVF',
                label: 'ACVF',
                tooltip: 'Coefficient of variation in foreground pixels outside cells, averaged across all expression image channels.'
            }
        ]
        let field, val
        for(const f of fields) {
            field = f.name
            if(item[field] !== undefined && item[field] !== null) {
                val = Number(item[field])
                val = val ? val.toFixed(2) : item[field]
                list.push(<p key={field}><strong>{f.label}: <SenNetPopover text={f.tooltip} className={`popover-${field}`}>
                                    <i className="bi bi-question-circle-fill"></i>
                                </SenNetPopover></strong> <br /> {val}</p>)
            }
        }
      
        return list
    }

    return (
        <div>
            <h3>Segmentation Channels & Quality</h3>
            <p>
                Segmentation Channels & Quality These channels were used for
                segmentation, which are visible in the visualization.
                Segmentation outputs and quality control scores are available
                for each image, with additional segmentation information
                described in the workflow description in the Protocols &
                Workflow Details section.
            </p>
            <div className='container-fluid m-0 p-0'>
                {data.map((item, index) => (
                    <Row key={index} className='mb-3'>
                        <Col md={6} className='mb-3 mb-md-0'>
                            <Card>
                                <Card.Header as="h6">Segmentation Channels</Card.Header>
                                <Card.Body>
                                    <div className="mt-2 p-4">
                                        {getChannels(item)}
                                    </div>
                                    
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header as="h6">Segmentation Quality</Card.Header>
                                <Card.Body>
                                    <div className="mt-2 p-4">
                                        {getSegmentationQuality(item)}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                      
                    </Row>
                ))}
            </div>
        </div>
    )
}

export default SegmentationMetadata;
