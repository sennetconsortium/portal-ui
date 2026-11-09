import 'bootstrap/dist/css/bootstrap.css'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import '../public/css/main.css'
import log from 'xac-loglevel'
import ErrorBoundary from '@/components/custom/error/ErrorBoundary'
import React, {useEffect} from 'react'
import {getLogLevel} from '@/config/config'
import useGoogleTagManager from '@/hooks/useGoogleTagManager'
import {AppProvider} from '@/context/AppContext'
import useContent from "@/hooks/useContent";
import IdleTimerPopup from "@/components/IdleTimerPopup";
import useScrollToAnchor from "@/hooks/useScrollToAnchor";

function MyApp({Component, pageProps}) {
    const {banners} = useContent()
    useGoogleTagManager()

    useEffect(() => {
        useScrollToAnchor()
    }, [])

    log.setLevel(getLogLevel())

    const withWrapper = Component.withWrapper || ((page) => page)

    return (
        <ErrorBoundary>
            <AppProvider banners={banners}>
                {withWrapper(<Component {...pageProps} />)}
                <IdleTimerPopup/>
            </AppProvider>
        </ErrorBoundary>
    )
}

export default MyApp
