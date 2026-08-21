import React, {useContext} from 'react'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Sankey from "@/components/custom/Sankey";
import {APP_TITLE} from "@/config/config";

function SankeyView({}) {
    const {isRegisterHidden} = useContext(AppContext)

    return (
        <>
            <Header title={`Data Sankey | ${APP_TITLE}`}></Header>

            <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

            <Sankey />
        </>
    )
}

export default SankeyView