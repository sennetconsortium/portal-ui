import React, {useState} from "react";
import {Button} from 'react-bootstrap';
import AppModal from "../../../AppModal";

const DatasetSubmissionButton = ({onClick, btnLabel, actionBtnClassName, modalBody, modalTitle, disableSubmit}) => {
    const [showModal, setShowModal] = useState(false)


    const displayModal = () => {
        setShowModal(true)
    }

    const hideModal = () => {
        setShowModal(false)
    }


        return (
            <>
                <Button className="me-2" variant="outline-primary rounded-0" disabled={disableSubmit}
                        onClick={displayModal}>
                    {btnLabel}
                </Button>

                <AppModal
                    className={`modal--ctaConfirm`}
                    showModal={showModal}
                    modalTitle={`Confirm ${modalTitle || 'Submission'}`}
                    modalBody={modalBody}
                    handleSecondaryBtn={
hideModal}
                    handlePrimaryBtn={() => {
                        onClick()
                        hideModal()
                    }}
                    primaryBtnLabel={btnLabel}
                    primaryBtnClassName={actionBtnClassName || 'js-btn--submit'}
                />
            </>
        )

}

export default DatasetSubmissionButton