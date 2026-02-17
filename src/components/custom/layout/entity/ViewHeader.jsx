import React, {useContext} from 'react'
import AppContext from '../../../../context/AppContext'
import {Button, Stack} from 'react-bootstrap';
import {eq, getCreationActionRelationName} from "../../js/functions";
import PropTypes from 'prop-types'
import ClipboardCopy from "../../../ClipboardCopy";
import {ViewHeaderBadges} from "./ViewHeaderBadges";
import SenNetPopover from "../../../SenNetPopover";
import VersionDropdown from "./VersionDropdown";

const EntityViewHeaderButtons = ({entity, data, hasWritePrivilege}) => {
    const {_t, cache} = useContext(AppContext)
    return (
        <div>
            <Stack direction="horizontal" gap={1}>
                {hasWritePrivilege &&
                    <SenNetPopover className={"edit-entity"}
                                   text={<>Make modifications to this entity.</>}>
                        <Button aria-label={`Edit ${cache.entities[entity]}`} className="js-btn--edit"
                                href={`/edit/${entity}?uuid=${data.uuid}`}
                                variant="outline-primary rounded-0">{_t('Edit')}</Button>
                    </SenNetPopover>
                }{' '}
                <SenNetPopover className={"view-entity"}
                               text={<>View the full JSON document of this entity.</>}>
                    <Button target='_blank' aria-label={`View JSON of the ${cache.entities[entity]}`}
                            className='ms-2 js-btn--json'
                            href={`/api/json/${entity}?uuid=${data.uuid}`}
                            variant="outline-primary rounded-0"><i className="bi bi-filetype-json"></i></Button>
                </SenNetPopover>

                {eq(entity, cache.entities.dataset) && (eq(data.status, 'published') || eq(data.status, 'qa'))  &&
                    <VersionDropdown className='ms-2' data={data}/>
                }
            </Stack>

        </div>
    )
}

EntityViewHeaderButtons.propTypes = {
    entity: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    hasWritePrivilege: PropTypes.bool.isRequired
}

function EntityViewHeader({entity, data, hasWritePrivilege, uniqueHeader, uniqueHeaderUrl}) {
    const {_t, cache} = useContext(AppContext)

    return (
        <div style={{width: '100%'}}>

            <h4>{eq(entity, cache.entities.dataset) && <span>{getCreationActionRelationName(data.creation_action)}</span>} {!eq(entity, 'dataset') && entity.upperCaseFirst()}</h4>
            {!eq(entity, cache.entities.publication) && <h3>{data.sennet_id}
                <ClipboardCopy text={data.sennet_id}/>
            </h3>}
            {eq(entity, cache.entities.publication) && <h3>{data.title}
            </h3>}
            <div className="row mb-2">
                <div className="col-md-8 col-sm-12 entity-subtitle icon-inline">
                    <ViewHeaderBadges data={data} 
                                      uniqueHeader={uniqueHeader}
                                      uniqueHeaderUrl={uniqueHeaderUrl}
                                      hasWritePrivilege={hasWritePrivilege}/>
                </div>

                <div className="col-md-4 col-sm-12">
                    <div className="entity-subtitle icon-inline float-md-end">
                        <EntityViewHeaderButtons data={data} entity={entity} hasWritePrivilege={hasWritePrivilege}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

EntityViewHeader.propTypes = {
    entity: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    hasWritePrivilege: PropTypes.bool.isRequired,
    uniqueHeader: PropTypes.string,
    uniqueHeaderUrl: PropTypes.string,
}

export {EntityViewHeader, EntityViewHeaderButtons}
