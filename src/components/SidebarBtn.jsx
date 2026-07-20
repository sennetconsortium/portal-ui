import React, {useContext, useEffect, useState} from 'react'
import AppContext from "@/context/AppContext";
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';

function SidebarBtn({target = '#sidebar', onClick, tooltip, className = '', initialClass = ''}) {
    const {sidebarVisible, handleSidebar} = useContext(AppContext)
    const [isVisible, setIsVisible] = useState(initialClass === 'show')

    const handleOnClick = (e) => {
        e.preventDefault()
        setIsVisible(!isVisible)
        if (onClick) {
            onClick(e)
        } else {
            handleSidebar(e)
        }
    }

    useEffect(() => {
        $(target).addClass(`collapse collapse-horizontal ${initialClass}`)
    }, [target, initialClass])

    const isOpen = sidebarVisible || isVisible
    let st = null

    // Fix tooltip placement for MUI v7 when placement reaches the edge of the screen.
    const onOpenTooltip = (e) => {
        e.stopPropagation()

        clearTimeout(st)
        st = setTimeout(() => {
            const $target = document.querySelector('.MuiPopper-root')
            const classPrefix = 'MuiTooltip-tooltipPlacement'
            const position = $target?.getAttribute('data-popper-placement')
            if (!position) return
            const $tooltip = $target?.querySelector('.MuiTooltip-tooltip')
            $tooltip?.classList?.remove(
                `${classPrefix}Right`,
                `${classPrefix}Left`,
                `${classPrefix}Top`,
                `${classPrefix}Bottom`
            )
            $tooltip
                ?.classList?.add(`${classPrefix}${position.titleCase()}`)
        }, 100)
    }

    return (
        <div className={`d-none d-md-block sticky-top ${className}`} id="sidebar-toggle">
            <Tooltip
                title={<span>{`${isOpen ? 'Close' : 'Open'} sidebar.`}{tooltip}</span>}
                placement='right'
                classes={{popper: 'snPopover'}}
                arrow
                slots={{transition: Zoom}}
                onOpen={onOpenTooltip}
            >
            <span onClick={(e) => handleOnClick(e)} data-bs-target={target} aria-controls={target.substring(1)}
                  data-bs-toggle="collapse" title={'Toggle menu sidebar'}
                  className={`btn sidebar-drawer-btn ${isOpen ? 'is-open' : ''} icon-inline mb-2`}>
                {!isOpen && <i className="bi bi-chevron-right"></i>} {isOpen &&
                <i className="bi bi-chevron-left"></i>}</span>
            </Tooltip>
        </div>
    )
}

export default SidebarBtn