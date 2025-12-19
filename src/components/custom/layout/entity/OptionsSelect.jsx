import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import SenNetPopover from "@/components/SenNetPopover";
import {Form} from 'react-bootstrap'

/**
 *

 * @param {node | string} popover
 * @param {string} controlId Name of option element
 * @param {boolean} isRequired Whether the select is required
 * @param {boolean} isDisabled Whether the select is disabled
 * @param {string} label The label for the group
 * @param {function} onChange A callback when the select is changed
 * @param {array} data A list od objects to build the select options
 * @param {string} value A value to select by default
 * @param {node} view A custom view
 * @param {string} propLabel The name of the property to use as option label
 * @param {string} propVal The name of the property to use as option value
 * @param {string} className A css class name to apply to the group container
 * */
function OptionsSelect({popover, controlId, isRequired, isDisabled, label, onChange, data, value, view, propLabel='label', propVal='value', className = ''}) {
    useEffect(() => {
    }, [])

    const getGroupedList = () => {
        let result = []

        for (let item in data) {
            let options = []
            for (let opt of data[item][propVal]) {
                options.push(<option key={opt} value={`${item}:${opt}`}>{opt}</option>)
            }
            result.push(<optgroup key={item} label={item}>
                {options}
            </optgroup>)
        }

        return result;
    }

    return (
        <>
            <Form.Group className={`mb-3 ${className}`} controlId={controlId}>
                <Form.Label>{label}{isRequired &&<span
                    className="required">*</span>}
                    <SenNetPopover className={'group_uuid'} text={popover}>
                        &nbsp;<i className="bi bi-question-circle-fill"></i>
                    </SenNetPopover>

                </Form.Label>

                {!view && <Form.Select disabled={isDisabled} required={isRequired} aria-label={controlId}
                             onChange={e => onChange(e, e.target.id, e.target.value)}>
                    <option value="">----</option>
                    {!Array.isArray(data) && getGroupedList()}
                    {Array.isArray(data) &&
                        (data.sortOnProperty(propLabel)).map(item => {
                            return (
                                <option key={item[propVal]} value={item[propVal]} selected={value ? item[propVal] === value : undefined }>
                                    {item[propLabel]}
                                </option>
                            )
                        })}
                    
                </Form.Select>}
                {view}
            </Form.Group>
        </>
    )
}

OptionsSelect.propTypes = {
    children: PropTypes.node
}

export default OptionsSelect