import React, {useContext} from 'react'
import { Form } from 'react-bootstrap'
import PropTypes from 'prop-types'
import AppContext from '../../../../context/AppContext'
import SenNetPopover from "../../../SenNetPopover";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function EntityFormGroup({ controlId, label,  onChange, value, type = 'text', placeholder = '',
                             isRequired = false, pattern, popoverHelpText, popoverTrigger, className = ' ', popoverWarningText, onBlur, isDisabled, otherInputProps = {}  }) {

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
            {!children && !isTextarea && <Form.Control disabled={isDisabled} type={type}  defaultValue={value} placeholder={_t(placeholder)} required={isRequired}
                        pattern={pattern}
                        {...otherInputProps}
                        onBlur={onBlur ? (e => onBlur(e, e.target.id, e.target.value)) : undefined}
                        onChange={e => onChange(e, e.target.id, e.target.value)} /> }

            {!children && isTextarea && <Form.Control disabled={isDisabled} as={type} rows={4} defaultValue={value}
                                         required={isRequired}
                                         {...otherInputProps}
                        onBlur={onBlur ? (e => onBlur(e, e.target.id, e.target.value)) : undefined}
                        onChange={e => onChange(e, e.target.id, e.target.value)} /> }
            {children}
            {(className && className.indexOf('warning') !== -1) && <div className={'warning-icon-trigger'}>
                <SenNetPopover text={popoverWarningText} trigger={popoverTrigger} className={`popover-warning-${controlId}`}>
                    <span ><WarningAmberIcon sx={{color: '#ffc107'}} /></span></SenNetPopover>
            </div>}

        </Form.Group>
    </>
    
  )
}

EntityFormGroup.propTypes = {
    type: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    isRequired: PropTypes.bool,
    popoverTrigger: PropTypes.string,
    otherInputProps: PropTypes.object
}

export default EntityFormGroup