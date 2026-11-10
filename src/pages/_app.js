import {useRouter} from 'next/router'
import {getCookie} from 'cookies-next'
import 'bootstrap/dist/css/bootstrap.css'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import '../public/css/main.css'
import log from 'xac-loglevel'
import ErrorBoundary from '@/components/custom/error/ErrorBoundary'
import React, {useEffect, useState} from 'react'
import {getLogLevel} from '@/config/config'
import useGoogleTagManager from '@/hooks/useGoogleTagManager'
import addons from "@/components/custom/js/addons/addons"
import {AppProvider} from '@/context/AppContext'
import useContent from "@/hooks/useContent";
import IdleTimerPopup from "@/components/IdleTimerPopup";
import useScrollToAnchor from "@/hooks/useScrollToAnchor";

import {loadUBKGCache} from '@/lib/cache'

function MyApp({Component, pageProps}) {
    const router = useRouter()

    const [cache, setCache] = useState(null)

    const {banners} = useContent()

    useGoogleTagManager()
    useScrollToAnchor()

    useEffect(() => {
        let mounted = true

        const init = async () => {
            try {
                const cacheData = await loadUBKGCache()

                if (!mounted) {
                    return
                }

                setCache(cacheData)

                const user = getCookie('user')

                addons('init', {
                    data: {user},
                    router,
                    entities: cacheData.entities
                })
            } catch (error) {
                console.error(error)
            }
        }

        init()

        return () => {
            mounted = false
        }
    }, [router])

    log.setLevel(getLogLevel())

    const withWrapper = Component.withWrapper || ((page) => page)

    return (
        <ErrorBoundary>
            <AppProvider
                cache={cache}
                banners={banners}
            >
                {withWrapper(
                    <Component {...pageProps} />
                )}

                <IdleTimerPopup/>
            </AppProvider>
        </ErrorBoundary>
    )
}

export default MyApp
