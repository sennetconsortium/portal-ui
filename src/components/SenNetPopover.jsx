import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import $ from "jquery";
import {OverlayTrigger, Popover} from 'react-bootstrap';

export const SenPopoverOptions = {
    placement: {
      top: 'top',
      right: 'right',
      left: 'left',
      bottom: 'bottom'
    },
    triggers: {
        hover: ['hover', 'focus'],
        click: 'click',
        hoverOnClickOff: 'hover-on-click-off'
    }

}

export const domMutation = (callback, sel = 'body') => {
    let observer = new MutationObserver(callback);
    observer.observe($(sel)[0], {
        childList: true})
}

export const handlePopoverDisplay = (className, stateCallback) => {
    const callback = (mutations) => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (!$(node).hasClass(className)) {
                    stateCallback(false)
                }
            }
        }
    }
    domMutation(callback)
}

function SenNetPopover({children, text, placement = SenPopoverOptions.placement.top, className = 'sen-popover', trigger = SenPopoverOptions.triggers.hoverOnClickOff, show}) {

    const [showTooltip, setShowTooltip] = useState(undefined)
    const containerClassName = `${className}`
    const triggerClassName = `${className}-pc`

    const isHoverOnClickOff = () => {
        if  (trigger === SenPopoverOptions.triggers.hoverOnClickOff) {
            return true
        } else {
            return undefined
        }
    }

    useEffect(() => {
        if (isHoverOnClickOff()) {
            setShowTooltip(false)
            let canLeave = true

            $(`body`).on('click', (e)=> {
                canLeave = true
                if (!$(e.target).parents('.popover').length) {
                    setShowTooltip(false)
                } else{
                    canLeave = false
                }
            })

            let st

            $(`.${triggerClassName}`).on('mouseover', (e)=>{
                setShowTooltip(true)
            }).on('click', (e)=>{
                setShowTooltip(!showTooltip)
            }).on('mouseleave', (e) =>{
                clearTimeout(st)
                st = setTimeout(()=>{
                    if (canLeave) {
                        setShowTooltip(false)
                    }
                }, 2000)
            })

            handlePopoverDisplay(containerClassName, setShowTooltip)
        }

    }, [])

    return (
        <OverlayTrigger show={show || showTooltip} trigger={trigger} placement={placement} overlay={
            <Popover className={containerClassName}>
                <Popover.Body>
                    {text}
                </Popover.Body>
            </Popover>
        }>
            <span className={triggerClassName} style={{display: 'inline-block'}}>
                {children}
            </span>
        </OverlayTrigger>
    )
}

SenNetPopover.propTypes = {
    children: PropTypes.node,
    placement: PropTypes.string,
    className: PropTypes.string,
    trigger: PropTypes.any,
}

export default SenNetPopover
