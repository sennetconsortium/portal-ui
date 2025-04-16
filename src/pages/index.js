import dynamic from "next/dynamic";
import {useRouter} from 'next/router'
import {useContext, useEffect} from 'react'
import log from 'loglevel'
import {getCookie, setCookie} from 'cookies-next'
import AppContext from '@/context/AppContext'
import ViewLanding from "@/pages/landing";

const Unauthorized = dynamic(() => import("@/components/custom/layout/Unauthorized"))


export default function Home() {
    const router = useRouter()
    const {setIsBusy, login, isLoginPermitted} = useContext(AppContext)

    useEffect(() => {
        if (router.isReady) {
            let info = getCookie('info')
            if (info) {
                setIsBusy(true)
                info = atob(info)
                setCookie(
                    'groups_token',
                    JSON.parse(info).groups_token,
                    {sameSite: "Lax"},
                )

                log.debug(router.query)
                login()
            }
        }
    }, [router.isReady])

    if (!isLoginPermitted) {
        return <Unauthorized/>
    } else {
        return <ViewLanding />
    }
}
