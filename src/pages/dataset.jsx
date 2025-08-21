import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {
    getDatasetTypeDisplay,
    datasetIs,
    fetchDataCite,
    getCreationActionRelationName,
    getEntityViewUrl,
    getRequestHeaders, eq
} from "@/components/custom/js/functions";
import {
    getWritePrivilegeForGroupUuid,
    getAncestryData,
    getEntityData
} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import DerivedContext, {DerivedProvider} from "@/context/DerivedContext";
import WarningIcon from '@mui/icons-material/Warning'
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import Upload from "@/components/custom/entities/dataset/Upload";
import Collections from "@/components/custom/entities/Collections";
import FilesDataProducts from "@/components/custom/entities/dataset/FilesDataProducts";
import BulkDataTransfer from "@/components/custom/entities/dataset/BulkDataTransfer";
import {toast} from "react-toastify";
import SenNetSuspense from "@/components/SenNetSuspense";
import {ShimmerText, ShimmerThumbnail} from "react-shimmer-effects";
import ProtocolsWorkflow from "@/components/custom/entities/dataset/ProtocolsWorkflow";


const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const ContributorsContacts = dynamic(() => import("@/components/custom/entities/ContributorsContacts"))
const CreationActionRelationship = dynamic(() => import("@/components/custom/entities/dataset/CreationActionRelationship"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Metadata = dynamic(() => import("@/components/custom/entities/Metadata"))
const Provenance = dynamic(() => import("@/components/custom/entities/Provenance"), {
    loading: () => <LoadingAccordion id="Provenance" title="Provenance" style={{ height:'490px' }} />
})
const SennetVitessce = dynamic(() => import("@/components/custom/vitessce/SennetVitessce"))

const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewDataset() {
    const [data, setData] = useState(null)
    const [hasAncestry, setHasAncestry] = useState(false)
    const [citationData, setCitationData] = useState(null)
    const [ancestorHasMetadata, setAncestorHasMetadata] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {router, isRegisterHidden, _t, cache, isPreview, getPreviewView, isLoggedIn} = useContext(AppContext)
    const [primaryDatasetData, setPrimaryDatasetInfo] = useState(null)
    const [showFilesSection, setShowFilesSection] = useState(null)
    const [hasViz, setHasViz] = useState(false)
    const [showProtocolsWorkflow, setShowProtocolsWorkflow] = useState(false)
    const {
        showVitessce,
        initVitessceConfig,
        getAssaySplitData,
        fetchDataProducts, dataProducts
    } = useContext(DerivedContext)
    const [datasetCategories, setDatasetCategories] = useState(null)

    const fetchEntityForMultiAssayInfo = async () => {
        for (let entity of data.ancestors) {
            if (datasetIs.primary(entity.creation_action)) {
                const response = await fetch("/api/find?uuid=" + entity.uuid, getRequestHeaders());
                // convert the data to json
                let primary = await response.json();
                if (!primary.error) {
                    const ancestry = await getAncestryData(primary.uuid)
                    Object.assign(primary, ancestry)
                    setPrimaryDatasetInfo(primary)
                    setDatasetCategories(getAssaySplitData(primary))
                } else {
                    log.error('fetchEntityForMultiAssayInfo', primary.error)
                }
                break;
            }
        }
    }

    useEffect(() => {
        if (data && data.ancestors) {
            fetchDataProducts(data)
            if (hasViz) {
                initVitessceConfig(data)
            }
            if (datasetIs.primary(data.creation_action)) {
                setDatasetCategories(getAssaySplitData(data))
            } else {
                fetchEntityForMultiAssayInfo()
            }
        }
    }, [data?.ancestors])

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('dataset: getting data...', uuid)
            // fetch dataset data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('dataset: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
                return
            }

            // set state with the result
            setData(_data)
            let hasViz = eq(_data.has_visualization, 'true')
            setHasViz(hasViz)
            let _showProtocolsWorkflow = !datasetIs.component(_data.creation_action)



            // fetch ancestry data
            getAncestryData(_data.uuid).then(ancestry => {
                if (!hasViz) {
                    // Primary gets processed and updated to QA but the derived dataset is still processed.
                    // This could lead to a scenario where the primary has the property has_visualization: false but the processed is true.
                    // So let's check that a descendant has_visualization: true
                    for (const descendant of ancestry.descendants) {
                        if (eq(descendant.has_visualization, 'true')) {
                            setHasViz(true)
                            break;
                        }
                    }
                }

                if (_showProtocolsWorkflow) {
                    let ingestMetadata = _data.ingest_metadata
                    if (datasetIs.primary(_data.creation_action)) {
                        for (const descendant of ancestry.descendants) {
                            ingestMetadata = descendant.ingest_metadata
                        }
                    }
                    _showProtocolsWorkflow = !(!ingestMetadata || !Object.values(ingestMetadata).length || !ingestMetadata.dag_provenance_list)
                }
                setShowProtocolsWorkflow(_showProtocolsWorkflow)

                Object.assign(_data, ancestry)
                setData(_data)
                setHasAncestry(true)

                for (const ancestor of ancestry.ancestors) {
                    if ((ancestor.metadata && Object.keys(ancestor.metadata).length)) {
                        setAncestorHasMetadata(true)
                        break
                    }
                }
            }).catch(log.error)

            // fetch citation data
            if (_data.doi_url) {
                fetchDataCite(_data.doi_url).then(citation => {
                    setCitationData(citation)
                }).catch(log.error)
            }

            // fetch write privilege
            getWritePrivilegeForGroupUuid(_data.group_uuid).then(response => {
                setHasWritePrivilege(response.has_write_privs)
            }).catch(log.error)
        }

        if (router.query.hasOwnProperty("uuid")) {
            // fetch dataset data
            fetchData(router.query.uuid)
                .catch(log.error);

            if(router.query.hasOwnProperty("redirectedFrom")) {
                let message = router.query.redirectedFrom.replace(/\/$/, '')
                toast.info(`You have been redirected to the unified view for ${message}.`, {
                    position: 'top-right',
                });
            }
        } else {
            setData(null);
        }
    }, [router]);

    const toggleFilesSection = ({hasData, filepath, status}) => {
        if (hasData != null && showFilesSection !== true) {
            setShowFilesSection(hasData)
        }
    }

    if (isPreview(data, error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                <Header title={`${data?.sennet_id || ''} | Dataset | SenNet`}></Header>

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }

                {data && !error &&
                    <div className="container-fluid">
                        {/*Processed/Component dataset alert*/}
                        {!datasetIs.primary(data.creation_action) &&
                            <Alert className={'mt-4'} variant='info'><WarningIcon /> You are viewing a&nbsp;
                                <code>{getCreationActionRelationName(data.creation_action)}</code>.&nbsp;
                                {primaryDatasetData && (
                                    <>
                                        <span>To view the <code>Primary Dataset</code>, visit &nbsp;</span>
                                        <a href={getEntityViewUrl('dataset', primaryDatasetData.uuid, {}, {})}>{primaryDatasetData.sennet_id}</a>
                                    </>
                                )}
                            </Alert>
                        }

                        {/*Banner for Multi Assaay Datasets when a user has been redirected*/}
                        {router.query.hasOwnProperty("redirectedFrom") && datasetIs.primary(data.creation_action) && datasetCategories && (datasetCategories.component.length > 0) &&
                            <Alert className={'mt-4'} variant='info'><WarningIcon/>
                                You have been redirect to
                                the <code>{getCreationActionRelationName(data.creation_action)}</code>, which contains
                                the following <code>Component Dataset(s)</code>:&nbsp;
                                {datasetCategories.component.map((component, index) => {
                                    return (<>
                                            <span>{component.dataset_type}</span>
                                            {index < datasetCategories.component.length - 1 && ', '}
                                        </>
                                    )
                                })}
                            </Alert>
                        }

                        <div className="row flex-nowrap entity-body">
                            <div className="col-auto p-0">
                                <div id="sidebar"
                                     className="collapse collapse-horizontal sticky-top custom-sticky">
                                    <ul id="sidebar-nav" className="nav list-group rounded-0 text-sm-start">
                                        <li className="nav-item">
                                            <a href="#Summary"
                                               className="nav-link "
                                               data-bs-parent="#sidebar">Summary</a>
                                        </li>
                                        {datasetCategories && (datasetCategories.component.length > 0) &&
                                            <li className="nav-item">
                                                <a href="#multi-assay-relationship"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Multi-Assay Relationship</a>
                                            </li>
                                        }

                                        {isLoggedIn() && data.upload &&
                                            <li className="nav-item">
                                                <a href="#Upload"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Associated Upload</a>
                                            </li>
                                        }
                                        {data.collections && data.collections.length > 0 && (
                                            <li className="nav-item">
                                                <a href="#Collections"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Associated Collections</a>
                                            </li>
                                        )}
                                        {hasViz &&
                                            <li className="nav-item">
                                                <a href="#Vitessce"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Visualization</a>
                                            </li>
                                        }
                                        {showProtocolsWorkflow && <li className="nav-item">
                                            <a href="#Protocols-Workflow-Details"
                                               className="nav-link"
                                               data-bs-parent="#sidebar">Protocols & Workflow Details</a>
                                        </li>}
                                        <li className="nav-item">
                                            <a href="#Provenance"
                                               className="nav-link"
                                               data-bs-parent="#sidebar">Provenance</a>
                                        </li>

                                            {!!((data.metadata && Object.keys(data.metadata).length || ancestorHasMetadata)) &&
                                                <li className="nav-item">
                                                    <a href="#Metadata"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Metadata</a>
                                                </li>
                                            }

                                        {data && showFilesSection && <li className="nav-item">
                                            <a href="#files-data-products"
                                               className="nav-link "
                                               data-bs-parent="#sidebar">Files</a>
                                        </li>}

                                        <li className="nav-item">
                                            <a href="#bulk-data-transfer"
                                               className="nav-link "
                                               data-bs-parent="#sidebar">Bulk Data Transfer</a>
                                        </li>

                                        {!!(data.contributors && Object.keys(data.contributors).length) &&
                                            <li className="nav-item">
                                                <a href="#Contributors"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Contributors</a>
                                            </li>
                                        }
                                        <li className="nav-item">
                                            <a href="#Attribution"
                                               className="nav-link"
                                               data-bs-parent="#sidebar">Attribution</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <main className="col m-md-3 entity-details">
                                <SidebarBtn/>

                                <EntityViewHeader data={data}
                                                  uniqueHeader={getDatasetTypeDisplay(data)}
                                                  entity={cache.entities.dataset.toLowerCase()}
                                                  hasWritePrivilege={hasWritePrivilege || false}/>

                                <div className="row">
                                    <div className="col-12">
                                        {/*Description*/}
                                        <Description
                                            primaryDateTitle={data.published_timestamp ? ("Publication Date") : ("Creation Date")}
                                            primaryDate={data.published_timestamp ? (data.published_timestamp) : (data.created_timestamp)}
                                            labId={data.lab_dataset_id}
                                            citationData={citationData}
                                            secondaryDateTitle="Last Touch"
                                            secondaryDate={data.last_modified_timestamp}
                                            data={data}/>

                                        {/*Multi Assay Relationship*/}
                                        {datasetCategories && (datasetCategories.component.length > 0) &&
                                            <CreationActionRelationship entity={data} data={datasetCategories}/>
                                        }

                                        {/*Upload*/}
                                        {isLoggedIn() && data.upload && <Upload data={data.upload}/>}

                                        {/*Collections*/}
                                        {data.collections && data.collections.length > 0 && (
                                            <Collections entityType='Dataset' data={data.collections}/>
                                        )}

                                        {/* Vitessce */}
                                        {data && hasViz && <SenNetSuspense showChildren={showVitessce}
                                                        suspenseElements={<>
                                                            <ShimmerText line={3} gap={10} />
                                                            <ShimmerThumbnail height={700} className={'mt-2'} rounded />
                                                        </>}
                                                        id="Vitessce" title="Visualization"
                                                        style={{ height:'800px' }}>
                                            <SennetVitessce data={data}/>
                                        </SenNetSuspense>}

                                        {showProtocolsWorkflow && <ProtocolsWorkflow data={data} />}

                                        {/*Provenance*/}
                                        <Provenance data={data} hasAncestry={hasAncestry}/>

                                            {/*Metadata*/}
                                            {/*Datasets have their metadata inside "metadata.metadata"*/}
                                            {!!((data.metadata && Object.keys(data.metadata).length) || ancestorHasMetadata) &&
                                                <Metadata
                                                    data={data}
                                                    metadata={data?.metadata}
                                                    mappedMetadata={data?.cedar_mapped_metadata}
                                                />
                                            }

                                        {/*Data Products*/}
                                        { data &&
                                            <FilesDataProducts setShowFilesSection={toggleFilesSection} showFilesSection={showFilesSection} data={data} dataProducts={dataProducts}  />
                                        }

                                        { datasetCategories &&
                                            <BulkDataTransfer data={datasetCategories}  />
                                        }

                                        {/*Contributors*/}
                                        {!!(data.contributors && Object.keys(data.contributors).length) &&
                                            <ContributorsContacts title={'Contributors'} data={data.contributors}/>
                                        }

                                        {/*Attribution*/}
                                        <Attribution data={data}/>

                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                }
                <AppFooter/>
            </>
        )
    }
}

ViewDataset.withWrapper = function (page) {
    return <DerivedProvider>{page}</DerivedProvider>
}

export default ViewDataset
