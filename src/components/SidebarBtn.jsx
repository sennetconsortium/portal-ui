import React, {useContext, useEffect, useState} from 'react'
import AppContext from "@/context/AppContext";
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';

function SidebarBtn({target='#sidebar', onClick, initialClass = ''}) {
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

    return (
        <div className="d-none d-md-block sticky-top" id="sections-button">
            <Tooltip
                title={`${isOpen ? 'Close' : 'Open'} sidebar.`}
                placement='right'
                classes={{ popper: 'snPopover' }}
                arrow
                slots={{ transition: Zoom }}
            >
            <span onClick={(e) => handleOnClick(e)} data-bs-target={target} aria-controls={target.substring(1)} data-bs-toggle="collapse" title={'Toggle menu sidebar'}
               className={`btn sidebar-drawer-btn ${isOpen ? 'is-open' : ''} icon-inline mb-2`}>
                {!isOpen && <i className="bi bi-chevron-right"></i>} {isOpen && <i className="bi bi-chevron-left"></i>}</span>
            </Tooltip>
        </div>
    )
}

export default SidebarBtn