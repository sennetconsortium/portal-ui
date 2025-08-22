import React, {useContext, useState} from 'react';
import {Form} from 'react-bootstrap';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

import AncestorsTable from './AncestorsTable';
import $ from 'jquery'
import SenNetPopover from '@/components/SenNetPopover';
import AppContext from '@/context/AppContext';

import AncestorsModal from "@/components/custom/edit/dataset/AncestorsModal";

export default function AncestorIds({values, onChange, fetchAncestors, deleteAncestor, ancestors, otherWithAdd, onShowModal, formLabelPlural,
                                        formLabel = 'ancestor', controlId = 'direct_ancestor_uuids',  disableDelete, addButtonDisabled, data}) {
    const [showHideModal, setShowHideModal] = useState(false)


    const handleSearchFormSubmit = (event, onSubmit) => {
        onSubmit(event)
    }

    const showModal = () => {
        if (onShowModal) {
            onShowModal()
        }
        setShowHideModal(true)
    }

    const hideModal = () => {
        setShowHideModal(false)
    }

    // Handles when updates are made to `Ancestor ID` when the search feature is used
    const changeAncestor = async (e, ancestorId) => {
        let old_uuids = [];
        const $modalTable = $('.modal-content .rdt_Table')
        if (values[controlId] !== undefined) {
            old_uuids = [...values[controlId]]
        }
        if (old_uuids.indexOf(ancestorId) === -1) {
            old_uuids.push(ancestorId);
            onChange(e, controlId, old_uuids);
            fetchAncestors([ancestorId]);
            hideModal();
            $modalTable.removeAttr('data-tooltipText')
        } else {
            $modalTable.attr('data-tooltipText', `That ${formLabel} has already been selected.`)
        }
    }

    return (
        <>
            <Form.Label>{`${formLabelPlural ? formLabelPlural.upperCaseFirst() : `${formLabel.upperCaseFirst()}(s)`}`} <span
                className="required">* </span>
                <SenNetPopover className={controlId} text={<>
                    The SenNet ID(s) of ancestor samples or data from which this data was derived. At least one
                    ancestor is required, but multiple may be specified.
                </>}>
                    <i className="bi bi-question-circle-fill"></i>
                </SenNetPopover>
            </Form.Label>
            <Form.Group controlId="direct_ancestor_uuids">

                <Form.Control style={{display: 'none'}}
                              isInvalid={values[controlId] === undefined || values[controlId].length === 0}></Form.Control>
                <Form.Control.Feedback type="invalid">
                    Please add at least one {formLabel}
                </Form.Control.Feedback>
            </Form.Group>

            {/*Ancestor Information Box*/}
            {ancestors && ancestors.length !== 0 &&
                <AncestorsTable controlId={controlId} formLabel='SenNet' values={values} onChange={onChange}
                                ancestors={ancestors} deleteAncestor={deleteAncestor} disableDelete={disableDelete}/>
            }

            {/*Disable the button if the dataset is not 'primary'*/}
            <InputGroup className="mb-5 ancestor-ctas" id="direct_ancestor_uuid_button">
                <Button variant="outline-primary rounded-0 mt-1" onClick={showModal} aria-controls='js-modal' disabled={addButtonDisabled}>
                    Add another {formLabel} <i className="bi bi-plus-lg"></i>
                </Button>
                {otherWithAdd}
            </InputGroup>

            <AncestorsModal data={data} hideModal={hideModal} changeAncestor={changeAncestor} showHideModal={showHideModal} handleSearchFormSubmit={handleSearchFormSubmit} />
        </>
    )
}
