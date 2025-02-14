import {createContext, useCallback, useRef, useState} from "react";
import $ from "jquery";
import {datasetIs, fetchEntity, getRequestHeaders} from "@/components/custom/js/functions";
import {fetchVitessceConfiguration, get_prov_info} from "@/lib/services";
import useVitessceEncoder from "@/hooks/useVitessceEncoder";

const DerivedContext = createContext({})

export const DerivedProvider = ({children, showVitessceList, setShowVitessceList}) => {

    //region Vitessce
    const [vitessceTheme, setVitessceTheme] = useState("light")
    const [vitessceConfig, setVitessceConfig] = useState(null)
    const [showCopiedToClipboard, setShowCopiedToClipboard] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [profileIndex, setProfileIndex] = useState(0)
    const [showExitFullscreenMessage, setShowExitFullscreenMessage] = useState(null)
    const [isPrimaryDataset, setIsPrimaryDataset] = useState(false)
    const [derivedDataset, setDerivedDataset] = useState(null)
    const [showVitessce, setShowVitessce] = useState(false)
    const {vitessceConfigFromUrl, encodeConfigToUrl, getUrlByLengthMaximums} = useVitessceEncoder({})
    const vitessceParams = useRef(null)
    const [dataProducts, setDataProducts] = useState(null)

    // Load the correct Vitessce view config
    const set_vitessce_config = async (data, dataset_id, dataset_type) => {
        fetchVitessceConfiguration(dataset_id).then(config => {
            // If the /vitessce endpoint returns anything but a 200 and an actual configuration, hide the visualization  section
            if (JSON.stringify(config) === '{}' ) {
                setShowVitessce(false)
                if (setShowVitessceList && showVitessceList === 1) {
                    setShowVitessceList(false)
                }
            } else {
                setVitessceConfig(config)
                setShowVitessce(true)
            }
        }).catch(error => {
            console.error(error)
            if (setShowVitessceList && showVitessceList === 1) {
                setShowVitessceList(false)
            }
            setShowVitessce(false)
        })
    }

    const initVitessceConfig = useCallback(async (data) => {
        // Remove anything in brackets from dataset_type (might need to update this for visium to include parenthesis)
        const dataset_type = data.dataset_type = data.dataset_type.replace(/\s+([\[]).*?([\]])/g, "")

        // Set if primary based on the data_category: primary, component, codcc-processed, lab-processed
        const is_primary_dataset = data.dataset_category === 'primary' || datasetIs.primary(data.creation_action)
        setIsPrimaryDataset(is_primary_dataset)

        // Determine whether to show the Vitessce visualizations and where to pull data from
        //Check that this dataset has a valid status and has descendants or if we know this isn't a primary dataset
        if (isDatasetStatusPassed(data) && ((is_primary_dataset && data.descendants.length !== 0) || !is_primary_dataset) && data.dataset_category !== 'component') {
            // Add a check if this is a component dataset
            if (!is_primary_dataset) {
                await set_vitessce_config(data, data.uuid, dataset_type)
            } else {
                //Call `/prov-info` and check if processed datasets are returned
                const prov_info = await get_prov_info(data.uuid)
                if (prov_info !== {}) {
                    const processed_datasets = prov_info['processed_dataset_uuid']
                    const processed_dataset_statuses = prov_info['processed_dataset_status']
                    // Iterate over processed datasets and check that the status is valid
                    for (let i = 0; i < processed_dataset_statuses?.length; i++) {
                        if (isDatasetStatusPassed(processed_dataset_statuses[i])) {
                            fetchEntity(processed_datasets[i]).then(processed_dataset => {
                                // Check that the assay type is supported by Vitessce
                                let processed_dataset_type = processed_dataset.dataset_type?.replace(/\s+([\[]).*?([\]])/g, "")
                                setDerivedDataset(processed_dataset)
                                set_vitessce_config(processed_dataset, processed_dataset.uuid, processed_dataset_type)
                            })
                            break;
                        }
                    }
                }
            }
        }
    })

    const isDatasetStatusPassed = data => {
        if (data.hasOwnProperty('status')) {
            return data.status === "QA" || data.status === 'Published'
        } else {
            return data === "QA" || data === 'Published'
        }
    }

    const expandVitessceToFullscreen = useCallback(() => {
        document.addEventListener("keydown", collapseVitessceOnEsc, false);
        $('.vitessce-container').toggleClass('vitessce_fullscreen');
        setShowExitFullscreenMessage(true)
    })

    const collapseVitessceOnEsc = useCallback((event) => {
        if (event.key === "Escape") {
            $('.vitessce-container').toggleClass('vitessce_fullscreen');
            setIsFullscreen(false)
            setShowExitFullscreenMessage(false)
            document.removeEventListener("keydown", collapseVitessceOnEsc, false);
        }
    }, []);
    //endregion

    const setVitessceConfigState = useCallback((val) => {
        vitessceParams.current = val
        setShowVitessce(true)
    })

    const getAssaySplitData = useCallback((data) => {
        let component = []
        let primary = []
        let processed = []
        let mergedData = data.ancestors.concat(data.descendants)
        mergedData.push(data)
        for (let entity of mergedData) {
            if (datasetIs.component(entity.creation_action || '')) {
                component.push(entity)
            }
            if (datasetIs.processed(entity.creation_action || '')) {
                processed.push(entity)
            }
            if (datasetIs.primary(entity.creation_action || '')) {
                primary.push(entity)
            }
        }
        return {component, primary, processed}
    })

    const filterFilesForDataProducts = (allFiles, parent) => {
        if (!allFiles) return
        let _files = []
        for (let file of allFiles) {
            if (file?.is_data_product) {
                _files.push({...file, uuid: parent.uuid, sennet_id: parent.sennet_id})
            }
        }
        return _files
    }
    const fetchDataProducts = useCallback(async (data) => {
        let _files = []
        if (datasetIs.primary(data.creation_action)) {
            for (let entity of data.descendants) {
                if (datasetIs.processed(entity.creation_action)) {
                    const response = await fetch("/api/find?uuid=" + entity.uuid, getRequestHeaders())
                    const processed = await response.json()
                    if (processed.files && processed.files.length) {
                        let dataProducts = filterFilesForDataProducts(processed.files, processed)
                        _files = _files.concat(dataProducts)
                    }
                }
            }
            setDataProducts(_files)
        } else {
            _files = data?.files || []
            setDataProducts(filterFilesForDataProducts(_files, data))

        }
    })

    return <DerivedContext.Provider value={{
        initVitessceConfig,
        showVitessce,
        isPrimaryDataset,
        derivedDataset,
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
        profileIndex,
        setProfileIndex,
        vitessceConfigFromUrl,
        vitessceParams,
        getAssaySplitData,
        setVitessceConfigState,
        getUrlByLengthMaximums,
        encodeConfigToUrl,
        fetchDataProducts,
        dataProducts
    }}>
        {children}
    </DerivedContext.Provider>
}

export default DerivedContext
