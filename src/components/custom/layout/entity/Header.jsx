import React, {useContext, useEffect, useState} from 'react'
import {Col, Container, Row} from 'react-bootstrap'
import AppContext from '../../../../context/AppContext'
import HipaaModal from "../../edit/sample/HipaaModal";
import {eq, getStatusColor, getStatusDefinition} from "../../js/functions";
import ClipboardCopy from "../../../ClipboardCopy";
import SenNetAlert from "../../../SenNetAlert";
import SenNetPopover from "../../../SenNetPopover";
import {fetchPipelineMessage} from "@/lib/services";


function EntityHeader({entity, data, isEditMode, values, showGroup = true, adminGroup}) {
    const {_t, getGroupName} = useContext(AppContext)
    const [pipelineMessage, setPipelineMessage] = useState(null)


    useEffect(() => {
        const fetchPipelineMessage = async () => {
            if ((data.status === 'Invalid' || data.status === 'Error') && [data.has_pipeline_message, data.has_validation_message].contains('true')) {
                await fetchPipelineMessage(data.uuid, data.entity_type).then((pipelineMessage) => {
                    setPipelineMessage(pipelineMessage);
                });
            }
        }

        fetchPipelineMessage().catch(console.error);
    }, []);


    return (
        <Container className="px-0" fluid={true}>
            <Row md={12}>
                <h4>{isEditMode ? 'Edit' : 'Register'} {entity} {values && values.status &&
                    <span className={`${getStatusColor(values.status)} badge`}><SenNetPopover placement={'bottom'}
                                                                                              text={getStatusDefinition(values.status)}
                                                                                              className={'status-info'}>{values.status}</SenNetPopover></span>}</h4>
            </Row>
            {adminGroup && pipelineMessage &&
                <SenNetAlert className={"h6 auto-scroll"} variant={'warning'}
                             text={<span style={{wordWrap: 'break-word'}}
                                         dangerouslySetInnerHTML={{__html: pipelineMessage}}/>}
                             icon={<i className="bi bi-exclamation-triangle-fill"></i>}
                />
            }
            {isEditMode &&
                <>
                    <Row>
                        <Col md={6}><h5>{_t('SenNet ID')}: {data.sennet_id}<ClipboardCopy text={data.sennet_id}/></h5>
                        </Col>
                        {showGroup && <Col md={6}><h5>{_t('Group')}: {getGroupName(data)}</h5></Col>}
                    </Row>
                    <Row>
                        <Col md={6}><h5>{_t('Entered By')}: {data.created_by_user_email}</h5></Col>
                        <Col md={6}><h5>{_t('Entry Date')}: {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }).format(data.created_timestamp)}</h5></Col>
                    </Row>
                </>
            }

            <HipaaModal/>

        </Container>
    )
}

export default EntityHeader