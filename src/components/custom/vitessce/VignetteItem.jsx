import { getAssetsEndpoint, getAuth } from '@/config/config'
import useVitessceEncoder from '@/hooks/useVitessceEncoder'
import { getJSONFromAssetsEndpoint } from '@/lib/services'
import { Snackbar } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { useCallback, useEffect, useRef, useState } from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import SenNetAccordion from '../layout/SenNetAccordion'
import SuspendVitessce from './SuspendVitessce'

function VignetteItem({ publication, vignette }) {
    const accordionRef = useRef(null)
    const [hasLazyLoaded, setHasLazyLoaded] = useState(false)
    const [vitessceTheme, setVitessceTheme] = useState('light')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showCopiedToClipboard, setShowCopiedToClipboard] = useState(false)
    const [showExitFullscreenMessage, setShowExitFullscreenMessage] = useState(null)
    const [config, setConfig] = useState(null)
    const { encodeConfigToUrl, getUrlByLengthMaximums } = useVitessceEncoder({})

    useEffect(() => {
        const handleAccordionExpanded = () => {
            if (!hasLazyLoaded) {
                setHasLazyLoaded(true)
                const configPath = `${publication.uuid}/vignettes/${vignette.directory_name}/${vignette.figures[0].file}`
                getJSONFromAssetsEndpoint(configPath).then((config) => {
                    const assetsUrl = getAssetsEndpoint() + publication.uuid + '/data'
                    const token = getAuth()

                    for (const ds of config?.datasets || []) {
                        for (const file of ds.files || []) {
                            // Replace the {{ base_url }} placeholder with the actual assets URL
                            file.url = file.url.replace('{{ base_url }}', assetsUrl)

                            // Add the Authorization header to the requestInit object
                            if (token && !Object.hasOwnProperty(file, 'requestInit')) {
                                file.requestInit = {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            }
                        }
                    }

                    setConfig(config)
                })
            }
        }

        const accordion = accordionRef.current
        if (accordion) {
            accordion.addEventListener('shown.bs.collapse', handleAccordionExpanded)
        }

        return () => {
            if (accordion) {
                accordion.removeEventListener('shown.bs.collapse', handleAccordionExpanded)
            }
        }
    }, [])

    const formatDescription = (description) => {
        return description.replace(/^#*\s*/, '')
    }

    const expandVitessceToFullscreen = useCallback(() => {
        document.addEventListener('keydown', collapseVitessceOnEsc, false)
        $('.vitessce-container').toggleClass('vitessce_fullscreen')
        setShowExitFullscreenMessage(true)
    })

    const collapseVitessceOnEsc = useCallback((event) => {
        if (event.key === 'Escape') {
            $('.vitessce-container').toggleClass('vitessce_fullscreen')
            setIsFullscreen(false)
            setShowExitFullscreenMessage(false)
            document.removeEventListener('keydown', collapseVitessceOnEsc, false)
        }
    }, [])

    return (
        <SenNetAccordion
            id={`vignette-${vignette.id}`}
            title={`Vignette ${vignette.id}: ${vignette.name}`}
            expanded={false}
            className='accordion--vitessce accordion--vignette'
            ref={accordionRef}
        >
            <div className='row'>
                <div className='card-text'>{formatDescription(vignette.description)}</div>

                <div className='col p-2 mx-1 my-2'>
                    <span className='fw-light fs-6'>
                        {'Powered by '}
                        <a
                            className=''
                            target='_blank'
                            href='http://vitessce.io/'
                            rel='noopener noreferrer'
                            title={'Vitessce.io'}
                        >
                            Vitessce V3.4.9
                        </a>
                    </span>
                </div>

                <div className='col text-end p-2 m-2'>
                    {config && (
                        <OverlayTrigger
                            placement='top'
                            overlay={
                                <Tooltip id='share-tooltip'>
                                    {showCopiedToClipboard
                                        ? 'Shareable URL copied to clipboard!'
                                        : 'Share Visualization'}
                                </Tooltip>
                            }
                        >
                            <i
                                className='bi bi-share'
                                style={{ cursor: 'pointer' }}
                                color='royalblue'
                                size={24}
                                onMouseLeave={() => setShowCopiedToClipboard(false)}
                                onClick={() => {
                                    const params = encodeConfigToUrl(config)
                                    navigator.clipboard.writeText(getUrlByLengthMaximums(params))
                                    setShowCopiedToClipboard(true)
                                }}
                            />
                        </OverlayTrigger>
                    )}

                    {vitessceTheme === 'light' ? (
                        <>
                            <OverlayTrigger
                                placement='top'
                                overlay={<Tooltip id='light-theme-tooltip'>Switch to light theme</Tooltip>}
                            >
                                <i
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setVitessceTheme('light')}
                                    className='m-2 bi bi-sun-fill'
                                    color='royalblue'
                                    size={24}
                                    title='Light mode'
                                />
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement='top'
                                overlay={<Tooltip id='dark-theme-tooltip'>Switch to dark theme</Tooltip>}
                            >
                                <i
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setVitessceTheme('dark')}
                                    className='bi bi-moon m-2'
                                    color='royalblue'
                                    size={24}
                                    title='Dark mode'
                                />
                            </OverlayTrigger>
                        </>
                    ) : (
                        <>
                            <OverlayTrigger placement='top' overlay={<Tooltip>Switch to light theme</Tooltip>}>
                                <i
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setVitessceTheme('light')}
                                    className='bi bi-sun m-2'
                                    color='royalblue'
                                    size={24}
                                    title='Light mode'
                                />
                            </OverlayTrigger>
                            <OverlayTrigger placement='top' overlay={<Tooltip>Switch to dark theme</Tooltip>}>
                                <i
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setVitessceTheme('dark')}
                                    className='bi bi-moon-fill m-2'
                                    color='royalblue'
                                    size={24}
                                    title='Dark mode'
                                />
                            </OverlayTrigger>
                        </>
                    )}

                    <OverlayTrigger placement={'top'} overlay={<Tooltip>Enter fullscreen</Tooltip>}>
                        <i
                            className='bi bi-fullscreen m-2'
                            style={{ cursor: 'pointer' }}
                            color='royalblue'
                            size={24}
                            title='Fullscreen'
                            onClick={() => {
                                expandVitessceToFullscreen()
                                setIsFullscreen(true)
                            }}
                        />
                    </OverlayTrigger>
                </div>
            </div>

            <Snackbar
                open={showExitFullscreenMessage}
                autoHideDuration={8000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setShowExitFullscreenMessage(false)}
            >
                <MuiAlert onClose={() => setShowExitFullscreenMessage(false)} severity='info' sx={{ width: '100%' }}>
                    Press ESC to exit fullscreen
                </MuiAlert>
            </Snackbar>

            <SuspendVitessce
                vitessceConfig={config}
                vitessceTheme={vitessceTheme}
                isFullscreen={isFullscreen}
                className=''
            />
        </SenNetAccordion>
    )
}

export default VignetteItem
