import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';
import ClipboardCopy from "@/components/ClipboardCopy";
import {getEntityViewUrl} from "@/components/custom/js/functions";

function AssociatedEntity({ data, currentEntity, grammar = 'is contained in' }) {
    return (
        <SenNetAccordion id={`AssociatedEntity--${data.entity_type}`} title={`Associated ${data.entity_type}`}>
            <Card border='0'>
                <Card.Body>
                    <p className='fw-light fs-6'>This <code>{currentEntity}</code> {grammar} the <code>{data.entity_type}</code>&nbsp;
                        <a href={getEntityViewUrl(data.entity_type, data.uuid, {}, {})}>{data.sennet_id}</a><ClipboardCopy text={data.sennet_id}/>
                    </p>
                </Card.Body>
            </Card>
        </SenNetAccordion>
    )
}

export default AssociatedEntity
