import React, {useContext} from 'react'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Sankey from "@/components/custom/Sankey";

function SankeyView({}) {
    const {isRegisterHidden} = useContext(AppContext)

    return (
        <>
            <Header title={`SenNet Data Sankey`}></Header>

            <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

            <Sankey />
        </>
    )
}

export default SankeyView