import React, {useState} from "react";
import Modal from 'react-bootstrap/Modal';
import {Button} from 'react-bootstrap';
import SenNetAlert from '../../../SenNetAlert';


const HipaaModal = ({}) => {
    const [showModal, setShowModal] = useState(false)

    const displayModal = () => {
        setShowModal(true)
    }

    const hideModal = () => {
        setShowModal(false)

    }


        return (
            <>
                <SenNetAlert className="hipaa-alert"
                             text=<>Do not provide any Protected Health Information. This includes the <span className="lnk" onClick={displayModal}>
                                      18 identifiers specified by HIPAA</span>
                                  </> />

                <Modal size="xl" show={showModal} keyboard={false}>
                    <Modal.Body>
                        <ol>
                            <li>Names.</li>
                            <li>All geographic subdivisions smaller than a state, including street address, city,
                                county,
                                precinct, ZIP Code, and their equivalent geographical codes, except for the initial
                                three
                                digits of a ZIP Code if, according to the current publicly available data from the
                                Bureau of
                                the Census:
                                <ol type="a">
                                    <li>The geographic unit formed by combining all ZIP Codes with the same three
                                        initial
                                        digits contains more than 20,000 people.
                                    </li>
                                    <li>The initial three digits of a ZIP Code for all such geographic units containing
                                        20,000 or fewer people are changed to 000.
                                    </li>
                                </ol>
                            </li>
                            <li>All elements of dates (except year) for dates directly related to an individual,
                                including
                                birth date, admission date, discharge date, date of death; and all ages over 89 and all
                                elements of dates (including year) indicative of such age, except that such ages and
                                elements may be aggregated into a single category of age 90 or older.
                            </li>
                            <li>Telephone numbers.</li>
                            <li>Facsimile numbers.</li>
                            <li>Electronic mail addresses.</li>
                            <li>Social security numbers.</li>
                            <li>Medical record numbers.</li>
                            <li>Health plan beneficiary numbers.</li>
                            <li>Account numbers.</li>
                            <li>Certificate/license numbers.</li>
                            <li>Vehicle identifiers and serial numbers, including license plate numbers.</li>
                            <li>Device identifiers and serial numbers.</li>
                            <li>Web universal resource locators (URLs).</li>
                            <li>Internet protocol (IP) address numbers.</li>
                            <li>Biometric identifiers, including fingerprints and voiceprints.</li>
                            <li>Full-face photographic images and any comparable images.</li>
                            <li>Any other unique identifying number, characteristic, or code, unless otherwise permitted
                                by
                                the Privacy Rule for re-identification.
                            </li>
                        </ol>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary rounded-0" onClick={hideModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        )
}

export default HipaaModal
