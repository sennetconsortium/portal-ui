import { useContext, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import AppContext from '../context/AppContext'
import PropTypes from "prop-types"

/**
 *
 * @param children
 * @param {boolean} showModal Whether to show the modal
 * @param {node | string} modalTitle
 * @param {node | string} modalBody
 * @param {string} modalSize A modal size to apply according to React boostrap available sizes [xl, lg, sm]
 * @param {string} id A css id name to apply to the modal container; Default is 'js-modal'
 * @param {string} className A css class name to apply to the modal container
 * @param {function} handlePrimaryBtn A callback on click of the primary (right), blue colored button
 * @param {boolean} showPrimaryBtn Whether to show the primary (right), blue colored button
 * @param {string} primaryBtnClassName An additional css class name to apply to the primary (right), blue colored button; Default is ''
 * @param {string} primaryBtnLabel The text of the primary (right), blue colored button; Default is 'Home page'
 * @param {function} handleSecondaryBtn A callback on click of the secondary (left), grey colored button
 * @param {boolean} showSecondaryBtn Whether to show the secondary (left), grey colored button
 * @param {string} secondaryBtnLabel The text of the secondary (left), grey colored button; Default is 'Close'
 * @param {string} secondaryBtnClassName An additional css class name to apply to the secondary (left), grey colored button; Default is ''
 * @returns {JSX.Element}
 * @constructor
 */
const AppModal = ({ children, showModal = false, modalTitle, modalBody, modalSize, id = 'js-modal', className,
                      handlePrimaryBtn, showPrimaryBtn = true, primaryBtnClassName = '', primaryBtnLabel = 'Home page',
                      handleSecondaryBtn,  showSecondaryBtn = true, secondaryBtnLabel = 'Close', secondaryBtnClassName = ''}) => {
    const [size, setSize] = useState(modalSize)
    const {_t} = useContext(AppContext)
    return (
        <section data-js-ada='modal' id={id}>
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