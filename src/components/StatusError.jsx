import React from 'react'
import PropTypes from 'prop-types'
import SenNetPopover, {SenPopoverOptions} from "./SenNetPopover";
import {displayBodyHeader} from "./custom/js/functions";

function StatusError({text, error, title, className, size = 12}) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(error)
    }

    return (
        <SenNetPopover text={<code>{error}</code>} placement={"bottom"}
                       className="error-popover">
            <span title={title.replace('{error}', error)} onClick={copyToClipboard}>
                {displayBodyHeader(text)}
            </span>
        </SenNetPopover>
    )
}

StatusError.defaultProps = {
    className: '',
    title: 'Copy error message to clipboard'
}

StatusError.propTypes = {
    text: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
    title: PropTypes.string,
    className: PropTypes.string
}

export default StatusError