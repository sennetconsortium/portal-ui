import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';
import ClipboardCopy from "@/components/ClipboardCopy";
import {getEntityViewUrl} from "@/components/custom/js/functions";

function Upload({ data }) {
    return (
        <SenNetAccordion id='Upload' title='Associated Upload'>
            <Card border='0'>
                <Card.Body>
                    <p className='fw-light fs-6'>This <code>Dataset</code> is contained in the data <code>Upload</code>&nbsp;
                        <a href={getEntityViewUrl('Upload', data.uuid, {}, {})}>{data.sennet_id}</a><ClipboardCopy text={data.sennet_id}/>
                    </p>
                </Card.Body>
            </Card>
        </SenNetAccordion>
    )
}

export default Upload
