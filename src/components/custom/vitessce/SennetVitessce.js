import React, {useContext} from "react";
import DerivedContext from "@/context/DerivedContext";
import Link from "next/link";
import {Snackbar} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import MultiProfileSelector from "./MultiProfileSelector";
import SuspendVitessce from "./SuspendVitessce";
import {getDatasetTypeDisplay} from "@/components/custom/js/functions";

export const SennetVitessce = ({ title, id, expanded = true, className = '' }) => {
    const {
        vitessceTheme,
        setVitessceTheme,
        vitessceConfig,
        vitessceConfigFromUrl,
        showCopiedToClipboard,
        setShowCopiedToClipboard,
        showExitFullscreenMessage,
        setShowExitFullscreenMessage,
        isFullscreen,
        setIsFullscreen,
        expandVitessceToFullscreen,
        profileIndex,
        setProfileIndex,
        isPrimaryDataset,
        derivedDataset,
        vitessceParams,
        setVitessceConfigState,
        getUrlByLengthMaximums, encodeConfigToUrl
    } = useContext(DerivedContext)

    return (
        <SenNetAccordion title={title || 'Visualization'} id={id || 'Vitessce'} expanded={expanded} className={`accordion--vitessce ${className}`}>
            <div className={'row'}>
                <div className={'col p-2 m-2'}>
                    <span className={'fw-light fs-6'}>Powered by
                        <a className={'ms-2'} target="_blank" href="http://vitessce.io/" rel="noopener noreferrer"
                           title={'Vitessce.io'}>
                            Vitessce V3.5.7
                        </a>
                    </span>
                </div>
                <div className={'col p-2 m-2'}>
                    {isPrimaryDataset && derivedDataset &&
                        <span className={'fw-light fs-6 m-2 p-2'}>
                            From descendant {getDatasetTypeDisplay(derivedDataset)}
                            <Link target="_blank" href={{pathname: '/dataset', query: {uuid: derivedDataset.uuid}}}>
                                <span className={'ms-2 me-2'}>{derivedDataset.sennet_id}</span>
                            </Link>
                        </span>
                    }
                </div>
                <div className={'col text-end p-2 m-2'}>
                    <OverlayTrigger
                        placement={'top'}
                        overlay={
                            <Tooltip id={'share-tooltip'}>
                                {showCopiedToClipboard ? 'Shareable URL copied to clipboard!' : 'Share Visualization'}
                            </Tooltip>
                        }>
                        <i className={'bi bi-share'} style={{cursor: 'pointer'}} color="royalblue" size={24}
                           onClick={() => {
                               const params = encodeConfigToUrl(vitessceParams.current)
                               navigator.clipboard.writeText(getUrlByLengthMaximums(params))
                               setShowCopiedToClipboard(true)
                           }} onMouseLeave={() => setShowCopiedToClipboard(false)}/>
                    </OverlayTrigger>
                    {
                        vitessceTheme === 'light' ?
                            <>
                                <OverlayTrigger placement={'top'}
                                                overlay={<Tooltip id={'light-theme-tooltip'}>Switch to light
                                                    theme</Tooltip>}>
                                    <i style={{cursor: 'pointer'}} onClick={() => setVitessceTheme('light')}
                                       className={'m-2 bi bi-sun-fill'} color="royalblue" size={24}
                                       title="Light mode"/>
                                </OverlayTrigger>
                                <OverlayTrigger placement={'top'}
                                                overlay={<Tooltip id={'dark-theme-tooltip'}>Switch to dark
                                                    theme</Tooltip>}>
                                    <i style={{cursor: 'pointer'}} onClick={() => setVitessceTheme('dark')}
                                       className={'bi bi-moon m-2'} color="royalblue" size={24} title="Dark mode"/>
                                </OverlayTrigger>
                            </>
                            :
                            <>
                                <OverlayTrigger placement={'top'}
                                                overlay={<Tooltip>Switch to light theme</Tooltip>}>
                                    <i style={{cursor: 'pointer'}} onClick={() => setVitessceTheme('light')}
                                       className={'bi bi-sun m-2'} color="royalblue" size={24} title="Light mode"/>
                                </OverlayTrigger>
                                <OverlayTrigger placement={'top'} overlay={<Tooltip>Switch to dark theme</Tooltip>}>
                                    <i style={{cursor: 'pointer'}} onClick={() => setVitessceTheme('dark')}
                                       className={'bi bi-moon-fill m-2'} color="royalblue" size={24}
                                       title="Dark mode"/>
                                </OverlayTrigger>
                            </>

                    }
                    <OverlayTrigger placement={'top'} overlay={<Tooltip>Enter fullscreen</Tooltip>}>
                        <i className="bi bi-fullscreen m-2" style={{cursor: 'pointer'}} color="royalblue" size={24}
                           title="Fullscreen" onClick={() => {
                            expandVitessceToFullscreen()
                            setIsFullscreen(true)
                        }
                        }/>
                    </OverlayTrigger>
                </div>

                {vitessceConfig && Array.isArray(vitessceConfig) &&
                    <MultiProfileSelector
                        vitessceConfig={vitessceConfig}
                        profileIndex={profileIndex}
                        setProfileIndex={setProfileIndex} />
                }

            </div>
            <Snackbar open={showExitFullscreenMessage} autoHideDuration={8000}
                      anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                      onClose={() => setShowExitFullscreenMessage(false)}>
                <MuiAlert onClose={() => setShowExitFullscreenMessage(false)} severity="info" sx={{width: '100%'}}>
                    Press ESC to exit fullscreen
                </MuiAlert>
            </Snackbar>

            <SuspendVitessce
                vitessceConfigFromUrl={vitessceConfigFromUrl}
                vitessceConfig={vitessceConfig}
                profileIndex={profileIndex}
                setVitessceConfigState={setVitessceConfigState}
                vitessceTheme={vitessceTheme}
                isFullscreen={isFullscreen} />

        </SenNetAccordion>
    )
}

export default SennetVitessce
