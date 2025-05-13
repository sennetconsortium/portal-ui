import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import SenNetPopover from "../../../SenNetPopover";
import {Form} from 'react-bootstrap'

function OptionsSelect({popover, controlId, isRequired, isDisabled, label, onChange, data, propLabel='label', propVal='value', value}) {
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
            <Form.Group className="mb-3" controlId={controlId}>
                <Form.Label>{label}{isRequired &&<span
                    className="required">*</span>}
                    <SenNetPopover className={'group_uuid'} text={popover}>
                        &nbsp;<i className="bi bi-question-circle-fill"></i>
                    </SenNetPopover>

                </Form.Label>

                <Form.Select disabled={isDisabled} required={isRequired} aria-label={controlId}
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
                </Form.Select>
            </Form.Group>
        </>
    )
}

OptionsSelect.propTypes = {
    children: PropTypes.node
}

export default OptionsSelect