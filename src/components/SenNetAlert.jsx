import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';

const SenNetAlert = ({
    className,
    variant = 'danger',
    icon = <i className='bi bi-shield-shaded'></i>,
    text
}) => {
    return (
        <Alert variant={variant}>
            <span className={className}>
                {icon} - {text}
            </span>
        </Alert>
    )
}

SenNetAlert.propTypes = {
    children: PropTypes.node,
    icon: PropTypes.node,
    variant: PropTypes.string,
    className: PropTypes.string,
    text: PropTypes.string
}

export default SenNetAlert
