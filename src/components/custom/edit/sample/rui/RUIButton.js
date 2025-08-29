import React, {useState, useContext} from 'react';
import RUIModal from "./RUIModal";
import {Button, Form, OverlayTrigger, Popover} from 'react-bootstrap';
import AppContext from "../../../../../context/AppContext";

const RuiButton = ({showRegisterLocationButton, ruiLocation, setShowRui, ruiSex, setRuiSex}) => {
    const {cache } = useContext(AppContext)

    const [showRuiLocationModal, setShowRuiLocationModal] = useState(false)

    const handleRegisterLocationClick = () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        setShowRui(true)
    }

    return (
        <>
            {/*  RUI Tissue Block Registration  */}
            {
                (showRegisterLocationButton || ruiLocation) &&
                <>
                <Form.Label column sm="2">Sample location<span>{' '}</span>
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Popover>
                                <Popover.Body>
                                    Provide location information of the tissue sample.
                                </Popover.Body>
                            </Popover>}
                    >
                        <i className="bi bi-question-circle-fill"></i>
                    </OverlayTrigger>
                    {
                        ruiLocation &&
                        <>
                            <span>{' '}</span>
                            <i className={'bi bi-check2-circle'} style={{color:'green'}}/>
                        </>
                    }


                </Form.Label>
                <div className="mb-2 text-muted">
                CCF Registration User Interface (CCF-RUI) tool is only available for <code>{cache.sourceTypes.Human}</code> and <code>{cache.sourceTypes['Human Organoid']}</code> <em>Ancestor</em> source types and sample category <code>{cache.sampleCategories.Block}</code>.
                </div>
                </>
            }
            <div>
                {
                    showRegisterLocationButton &&
                    <>
                        {ruiSex !== undefined ? (
                            <Button variant={'outline-primary'}
                                    className={'rounded-0 mb-2'}
                                    onClick={handleRegisterLocationClick}>
                                {ruiLocation ? "Edit" : "Register"} Location
                            </Button>
                        ) : (
                            <>
                                <Button variant={'outline-primary'}
                                        className={'rounded-0 mb-2'}
                                        onClick={() => {
                                            setRuiSex('Male');
                                            handleRegisterLocationClick()
                                        }}>
                                    Register location (Male Source)
                                </Button>
                                <Button variant={'outline-primary'}
                                className={'rounded-0 mb-2 ms-2'}
                                        onClick={() => {
                                            setRuiSex('Female');
                                            handleRegisterLocationClick()
                                        }}>
                                    Register location (Female Source)
                                </Button>
                            </>
                        )
                    }
                    </>
                }
                {
                    ruiLocation &&
                    <>
                        <Button id={'view-rui-json-btn'}
                                variant={'outline-success'}
                                className={'rounded-0 mb-2 ms-2'}
                                onClick={() => setShowRuiLocationModal(true)}>
                            View JSON
                        </Button>
                        <RUIModal
                            tissueBlockSpatialData={ruiLocation}
                            show={showRuiLocationModal}
                            hide={() => setShowRuiLocationModal(false)}
                        />
                    </>
                }
            </div>
        </>
    );
};

export default RuiButton;
