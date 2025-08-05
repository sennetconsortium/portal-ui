import React, {useContext} from 'react';
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/CardGroup';
import AppContext from '@/context/AppContext';
import {eq, getOrganMeta, getProtocolId, getUBKGFullName} from '@/components/custom/js/functions';
import SenNetPopover, {SenPopoverOptions} from '@/components/SenNetPopover';
import {APP_ROUTES} from '@/config/constants';

export default function Description({data, citationData, labId, primaryDateTitle, primaryDate, secondaryDateTitle, secondaryDate, title, showAuthors=false, showDatasetTypes=false, showOrgans=false}) {

    const {isLoggedIn, cache} = useContext(AppContext)

    const buildContacts = () => {
        let res = []
        for (let c of data?.contacts) {
            res.push(<li key={c.orcid_id}>{c.first_name} {c.last_name} &nbsp;
                <a href={`https://orcid.org/${c.orcid_id}`}
                   className={'lnk--ic pl-0'}>{c.orcid_id}
                <i className="bi bi-box-arrow-up-right"></i></a>
            </li>)
        }
        return res
    }

    const buildDatasetTypes = () => {
        let datasetTypes = new Set()
        for (let ancestor of data?.ancestors) {
            if (ancestor.entity_type === 'Dataset') {
                datasetTypes.add((ancestor.dataset_type))
            }
        }
        let res = []
        datasetTypes.forEach(datasetType => {
            res.push(<li key={datasetType}>{datasetType}</li>)
        })
        return res
    }

    const buildOrgans = () => {
        let organs = new Set()
        for (let origin_sample of data?.origin_samples) {
            organs.add(getUBKGFullName(origin_sample.organ))
        }
        let res = []
        organs.forEach(organ => {
            res.push(<li key={organ}>{organ}</li>)
        })
        return res
    }

    const _getOrganMeta = () => {
        return getOrganMeta(data.intended_organ)
    }

    const getOrganLinkOrSpan = () => {
        const organ = _getOrganMeta().organ
        const name = getUBKGFullName(data.intended_organ)
        if (organ) {
            return (
                <a className={'icon-inline'}
                   href={`${APP_ROUTES.organs}/${organ?.path}`}>{name}</a>
            )
        } else {
            return (
                <span className={'icon-inline'}>{name}</span>
            )
        }
    }

    const getCitationUrl = () => {
        if (data.publication_url) {
            return data.publication_url
        }
        return `https://commons.datacite.org/doi.org/${getProtocolId(data.doi_url)}`
    }

    return (
        <SenNetAccordion title={title || data?.title || 'Summary'} id={'Summary'}>

            {data && data?.description &&
                <Card border='0' className='pb-3'>
                    <Card.Body>
                        <Card.Subtitle>{(eq(data.entity_type, cache.entities.upload) || eq(data.entity_type, 'Collection')) ? 'Description' : 'Abstract'}</Card.Subtitle>
                        <Card.Text>{data.description}</Card.Text>
                    </Card.Body>
                </Card>
            }

            {isLoggedIn() && data && eq(data.entity_type, cache.entities.upload) &&
                <CardGroup>
                    <Card border='0' className='pb-3'>
                        <Card.Body>
                            <Card.Subtitle>Intended Source Type</Card.Subtitle>
                            <Card.Text>{data.intended_source_type}</Card.Text>
                        </Card.Body>
                    </Card>

                    <Card border='0' className='pb-3'>
                        <Card.Body>
                            <Card.Subtitle>Intended Organ</Card.Subtitle>
                            {data?.intended_organ &&
                                <span>{getOrganLinkOrSpan()}&nbsp;
                                    <img alt={getUBKGFullName(data.intended_organ)}
                                         src={_getOrganMeta().icon}
                                         width={'24px'}/>
                                </span>
                            }
                        </Card.Body>
                    </Card>

                    <Card border='0' className='pb-3'>
                        <Card.Body>
                            <Card.Subtitle>Intended Dataset Type</Card.Subtitle>
                            <Card.Text>{data.intended_dataset_type}</Card.Text>
                        </Card.Body>
                    </Card>
                </CardGroup>
            }

            {data && data?.publication_venue &&
                <Card border='0' className='mb-3'>
                    <Card.Body>
                        <Card.Subtitle>Manuscript &nbsp;
                            <SenNetPopover text={<>The <code>Publication</code> venue</>} className={`popover-publiction_venue`}>
                                <i className="bi bi-question-circle-fill"></i>
                            </SenNetPopover>
                        </Card.Subtitle>

                        <Card.Text className='mb-1'>
                            {data.publication_venue}
                        </Card.Text>

                        <Card.Text>
                            <a className='lnk--ic'
                               target="_blank"
                               href={data.publication_url}>
                               View Manuscript Page <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                        </Card.Text>
                    </Card.Body>
                </Card>
            }

            {data && (data?.doi_url || data?.publication_doi) && citationData &&
                <Card border='0' className='mb-3'>
                    <Card.Body>
                        <Card.Subtitle>Citation &nbsp;
                            <SenNetPopover text={<span>Citation is provided in AMA format.</span>}

                                           className={`popover-citation`}>
                                <i className="bi bi-question-circle-fill"></i>
                            </SenNetPopover>
                        </Card.Subtitle>

                        <Card.Text className='mb-1' dangerouslySetInnerHTML={{__html: citationData}}></Card.Text>

                        {(data?.doi_url || data?.publication_doi) && (
                            <Card.Text>
                                <a className='lnk--ic'
                                   target="_blank"
                                   href={getCitationUrl()}>
                                   View DataCite Page <i className="bi bi-box-arrow-up-right"></i>
                                </a>
                            </Card.Text>
                        )}
                    </Card.Body>
                </Card>
            }

            {data && showAuthors && data?.contacts &&
                <Card border='0' className='mb-3'>
                    <Card.Body>
                        <Card.Subtitle>Corresponding Authors &nbsp;
                            <SenNetPopover text={<>The author(s) responsible for handling all correspondence about this article. Contact this author for any inquiries about this publication.</>}
                                           className={`popover-contacts`}>
                                <i className="bi bi-question-circle-fill"></i>
                            </SenNetPopover>
                        </Card.Subtitle>
                        <ul className='mb-0'>
                            {buildContacts()}
                        </ul>
                    </Card.Body>
                </Card>
            }

            {data && showDatasetTypes && data?.ancestors &&
                <Card border='0' className='mb-3'>
                    <Card.Body>
                        <Card.Subtitle>Dataset Types</Card.Subtitle>
                        <ul className='mb-0'>
                            {buildDatasetTypes()}
                        </ul>
                    </Card.Body>
                </Card>
            }

            {data && showOrgans && data?.origin_samples &&
                <Card border='0' className='mb-3'>
                    <Card.Body>
                        <Card.Subtitle>Organs</Card.Subtitle>
                        <ul className='mb-0'>
                            {buildOrgans()}
                        </ul>
                    </Card.Body>
                </Card>
            }

            <CardGroup className='mb-3'>
                {isLoggedIn() && data && labId && !eq(data.entity_type, cache.entities.upload) &&
                    <Card border='0'>
                        <Card.Body>
                            <Card.Subtitle>Lab ID</Card.Subtitle>
                            <Card.Text>{labId}</Card.Text>
                        </Card.Body>
                    </Card>
                }

                {primaryDate &&
                    <Card border='0'>
                        <Card.Body>
                            <Card.Subtitle>{primaryDateTitle}</Card.Subtitle>
                            <Card.Text>
                                {new Intl.DateTimeFormat('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                }).format(primaryDate)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                }

                {secondaryDate &&
                    <Card border='0'>
                        <Card.Body>
                            <Card.Subtitle>{secondaryDateTitle}</Card.Subtitle>
                            <Card.Text>
                                {new Intl.DateTimeFormat('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                }).format(secondaryDate)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                }

                {/*An empty card to align things nicely*/}
                {data && eq(data.entity_type, cache.entities.upload) &&
                    <Card border='0'></Card>
                }
            </CardGroup>
        </SenNetAccordion>
    )
}
