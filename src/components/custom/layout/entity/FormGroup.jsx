import React, {useContext} from 'react'
import { Form } from 'react-bootstrap'
import PropTypes from 'prop-types'
import AppContext from '../../../../context/AppContext'
import SenNetPopover from "../../../SenNetPopover";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/**
 *
 * @param {node} children Alternative children to apply, like a custom field
 * @param {string} controlId The id of the input field
 * @param {string} label The label for the field
 * @param {function} onChange The function to call when the field value changes
 * @param {string} value A value to set on the field
 * @param {boolean} isDisabled Whether the field is disabled
 * @param {boolean} isRequired Whether the field is required
 * @param {string} type The type of field, default is text
 * @param {string} className The class name to apply on the form group container
 * @param {node | string} popoverHelpText A text to show on hover over the help icon
 * @param {node | string} popoverWarningText A text to show on hover over the warning icon
 * @param {string} popoverTrigger The way in which the popover is triggered; Default is hover
 * @param {object} otherInputProps - Any additional input props
 * @returns {Element}
 * @constructor
 */
function EntityFormGroup({children, controlId, label, onChange, value, isDisabled, isRequired = false,
                             type = 'text', className = '',
                             popoverHelpText, popoverWarningText, popoverTrigger, otherInputProps = {}  }) {

  const {_t } = useContext(AppContext)
  const isTextarea = (type === 'textarea')

  return (
    <>
    
        <Form.Group className={`mb-3 form-group ${className}`} controlId={controlId}>
            <Form.Label>{_t(label)} {isRequired && <span className="required">* </span>}
                <SenNetPopover text={popoverHelpText} trigger={popoverTrigger} className={`popover-${controlId}`}>
                    <i className="bi bi-question-circle-fill"></i>
                </SenNetPopover>
            </Form.Label>

            {!children && !isTextarea && <Form.Control disabled={isDisabled} type={type} defaultValue={value} required={isRequired}
                        {...otherInputProps}
                        onChange={e => onChange(e, e.target.id, e.target.value)} /> }

            {!children && isTextarea && <Form.Control disabled={isDisabled} as={type} rows={4} defaultValue={value} required={isRequired}
                        {...otherInputProps}
                        onChange={e => onChange(e, e.target.id, e.target.value)} /> }
            {children}
            {(className && className.contains('warning')) && <div className={'warning-icon-trigger'}>
                <SenNetPopover text={popoverWarningText} trigger={popoverTrigger} className={`popover-warning-${controlId}`}>
                    <span ><WarningAmberIcon sx={{color: '#ffc107'}} /></span>
                </SenNetPopover>
            </div>}

        </Form.Group>
    </>
    
  )
}

EntityFormGroup.propTypes = {
    children: PropTypes.node,
    controlId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    isDisabled: PropTypes.bool,
    isRequired: PropTypes.bool,
    type: PropTypes.string,
    className: PropTypes.string,
    popoverHelpText: PropTypes.any,
    popoverWarningText: PropTypes.any,
    popoverTrigger: PropTypes.string,
    otherInputProps: PropTypes.object
}

export default EntityFormGroup