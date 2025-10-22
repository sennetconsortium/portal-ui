import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {eq, fetchDataCite, getDatasetTypeDisplay} from "@/components/custom/js/functions";
import {getWritePrivilegeForGroupUuid, getAncestryData, getEntityData} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "@/context/DerivedContext";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import VignetteList from "@/components/custom/vitessce/VignetteList";
import BulkDataTransfer from "@/components/custom/entities/dataset/BulkDataTransfer";
import AssociatedEntity from "@/components/custom/entities/AssociatedEntity";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const ContributorsContacts = dynamic(() => import("@/components/custom/entities/ContributorsContacts"))
const FileTreeView = dynamic(() => import("@/components/custom/entities/dataset/FileTreeView"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Provenance = dynamic(() => import("@/components/custom/entities/Provenance"), {
    loading: () => <LoadingAccordion id="Provenance" title="Provenance" style={{ height:'490px' }} />
})
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewPublication() {
    const [data, setData] = useState(null)
    const [hasAncestry, setHasAncestry] = useState(false)
    const [citationData, setCitationData] = useState(null)
    const [ancillaryPublicationData, setAncillaryPublicationData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {router, isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext)

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('publication: getting data...', uuid)
            // fetch publication data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('publication: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
                return
            }

            // set state with the result
            setData(_data)

            // fetch ancestry data
            getAncestryData(_data.uuid,  {endpoints: ['ancestors', 'descendants'], otherEndpoints: []},'Publication').then(ancestry => {
                Object.assign(_data, ancestry)
                setData(_data)
                setHasAncestry(true)

                // get ancillary publication
                // there could potentially be multiple descendants
                let ancillaryPublication = null
                if (ancestry.descendants.length > 1) {
                    // get the most recent ancillary publication
                    ancillaryPublication = ancestry.descendants
                        .sort((a, b) => new Date(b.last_modified_timestamp) - new Date(a.last_modified_timestamp))
                        .find(d => d.dataset_type === 'Publication [ancillary]' && d?.files[0]?.rel_path)
                } else {
                    ancillaryPublication = _data.descendants
                        .find(d => d.dataset_type === 'Publication [ancillary]' && d?.files[0]?.rel_path)
                }

                setAncillaryPublicationData(ancillaryPublication || {})
            }).catch(log.error)

            // fetch citation data
            if (_data.publication_url) {
                fetchDataCite(_data.publication_url).then(citation => {
                    setCitationData(citation)
                }).catch(log.error)
            }

            // fetch write privilege
            getWritePrivilegeForGroupUuid(_data.group_uuid).then(response => {
                setHasWritePrivilege(response.has_write_privs)
            }).catch(log.error)
        }

        if (router.query.hasOwnProperty("uuid")) {
            // fetch publication data
            fetchData(router.query.uuid)
                .catch(log.error);
        } else {
            setData(null);
        }
    }, [router]);

    const getTimestamp = () => {
        const dates = data?.publication_date.split('-')
        return new Date( dates[0], dates[1] - 1, dates[2])
    }

    const getDatasetTypeFromAncestors = () => {
        let res = new Set();
        for (let d of data.ancestors) {
            if (eq(d.entity_type, cache.entities.dataset)) {
                res.add(getDatasetTypeDisplay(d))
            }
        }
        return Array.from(res).join(', ')
    }

    if (isPreview(data, error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data && <Header title={`${data.sennet_id} | Publication | SenNet`}></Header>}

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <>
                        <div className="container-fluid">
                            <div className="row flex-nowrap entity-body">
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

                                            {data.associated_collection && Object.values(data.associated_collection).length > 0 && <li className="nav-item">
                                                <a href="#AssociatedEntity--Collection"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Associated Collection</a>
                                            </li>}

                                            <li className="nav-item">
                                                <a href="#Visualizations"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Visualizations</a>
                                            </li>

                                            <li className="nav-item">
                                                <a href="#Provenance"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Provenance</a>
                                            </li>

                                            <li className="nav-item">
                                                <a href="#bulk-data-transfer"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Bulk Data Transfer</a>
                                            </li>

                                            {!!(data.contacts && Object.keys(data.contacts).length) &&
                                                <li className="nav-item">
                                                    <a href="#Authors"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Authors</a>
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
                                                      uniqueHeader={data.ancestors ? getDatasetTypeFromAncestors() : null}
                                                      entity={cache.entities.publication.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}/>

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Publication Date"
                                                         title={'Publication Details'}
                                                         primaryDate={getTimestamp()}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                                         citationData={citationData}
                                                         data={data}
                                                         showAuthors={true}
                                                         showDatasetTypes={true}
                                                         showOrgans={true}
                                            />

                                            {data.associated_collection && Object.values(data.associated_collection).length > 0 && <AssociatedEntity currentEntity={'Publication'} data={data.associated_collection} />}

                                            {/* Visualizations */}
                                            {data.ancestors &&
                                            <VignetteList 
                                                publication={{uuid: data.uuid}}
                                                ancillaryPublication={ancillaryPublicationData}/>
                                            }

                                            {/*Provenance*/}
                                            <Provenance data={data} hasAncestry={hasAncestry}/>

                                            {/*Bulk Data Transfer*/}
                                            <BulkDataTransfer data={data} entityType={data.entity_type} />

                                             {!!(data.contacts && Object.keys(data.contacts).length) &&
                                                <ContributorsContacts title={'Authors'} data={data.contributors}/>
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

ViewPublication.withWrapper = function (page) {
    return <DerivedProvider>{page}</DerivedProvider>
}

export default ViewPublication
