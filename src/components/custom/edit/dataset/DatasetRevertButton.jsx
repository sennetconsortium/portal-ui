import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import AppModal from "../../../AppModal";
import {Button, Form, Badge} from 'react-bootstrap'
import {getStatusColor} from "../../js/functions";

export const supportedReverStatuses = () => {
    const statuses = ['New', 'Valid', 'Invalid', 'QA', 'Submitted', 'Incomplete']
    return {
        Upload: statuses,
        Dataset: statuses
    }
}

export const statusRevertTooltip = (entity) => {
    const statuses = supportedReverStatuses()[entity]
    const results = []
    for (let i = 0; i < statuses.length; i++) {
        const atEnd = i === statuses.length - 1
        const sep = atEnd ? '' : ', '
        const pre = atEnd ? 'or ' : ''
        results.push(<span key={`revert-status-${statuses[i]}`}>{pre}<span className={`${getStatusColor(statuses[i])} badge`}>{statuses[i]}</span>{sep}</span>)
    }

    return (<>Revert this <code>{entity}</code> back to {results} status.</>)
}

function DatasetRevertButton({disableSubmit, onClick, onStatusChange, data}) {
    const [show, setShow] = useState(false)
    useEffect(() => {
    }, [])

    const showModal = () => {
        setShow(true)
    }
    const hideModal = () => {
        setShow(false)
    }

    return (
        <>
            <Button className="me-2" variant="outline-primary rounded-0" disabled={disableSubmit}
                    onClick={showModal}>
                Revert
            </Button>

            <AppModal
                className={`modal--ctaConfirm`}
                showModal={show}
                modalTitle={`Select ${data.entity_type} Status`}
                modalBody={<div>
                    <Form.Group className="mb-3" controlId="status">
                        <Form.Label>Choose a status to revert this <code>{data.entity_type}</code> to, then click [Revert] to apply your changes.
                        </Form.Label>
                        <Form.Select required aria-label="status-select"
                                     onChange={e => onStatusChange(e, e.target.id, e.target.value)}>
                            <option value="">----</option>
                            {supportedReverStatuses()[data.entity_type].map((status) =>{
                                return <option key={status}>{status}</option>
                            })}
                        </Form.Select>
                    </Form.Group>
                  </div>}
                handleSecondaryBtn={
hideModal}
                handlePrimaryBtn={() => {
                    onClick()
                    hideModal()
                }}
                primaryBtnLabel={'Revert'}
                primaryBtnClassName={'js-btn--revert'}
                showSecondaryBtn={true}
                secondaryBtnLabel={
'Close'}
            />
        </>
    )
}

DatasetRevertButton.propTypes = {
    children: PropTypes.node
}

export default DatasetRevertButton