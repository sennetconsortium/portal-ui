import dynamic from "next/dynamic";
import {useContext, useEffect} from 'react'
import AppContext from '@/context/AppContext'
import {getLogoutURL} from '@/config/config'
import {deleteCookie} from "cookies-next";
import {REDIRECT_COOKIE_KEY} from "@/config/constants";

const Spinner = dynamic(() => import("@/components/custom/Spinner"))

function logout() {
    const {logout} = useContext(AppContext)
    useEffect(() => {
        logout()
        deleteCookie(REDIRECT_COOKIE_KEY)
        window.location = getLogoutURL()
    })
    return <Spinner text="Logging you out, please wait... "/>
}

export default logout
