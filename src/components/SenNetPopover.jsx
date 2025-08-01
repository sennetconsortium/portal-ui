import React, {useState} from 'react'
import PropTypes from 'prop-types'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
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
        hover: 'hover'
    }

}

const LightTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.white,
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: theme.shadows[1],
        fontSize: 11,
    },
}));


function SenNetPopover({children, text, placement = SenPopoverOptions.placement.top, className = 'sen-popover', trigger = SenPopoverOptions.triggers.hover, show}) {

    const [showTooltip, setShowTooltip] = useState(false)
    const triggerClassName = `${className}-pc`

    const handleTooltipClose = () => {
        setShowTooltip(false)
    };

    const handleTooltipOpen = () => {
        setShowTooltip(true)
        setTimeout(()=>{
            setShowTooltip(false)
        }, 2000)
    }

    const disableHover = eq(trigger, SenPopoverOptions.triggers.click) ? true : undefined

    const popover = <LightTooltip open={eq(trigger, SenPopoverOptions.triggers.click) ? (show || showTooltip) : undefined}
                                  onClose={eq(trigger, SenPopoverOptions.triggers.click) ? handleTooltipClose : undefined}
                                  className={'snPopover'}
                                  disableFocusListener={disableHover}
                                  disableHoverListener={disableHover}
                                  disableTouchListener={disableHover}
                                  placement={placement} title={text}
                                  arrow slots={{
        transition: Zoom,
    }}>
            <span onClick={eq(trigger, SenPopoverOptions.triggers.click) ? handleTooltipOpen : undefined} className={triggerClassName} style={{display: 'inline-block'}}>
                {children}
            </span>
    </LightTooltip>

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
