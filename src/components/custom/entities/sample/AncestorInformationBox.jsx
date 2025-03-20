import React from 'react';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/CardGroup';
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import ClipboardCopy from "@/components/ClipboardCopy";
import {getUBKGFullName} from "@/components/custom/js/functions";

const AncestorInformationBox = ({ ancestor }) => {

        return (
            <SenNetAccordion className={'mb-3'} title={'Ancestor'}>
                <Card border={'0'} className={'pb-3'}>
                    <Card.Body>
                        <Card.Subtitle>
                            <a href={'/' + ancestor.entity_type.toLowerCase() + '?uuid=' + ancestor.uuid}
                               className="icon_inline mt-1">{ancestor.sennet_id}</a><ClipboardCopy text={ancestor.sennet_id} title={'Copy SenNet ID {text} to clipboard'} />
                        </Card.Subtitle>
                    </Card.Body>
                </Card>

                <CardGroup>
                    <Card border={'0'} className={'pb-3'}>
                        <Card.Body>
                            <Card.Subtitle>Ancestor Type</Card.Subtitle>
                            <Card.Text>{ancestor.entity_type}</Card.Text>
                        </Card.Body>
                    </Card>

                    {ancestor.lab_source_id &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Lab ID</Card.Subtitle>
                                <Card.Text>{ancestor.lab_source_id}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                    {ancestor.lab_tissue_sample_id &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Lab ID</Card.Subtitle>
                                <Card.Text>{ancestor.lab_tissue_sample_id}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                    {ancestor.source_type &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Source Type</Card.Subtitle>
                                <Card.Text>{ancestor.source_type}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                    {ancestor.sample_category &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Sample Category</Card.Subtitle>
                                <Card.Text>{ancestor.sample_category}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                    {ancestor.origin_samples &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Organ Type</Card.Subtitle>
                                <Card.Text>{getUBKGFullName(ancestor.origin_samples[0].organ_hierarchy)}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                    {ancestor.group_name &&
                        <Card border={'0'} className={'pb-3'}>
                            <Card.Body>
                                <Card.Subtitle>Group Name</Card.Subtitle>
                                <Card.Text>{ancestor.group_name}</Card.Text>
                            </Card.Body>
                        </Card>
                    }
                </CardGroup>
            </SenNetAccordion>
        )

}

export default AncestorInformationBox