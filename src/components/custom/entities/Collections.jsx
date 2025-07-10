import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';
import ClipboardCopy from "@/components/ClipboardCopy";
import {getEntityViewUrl} from "@/components/custom/js/functions";

function Collections({ entityType, data }) {
    const getTitleType = () => {
        return data.length > 1 ? 'Collections' : 'Collection';
    }

    const getCollectionsView = () => {
        return data?.map((collection) =>
            <span key={collection.uuid}>
                <a href={getEntityViewUrl('Collection', collection.uuid, {}, {})}>{collection.sennet_id}</a><ClipboardCopy text={collection.sennet_id}/>
                &nbsp;
            </span>
        );
    }

    return (
        <SenNetAccordion id='Collections' title='Associated Collections'>
            <Card border='0'>
                <Card.Body>
                    <p className='fw-light fs-6'>This <code>{entityType}</code> is contained in the <code>{getTitleType()}</code>&nbsp;
                        {getCollectionsView()}
                    </p>
                </Card.Body>
            </Card>
        </SenNetAccordion>
    )
}

export default Collections
