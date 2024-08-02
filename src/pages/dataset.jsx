import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {
    datasetIs,
    fetchDataCite,
    getCreationActionRelationName,
    getEntityViewUrl,
    getRequestHeaders
} from "@/components/custom/js/functions";
import {
    get_write_privilege_for_group_uuid,
    getAncestryData,
    getEntityData
} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import DerivedContext, {DerivedProvider} from "@/context/DerivedContext";
import FileTreeView from "@/components/custom/entities/dataset/FileTreeView";
import WarningIcon from '@mui/icons-material/Warning'

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const ContributorsContacts = dynamic(() => import("@/components/custom/entities/ContributorsContacts"))
const CreationActionRelationship = dynamic(() => import("@/components/custom/entities/dataset/CreationActionRelationship"))
const DataProducts = dynamic(() => import("@/components/custom/entities/dataset/DataProducts"))
const Description = dynamic(() => import("@/components/custom/entities/sample/Description"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Metadata = dynamic(() => import("@/components/custom/entities/Metadata"))
const Provenance = dynamic(() => import("@/components/custom/entities/Provenance"))
const SennetVitessce = dynamic(() => import("@/components/custom/vitessce/SennetVitessce"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))
const Upload = dynamic(() => import("@/components/custom/entities/dataset/Upload"))

function ViewDataset() {
    const [data, setData] = useState(null)
    const [doiData, setDoiData] = useState(null)
    const [ancestorHasMetadata, setAncestorHasMetadata] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {router, isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext)
    const [primaryDatasetData, setPrimaryDatasetInfo] = useState(null)
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
                    console.error('fetchEntityForMultiAssayInfo', primary.error)
                }
                break;
            }
        }
    }

    useEffect(() => {
        if (data && data.ancestors) {
            initVitessceConfig(data)
            if (datasetIs.primary(data.creation_action)) {
                setDatasetCategories(getAssaySplitData(data))
            } else {
                fetchEntityForMultiAssayInfo()
            }
            fetchDataProducts(data)
        }
    }, [data?.ancestors])

    // only executed on init rendering, see the []
    useEffect(() => {
        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('dataset: getting data...', uuid)
            // get the data from the api
            const _data = await getEntityData(uuid);

            log.debug('dataset: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
            } else {
                // set state with the result
                setData(_data)
                const ancestry = await getAncestryData(_data.uuid)
                Object.assign(_data, ancestry)
                setData(_data)

                const doi = await fetchDataCite(_data.doi_url)
                setDoiData(doi?.data)
                for (const ancestor of ancestry.ancestors) {
                    console.log(ancestor)
                    if ((ancestor.metadata && Object.keys(ancestor.metadata).length) || (ancestor.ingest_metadata && Object.keys(ancestor.ingest_metadata) && 'metadata' in ancestor.ingest_metadata)) {
                        setAncestorHasMetadata(true)
                        break
                    }
                }

                get_write_privilege_for_group_uuid(_data.group_uuid).then(response => {
                    setHasWritePrivilege(response.has_write_privs)
                }).catch(log.error)
            }
        }

        if (router.query.hasOwnProperty("uuid")) {
            // call the function
            fetchData(router.query.uuid)
                // make sure to catch any error
                .catch(console.error);
            ;
        } else {
            setData(null);
        }
    }, [router]);

    if (isPreview(data, error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data && <Header title={`${data.sennet_id} | Dataset | SenNet`}></Header>}

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <>
                        <div className="container-fluid">
                            {!datasetIs.primary(data.creation_action) && primaryDatasetData && <Alert className={'mt-4'} variant='info'><WarningIcon /> You are viewing a&nbsp;
                                <code>{getCreationActionRelationName(data.creation_action)}</code>. To view the <code>Primary Dataset</code>, visit &nbsp;
                                <a href={getEntityViewUrl('dataset', primaryDatasetData.uuid, {})}>{primaryDatasetData.sennet_id}</a>
                            </Alert>}
                            <div className="row flex-nowrap entity_body">
                                <div className="col-auto p-0">

                                    <div id="sidebar"
                                         className="collapse collapse-horizontal sticky-top custom-sticky">
                                        <ul id="sidebar-nav"
                                            className="nav list-group rounded-0 text-sm-start">
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
                                                </li>}
                                            {datasetIs.primary(data.creation_action) || datasetIs.processed(data.creation_action) && dataProducts && (dataProducts.length > 0) &&
                                                <li className="nav-item">
                                                    <a href="#data-products"
                                                       className="nav-link "
                                                       data-bs-parent="#sidebar">Data Products</a>
                                                </li>}
                                            {data.upload && data.upload.uuid &&
                                                <li className="nav-item">
                                                    <a href="#Associated Upload"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Upload</a>
                                                </li>
                                            }
                                            {showVitessce &&
                                                <li className="nav-item">
                                                    <a href="#Vitessce"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Visualization</a>
                                                </li>
                                            }
                                            <li className="nav-item">
                                                <a href="#Provenance"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Provenance</a>
                                            </li>

                                            {!!((data.ingest_metadata && Object.keys(data.ingest_metadata).length && 'metadata' in data.ingest_metadata) || ancestorHasMetadata) &&
                                                <li className="nav-item">
                                                    <a href="#Metadata"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Metadata</a>
                                                </li>
                                            }

                                            <li className="nav-item">
                                                <a href="#Files"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Files</a>
                                            </li>

                                            {!!(data.contacts && Object.keys(data.contacts).length) &&
                                                <li className="nav-item">
                                                    <a href="#Contacts"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Contacts</a>
                                                </li>
                                            }

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

                                <main className="col m-md-3 entity_details">
                                    <SidebarBtn/>

                                    <EntityViewHeader data={data}
                                                      uniqueHeader={data.display_subtype || data.dataset_type}
                                                      entity={cache.entities.dataset.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}/>

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description
                                                primaryDateTitle={data.published_timestamp ? ("Publication Date") : ("Creation Date")}
                                                primaryDate={data.published_timestamp ? (data.published_timestamp) : (data.created_timestamp)}
                                                labId={data.lab_dataset_id}
                                                doiData={doiData}
                                                secondaryDateTitle="Last Touch"
                                                secondaryDate={data.last_modified_timestamp}
                                                data={data}/>

                                            {datasetCategories && (datasetCategories.component.length > 0) &&
                                                <CreationActionRelationship entity={data} data={datasetCategories}/>}

                                            {(datasetIs.primary(data.creation_action) || datasetIs.processed(data.creation_action)) && dataProducts && (dataProducts.length > 0) &&
                                                <DataProducts data={data} files={dataProducts}/>}

                                            {/*Upload*/}
                                            {data.upload && data.upload.uuid && <Upload data={data.upload}/>}

                                            {/* Vitessce */}
                                            <SennetVitessce data={data}/>

                                            {/*Provenance*/}
                                            {data &&
                                                <Provenance nodeData={data}/>
                                            }

                                            {/*Metadata*/}
                                            {/*Datasets have their metadata inside "metadata.metadata"*/}
                                            {!!((data.ingest_metadata && Object.keys(data.ingest_metadata).length && 'metadata' in data.ingest_metadata) || ancestorHasMetadata) &&
                                                <Metadata
                                                    data={data}
                                                    metadata={data?.ingest_metadata?.metadata}
                                                    mappedMetadata={data?.cedar_mapped_metadata}
                                                />
                                            }

                                            {/*Files*/}
                                            <FileTreeView data={data}/>

                                            {/*Contacts*/}
                                            {!!(data.contacts && Object.keys(data.contacts).length) &&
                                                <ContributorsContacts title={'Contacts'} data={data.contacts}/>
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
                    </>
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
