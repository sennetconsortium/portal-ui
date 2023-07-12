import React, {useState} from "react";
import {Button, Modal} from 'react-bootstrap';
import log from 'loglevel'
import SenNetPopover, {SenPopoverOptions} from "../../../../SenNetPopover";

const RUIModal = ({hide, show, tissueBlockSpatialData}) => {
    const [showTooltip, setShowTooltip] = useState(false)

   const copyToClipboard = () => {
        navigator.clipboard.writeText(ruiLocation)
        setShowTooltip(true)
        let st
        clearTimeout(st)
        st = setTimeout(()=>{
            setShowTooltip(false)
        }, 2000)
    }

    let ruiLocation
    if (typeof tissueBlockSpatialData === 'string' || tissueBlockSpatialData instanceof String) {
        ruiLocation = tissueBlockSpatialData
    } else {
        ruiLocation = JSON.stringify(tissueBlockSpatialData, null, 2)
    }
    return (
        <Modal
            show={show}
            onHide={hide}
            animation={false}
            size={'xl'}
        >
            <Modal.Header closeButton>
                <Modal.Title>CCF-RUI Location Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <pre>
                    {JSON.stringify(JSON.parse(ruiLocation), null, 2)}
                </pre>
            </Modal.Body>
            <Modal.Footer>
                <SenNetPopover text={'Copied!'} show={showTooltip} trigger={SenPopoverOptions.triggers.click}
                               className={`popover-clipboard`}>
                    <Button variant={'outline-primary'} className={'rounded-0'} onClick={copyToClipboard}>Copy</Button>
                </SenNetPopover>
                <Button variant={'outline-secondary'} className={'rounded-0'} onClick={hide}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default RUIModal;