import "@elastic/react-search-ui-views/lib/styles/styles.css";
import 'bootstrap/dist/css/bootstrap.css';
import '@/public/css/main.css'
import log from 'loglevel'
import ErrorBoundary from '@/components/custom/error/ErrorBoundary'
import React, {useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import {getCookie} from 'cookies-next'
import { getLogLevel} from '@/config/config'
import useGoogleTagManager from '@/hooks/useGoogleTagManager'
import addons from "@/components/custom/js/addons/addons"
import {AppProvider} from '@/context/AppContext'
import useCache from "@/hooks/useCache";
import Spinner from "@/components/custom/Spinner";
import useContent from "@/hooks/useContent";
import IdleTimerPopup from "@/components/IdleTimerPopup";
import useScrollToAnchor from "@/hooks/useScrollToAnchor";

function MyApp({Component, pageProps}) {
    const router = useRouter()
    const [cache, setCache] = useState(null)
    const caching = useCache()
    const {banners} = useContent()
    useGoogleTagManager()

    useEffect(() => {
        const user = getCookie('user')

        caching.fetchData().then((response) => {
            addons('init', {data: {user}, router, entities: response.cache.entities})
            setCache(response.cache)
        }).catch((error) => console.error(error))
        useScrollToAnchor()
    }, [])

    log.setLevel(getLogLevel())

    const withWrapper = Component.withWrapper || ((page) => page)
    if (!cache) {
        return <Spinner/>
    } else {
        return (
            <ErrorBoundary>
                <AppProvider cache={cache} banners={banners} >
                    {withWrapper(<Component {...pageProps} />)}
                    <IdleTimerPopup />
                </AppProvider>
            </ErrorBoundary>
        )
    }
}

export default MyApp
