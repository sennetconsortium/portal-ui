import React, {useState} from 'react'
import PropTypes from 'prop-types'
import SenNetPopover, {SenPopoverOptions} from "./SenNetPopover";

function ClipboardCopy({children, text, title = 'Copy SenNet ID to clipboard', className = '', size= 12}) {

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text)
    }

    return (
        <SenNetPopover text={'Copied!'} trigger={SenPopoverOptions.triggers.click} className={`${className} popover-clipboard`}>
            <sup title={title.replace('{text}', text)} role={'button'} onClick={copyToClipboard}>
                {!children && <i className="bi bi-clipboard" style={{fontSize:size}}></i>}
                {children}
            </sup>
        </SenNetPopover>
    )
}

ClipboardCopy.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string.isRequired,
    title: PropTypes.string,
    className: PropTypes.string
}

export default ClipboardCopy