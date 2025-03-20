import { useContext, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import AppContext from '../context/AppContext'
import PropTypes from "prop-types"

const AppModal = ({showModal = false, modalTitle, modalBody, handleSecondaryBtn, handlePrimaryBtn, showSecondaryBtn, secondaryBtnLabel = 'Close',
                      showPrimaryBtn = true, children, modalSize, className, primaryBtnClassName = '', primaryBtnLabel = 'Home page', secondaryBtnClassName = ''}) => {
    const [size, setSize] = useState(modalSize)
    const {_t} = useContext(AppContext)
    return (
        <section data-js-ada='modal' id='js-modal'>
            <Modal
                className={className}
                    show={showModal}
                    size={size}
                    backdrop="static"
                    centered>
                <Modal.Header>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalBody && <div key="modal-body">{modalBody}</div> }
                    {children}
                </Modal.Body>
                {(showSecondaryBtn || showPrimaryBtn) && <Modal.Footer>
                    {showSecondaryBtn &&
                        <Button variant="outline-secondary rounded-0" className={secondaryBtnClassName}  onClick={handleSecondaryBtn}>
                            {_t(secondaryBtnLabel)}
                        </Button>
                    }
                    {showPrimaryBtn &&
                        <Button variant="outline-primary rounded-0" className={primaryBtnClassName} onClick={handlePrimaryBtn}>
                            {_t(primaryBtnLabel)}
                        </Button>
                    }
                </Modal.Footer>}
            </Modal>
        </section>
    );
};

AppModal.propTypes = {
    showModal: PropTypes.bool,
    showPrimaryBtn: PropTypes.bool,
    secondaryBtnLabel: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string
}

export default AppModal;