import {createContext, useCallback, useState} from "react";
import {ENTITIES} from "../config/constants";
import $ from "jquery";

const VisualizationContext = createContext({})

export const VisualizationProvider = ({ children }) => {
    
    //region Vitessce
    const [vitessceTheme, setVitessceTheme] = useState("light")
    const [vitessceConfig, setVitessceConfig] = useState(null)
    const [showCopiedToClipboard, setShowCopiedToClipboard] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showExitFullscreenMessage, setShowExitFullscreenMessage] = useState(null)
    const [isPrimaryDataset, setIsPrimaryDataset] = useState(false)

    const showVitessce = data_types => {
        const supportedVitessceDataTypes = ['snRNA-seq', 'scRNA-seq', 'CODEX']
        return supportedVitessceDataTypes.some(d => data_types.includes(d))
    }

    const expandVitessceToFullscreen = () => {
        document.addEventListener("keydown", collapseVitessceOnEsc, false);
        $('#sennet-vitessce-view-config').toggleClass('vitessce_fullscreen');
        setShowExitFullscreenMessage(true)
    }

    const collapseVitessceOnEsc = useCallback((event) => {
        if (event.key === "Escape") {
            $('#sennet-vitessce-view-config').toggleClass('vitessce_fullscreen');
            setIsFullscreen(false)
            setShowExitFullscreenMessage(false)
            document.removeEventListener("keydown", collapseVitessceOnEsc, false);
        }
    }, []);
    //endregion
    
    return <VisualizationContext.Provider value={{
        showVitessce,
        isPrimaryDataset,
        vitessceTheme,
        setVitessceTheme,
        vitessceConfig,
        setVitessceConfig,
        showCopiedToClipboard,
        setShowCopiedToClipboard,
        showExitFullscreenMessage,
        setShowExitFullscreenMessage,
        isFullscreen,
        setIsFullscreen,
        expandVitessceToFullscreen,
        setIsPrimaryDataset
    }}>
        { children }
    </VisualizationContext.Provider>
}

export default VisualizationContext