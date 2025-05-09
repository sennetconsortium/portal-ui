import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Sankey from "@/components/custom/Sankey";

function SankeyView({children}) {
    const {isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext);

    useEffect(() => {
    }, [])

    return (
        <>
            <Header title={`SenNet Data Sankey`}></Header>

            <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

            <Sankey />
        </>
    )
}



SankeyView.propTypes = {
    children: PropTypes.node
}

export default SankeyView