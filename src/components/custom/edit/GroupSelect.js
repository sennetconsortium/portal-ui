import PropTypes from "prop-types"
import React, {useContext} from 'react';
import {Form} from 'react-bootstrap';
import SenNetPopover from "@/components/SenNetPopover";
import AppContext from "@/context/AppContext";

const GroupSelect = ({groups, onGroupSelectChange, entity_type, plural, popover, value, isDisabled,
                         title = 'Group', controlId='group_uuid', required = true, optionValueProp = 'uuid'}) => {
    const {cache} = useContext(AppContext)
    popover = popover || <>{`You are a member of more than one Globus group and need to pick a group to associate with ${plural ? 'these ' : 'this '}`}
        <code>{cache.entities[entity_type]}</code>.</>
    return (
        <>
            <Form.Group className="mb-3" controlId={controlId}>
                <Form.Label>{title}{required &&<span
                    className="required">*</span>}
                    <SenNetPopover className={'group_uuid'} text={popover}>
                        &nbsp;<i className="bi bi-question-circle-fill"></i>
                    </SenNetPopover>

                </Form.Label>

                <Form.Select disabled={isDisabled} required={required} aria-label="group-select"
                             onChange={e => onGroupSelectChange(e, e.target.id, e.target.value)}>
                    <option value="">----</option>
                    {
                        (groups.sortOnProperty('displayname')).map(group => {
                            return (
                                <option key={group.uuid} value={group[optionValueProp]} selected={value ? group[optionValueProp] === value : undefined }>
                                    {group.displayname}
                                </option>
                            )
                        })}
                </Form.Select>
            </Form.Group>
        </>
    );
};

GroupSelect.propTypes = {
  controlId: PropTypes.string,
  entity_type: PropTypes.string.isRequired,
  groups: PropTypes.array,
  isDisabled: PropTypes.bool,
  onGroupSelectChange: PropTypes.func,
  optionValueProp: PropTypes.string,
  plural: PropTypes.bool,
  popover: PropTypes.node,
  required: PropTypes.bool,
  title: PropTypes.string,
  value: PropTypes.any
}

export default GroupSelect;