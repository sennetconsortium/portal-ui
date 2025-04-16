import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import AppContext from "@/context/AppContext";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/custom/layout/Header"))

function ViewLanding({children}) {

    const {isRegisterHidden, _t, cache} = useContext(AppContext)

    useEffect(() => {
    }, [])

    return (
       <>
           <Header title={`Homepage | SenNet`}></Header>
           <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>
       </>
    )
}

ViewLanding.propTypes = {
    children: PropTypes.node
}

export default ViewLanding