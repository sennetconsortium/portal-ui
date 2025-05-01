import {useEffect, useState} from 'react'
import {getJsonHeader} from "../lib/services";
import log from 'loglevel'

function useContent() {

    const [banners, setBanners] = useState({})

    const loadBanners = async () => {
        try {
            let res = await fetch(
                `content/banners/index.json`,
                getJsonHeader()
            )
            if (res.ok) {
                return await res.json()
            } else {
                log.debug(`%c No banners config file found.`, `background: #222; color: red`)
            }
        } catch (e) {
            log.debug('Error loading banner', e)
        }
        return {}
    }

    useEffect(() => {
        loadBanners().then((r) => setBanners(r))
    }, [])

    return {banners}
}



export default useContent
