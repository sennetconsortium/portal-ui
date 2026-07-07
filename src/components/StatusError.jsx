import React from 'react'
import PropTypes from 'prop-types'
import SenNetPopover from '@/components/SenNetPopover'
import {displayBodyHeader} from "@/components/custom/js/functions";

function StatusError({text, error = 'An error occurred', title = 'Copy error message to clipboard',}) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(error)
    }

    return (
        <SenNetPopover text={<code>{error.length > 250 ? `${error.substring(0, 250)}...` : error}</code>} placement={"bottom"}
                       className="error-popover">
            <span title={title.replace('{error}', error)} onClick={copyToClipboard}>
                {displayBodyHeader(text)}
            </span>
        </SenNetPopover>
    )
}

StatusError.propTypes = {
    text: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
    title: PropTypes.string,
}

export default StatusError