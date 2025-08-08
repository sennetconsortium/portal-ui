import dynamic from "next/dynamic";
import React, {useContext} from "react"
import {APP_TITLE} from "@/config/config"
import AppContext from "@/context/AppContext"

import Container from "react-bootstrap/Container"
import DataTable from "react-data-table-component";

const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

function ViewCompare() {
    const {logout, isRegisterHidden, isAuthorizing, isUnauthorized, hasAuthenticationCookie} = useContext(AppContext)

    const columns = [
        {

        }
    ]

    if (isAuthorizing()) {
        return <Spinner/>
    } else {
        if (isUnauthorized() && hasAuthenticationCookie()) {
            // This is a scenario in which the GLOBUS token is expired but the token still exists in the user's cookies
            logout()
            window.location.reload()
        }
        return (
            <>
                <Header title={APP_TITLE}/>
                <AppNavbar hidden={isRegisterHidden}/>
                <Container className="mb-5 d-block">
                    {/*<DataTable  columns={} data={} />*/}
                </Container>
            </>
        )
    }
}

export default ViewCompare
