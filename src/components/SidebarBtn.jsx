import React, {useContext, useEffect} from 'react'
import AppContext from "../context/AppContext";

function SidebarBtn({target='#sidebar', onClick, initialClass = ''}) {
    const {sidebarVisible, handleSidebar} = useContext(AppContext)

    const handleOnClick = (e) => {
        e.preventDefault()
        if (onClick) {
            onClick(e)
        } else {
            handleSidebar(e)
        }
    }

    useEffect(() => {
        $(target).addClass(`collapse collapse-horizontal ${initialClass}`)
    }, [target, initialClass])

    const isOpen = sidebarVisible || initialClass === 'show'

    return (
        <div className="d-none d-md-block sticky-top" id="sections-button">
            <span onClick={(e) => handleOnClick(e)} data-bs-target={target} aria-controls={target.substring(1)} data-bs-toggle="collapse" title={'Toggle menu sidebar'}
               className={`btn sidebar-drawer-btn ${isOpen ? 'is-open' : ''} icon-inline mb-2`}>
                {!isOpen && <i className="bi bi-chevron-right"></i>} {isOpen && <i className="bi bi-chevron-left"></i>}</span>
        </div>
    )
}

export default SidebarBtn