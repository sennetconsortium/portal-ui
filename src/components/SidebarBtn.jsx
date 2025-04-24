import React, {useContext} from 'react'
import AppContext from "../context/AppContext";

function SidebarBtn() {
    const {sidebarVisible, handleSidebar} = useContext(AppContext)

    return (
        <div className="d-none d-md-block sticky-top" id="sections-button">
            <a href="#" onClick={handleSidebar} data-bs-target="#sidebar" data-bs-toggle="collapse" title={'Toggle menu sidebar'}
               className={`btn sidebar-drawer-btn ${sidebarVisible ? 'is-open' : ''} icon-inline mb-2`}>
                {!sidebarVisible && <i className="bi bi-chevron-right"></i>} {sidebarVisible && <i className="bi bi-chevron-left"></i>}</a>
        </div>
    )
}

export default SidebarBtn