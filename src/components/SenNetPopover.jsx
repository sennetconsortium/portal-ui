import React, {useState} from 'react'
import PropTypes from 'prop-types'
import Tooltip from '@mui/material/Tooltip';
import Zoom from "@mui/material/Zoom";
import {
    eq,
} from '@/components/custom/js/functions'
import {ClickAwayListener} from "@mui/material";

export const SenPopoverOptions = {
    placement: {
      top: 'top',
      right: 'right',
      left: 'left',
      bottom: 'bottom'
    },
    triggers: {
        click: 'click',
        hover: 'hover',
        always: 'always',
    }

}


function SenNetPopover({children, text, placement = SenPopoverOptions.placement.top, className = 'sen-popover',
                           trigger = SenPopoverOptions.triggers.hover, show, onTooltipToggle}) {

    const [showTooltip, setShowTooltip] = useState(false)
    const triggerClassName = `${className}-pc`

    const handleTooltipClose = () => {
        setShowTooltip(false)
        if (onTooltipToggle) {
            onTooltipToggle(false)
        }
    };

    const handleTooltipOpen = (e) => {
        e.stopPropagation()
        if (onTooltipToggle) {
            onTooltipToggle(true)
        }
        setShowTooltip(true)
        setTimeout(()=>{
            setShowTooltip(false)
        }, 2000)
    }

    const isClickTrigger = eq(trigger, SenPopoverOptions.triggers.click)
    const isAlwaysTrigger = eq(trigger, SenPopoverOptions.triggers.always)

    const disableHover = isClickTrigger || isAlwaysTrigger ? true : undefined

    const popover = <Tooltip open={isAlwaysTrigger ? true : (isClickTrigger ? (show || showTooltip) : undefined)}
                                  onClose={isClickTrigger ? handleTooltipClose : undefined}
                                  classes={{ popper: 'snPopover' }}
                                  disableFocusListener={disableHover}
                                  disableHoverListener={disableHover}
                                  disableTouchListener={disableHover}
                                  placement={placement} title={text}
                                  arrow slots={{transition: Zoom}}>
            <span onClick={isClickTrigger ? (e) => handleTooltipOpen(e) : undefined} className={triggerClassName} style={{display: 'inline-block'}}>
                {children}
            </span>
    </Tooltip>

    if (disableHover) {
        return (
            <ClickAwayListener onClickAway={handleTooltipClose}>
                {popover}
            </ClickAwayListener>
        )
    }
    return popover
}

SenNetPopover.propTypes = {
    children: PropTypes.node,
    placement: PropTypes.string,
    className: PropTypes.string,
    trigger: PropTypes.any,
}

export default SenNetPopover
