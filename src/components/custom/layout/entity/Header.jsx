import React, { useContext } from 'react'
import {Col, Container, Row, Badge} from 'react-bootstrap'
import AppContext from '../../../../context/AppContext'
import HipaaModal from "../../edit/sample/HipaaModal";
import {eq, getStatusColor, getStatusDefinition} from "../../js/functions";
import ClipboardCopy from "../../../ClipboardCopy";
import SenNetAlert from "../../../SenNetAlert";
import SenNetPopover from "../../../SenNetPopover";
import EntityContext from "../../../../context/EntityContext";


function EntityHeader({entity, data, isEditMode, values, showGroup = true, adminGroup}) {
  const { _t, getGroupName } = useContext(AppContext)
  return (
    <Container className="px-0" fluid={true}>
        <Row md={12}>
            <h4>{isEditMode ? 'Edit' : 'Register'} {entity} {values && values.status && <span className={`${getStatusColor(values.status)} badge`}><SenNetPopover placement={'bottom'} text={getStatusDefinition(values.status)} className={'status-info'}>{values.status}</SenNetPopover></span>}</h4>
        </Row>
        {adminGroup && (data.pipeline_message || data.validation_message) && (eq(data['status'], 'Error') || eq(data['status'], 'Invalid')) &&
            <SenNetAlert className={"h6"} variant={'warning'}
                         text={data.pipeline_message ? (
                             <span style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{__html: data.pipeline_message}}/>) : (
                             <span style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{__html: data.validation_message}}/>)}
                         icon={<i className="bi bi-exclamation-triangle-fill"></i>}
            />
        }
        {isEditMode &&
            <>
                <Row>
                    <Col md={6}><h5>{_t('SenNet ID')}: {data.sennet_id}<ClipboardCopy text={data.sennet_id} /></h5></Col>
                    {showGroup && <Col md={6}><h5>{_t('Group')}: {getGroupName(data)}</h5></Col> }
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