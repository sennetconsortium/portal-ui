import React, {useEffect, useState} from "react";
import Modal from 'react-bootstrap/Modal';
import {Button} from 'react-bootstrap';
import {eq} from "@/components/custom/js/functions";
import {getCookie, setCookie} from "cookies-next";


const DataUsageModal = ({data, filepath}) => {
    const [showModal, setShowModal] = useState(false)
    const [checked, setChecked] = useState(false)
    const [hasAgreedDUA, setHasAgreedDUA] = useState(false)
    const [DUACookie, setDUACookie] = useState(null)

    const hasAgreedToConsortiumDUA = eq(getCookie('has_agreed_to_Consortium_DUA'), 'true')
    const hasAgreedToProtectedDUA = eq(getCookie('has_agreed_to_Protected_DUA'), 'true')
    const hasAgreedToPublicDUA = eq(getCookie('has_agreed_to_Public_DUA'), 'true')

    const displayModal = () => {
        setChecked(false)
        setShowModal(true)
    }

    const hideModal = () => {
        setShowModal(false)

    }

    const handleClick = () => setChecked(!checked)

    const userAgreed = () => {
        setCookie(DUACookie, true, {sameSite: "Lax"})
        hideModal()
        window.open(filepath, "_blank")
    }

    useEffect(() => {
        if (data && data.data_access_level) {
            switch (data.data_access_level) {
                case 'consortium':
                    setDUACookie('has_agreed_to_Consortium_DUA')
                    if (hasAgreedToConsortiumDUA) {
                        setHasAgreedDUA(true)
                    }
                    break;
                case 'protected':
                    setDUACookie('has_agreed_to_Protected_DUA')
                    if (hasAgreedToProtectedDUA) {
                        setHasAgreedDUA(true)
                    }
                    break;
                case 'public':
                    setDUACookie('has_agreed_to_Public_DUA')
                    if (hasAgreedToPublicDUA) {
                        setHasAgreedDUA(true)
                    }
                    break;
            }
        }
    }, [data])


    return (
        <>
            <p className={'fw-light fs-6 mb-2'}>Files for this <code>{data.entity_type}</code> are available through the
                Globus Research Data Management System.
                Access <a
                    onClick={() => hasAgreedDUA ? window.open(filepath, '_blank') : displayModal}
                    className="icon_inline link"><span
                    className="me-1">{data.sennet_id} Globus</span> <i className="bi bi-box-arrow-up-right"></i></a>
            </p>
            <Modal size="lg" show={showModal} keyboard={false}>
                <Modal.Header>
                    <h2>SenNet Public Data Usage</h2>
                </Modal.Header>
                <Modal.Body>
                    <h3>
                        Appropriate Use
                    </h3>
                    <div>
                        By downloading SenNet raw or processed data and using this data alone or combined with any other
                        information, you affirm you will abide by rules set by the SenNet Data Sharing Policy; including
                        not re-identifying or contacting sample donors or their families and maintaining confidentiality
                        of SenNet participant data.
                    </div>
                    <br></br>

                    <h3>
                        Acknowledgement
                    </h3>
                    <div>
                        Investigators using SenNet data in publications or presentations are requested to cite The Human
                        Body at Cellular Resolution: the NIH Human BioMolecular Atlas Program
                        (doi:10.1038/s41586-019-1629-x) and to include an acknowledgement of SenNet. Suggested language
                        for such an acknowledgment is: “The results here are in whole or part based upon data generated
                        by the NIH Human BioMolecular Atlas Program (SenNet): <a
                        href={"https://sennetconsortium.org/"}>https://SenNetconsortium.org/</a> .”
                    </div>
                    <br></br>

                    <h3>
                        Data Sharing Policy
                    </h3>
                    <div>
                        The SenNet Data Sharing Policy can be found at <a
                        href={"https://sennetconsortium.org/policies/"}>https://sennetconsortium.org/policies/</a> .
                    </div>
                    <br></br>

                    <div className={"form-check"}>
                        <label className={"for-check-label"}>
                            <input
                                id={"data-usage-checkbox"}
                                className={"form-check-input"}
                                type='checkbox'
                                onClick={handleClick}
                                checked={checked}
                            />
                            I have read and agree to the above data use guidelines.</label>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger rounded-0" onClick={hideModal}>
                        Disagree
                    </Button>
                    <Button variant="outline-success rounded-0" onClick={userAgreed} disabled={!checked}>
                        Agree
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default DataUsageModal
