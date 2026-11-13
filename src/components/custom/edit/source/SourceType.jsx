import React, {useContext, useEffect} from 'react'
import {Form} from 'react-bootstrap';
import SenNetPopover from '../../../SenNetPopover'
import AppContext from '../../../../context/AppContext'
import PropTypes from "prop-types";

function SourceType({data, dataValue, onChange, label, labelDescription, values, isDisabled}) {
    const {cache} = useContext(AppContext)

    useEffect(() => {
    }, [])

    return (
        //Source Type
        <>
            <Form.Group className="mb-3" controlId={dataValue ? dataValue : "source_type"}>
                <Form.Label>{label ? label : `Source Type`}<span
                    className="required">* </span>
                    <SenNetPopover className={dataValue ? dataValue : 'source_type'}
                                   text={labelDescription ? labelDescription : <>
                                       The type of this <code>Source</code>. Choose from one of the available
                                       options.<br/>
                                       <small className='popover-note text-muted'>Note: CCF Registration User Interface
                                           (CCF-RUI) tool is only available for <code>Human</code> types.</small>
                                   </>}>
                        <i className="bi bi-question-circle-fill"></i>
                    </SenNetPopover>
                </Form.Label>

                <Form.Select required aria-label={label ? label : `Source Type`} disabled={isDisabled}
                             onChange={e => {
                                 onChange(e, dataValue ? dataValue : 'source_type', e.target.value)
                             }}
                             value={
                                 dataValue
                                     ? (values?.[dataValue] ?? '')
                                     : (values?.source_type ?? '')
                             }>
                    <option value="">----</option>
                    {Object.entries(cache?.sourceTypes || {}).map(op => {
                        return (
                            <option key={op[0]} value={op[0]}>
                                {op[1]}
                            </option>
                        );

                    })}
                </Form.Select>
            </Form.Group>
        </>
    )
}

SourceType.propTypes = {
    data: PropTypes.object,
    label: PropTypes.string,
    labelDescription: PropTypes.string,
    dataValue: PropTypes.string,
    onChange: PropTypes.func,
    values: PropTypes.object,
    isDisabled: PropTypes.bool
}

export default SourceType