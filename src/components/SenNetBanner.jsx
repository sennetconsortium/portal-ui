import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {STORAGE_KEY} from "@/config/config"
import {Alert} from 'react-bootstrap'
import AppContext from "../context/AppContext";
import $ from 'jquery';

function SenNetBanner({name = 'login'}) {
    const {banners} = useContext(AppContext)
    const [banner, setBanner] = useState(null)
    const [showBanner, setShowBanner] = useState(true)
    const [dismissed, setDismissed] = useState(false)
    const STORE_KEY = STORAGE_KEY(`banner.${name}.dismissed`)

    const handleCloseBanner = () => {
        if (banner?.dismissible) {
            setShowBanner(false)
            if (banner.keepDismissed) {
                localStorage.setItem(STORE_KEY, true)
            }
        }
    }

    useEffect(() => {
        let _banner = banners[name] || banners.default
        _banner = $.extend((banners.default || {}), _banner)
        setBanner(_banner)
        if (_banner?.keepDismissed && localStorage.getItem(STORE_KEY)) {
            setDismissed(true)
        }
    }, [banners])

    return (
        <>
            {banner && !dismissed && (banner?.content?.length > 0) && <div className={`c-SenNetBanner ${banner.sectionClassName || 'sui-layout-body'}`} role='section' aria-label={banner.ariaLabel}>
                {banner.beforeBanner && <div className={banner.beforeBannerClassName || ''} dangerouslySetInnerHTML={{__html: banner.beforeBanner}}></div>}
                <div className={banner.outerWrapperClassName || ''}>
                    <Alert variant={banner.theme || 'warning'} show={showBanner} onClose={handleCloseBanner} dismissible={banner.dismissible} className={banner.className}>
                        <div className={`${banner.innerClassName} d-flex align-items-center`}>
                            {banner.title && <Alert.Heading><span
                                dangerouslySetInnerHTML={{__html: banner.title}}></span></Alert.Heading>}
                            <i className={`bi ${banner.icon || 'bi-exclamation-triangle-fill'} me-3`}></i>
                            <div dangerouslySetInnerHTML={{__html: banner.content}}></div>
                        </div>
                    </Alert>
                </div>
                {banner.afterBanner && <div className={banner.afterBannerClassName || ''}  dangerouslySetInnerHTML={{__html: banner.afterBanner}}></div>}
            </div>}
        </>
    )
}

SenNetBanner.propTypes = {
    name: PropTypes.string.isRequired
}

export default SenNetBanner