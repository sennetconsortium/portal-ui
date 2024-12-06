import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {eq, fetchDataCite, getDatasetTypeDisplay} from "@/components/custom/js/functions";
import {get_write_privilege_for_group_uuid, getAncestryData, getEntityData} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "@/context/DerivedContext";
import ContributorsContacts from "@/components/custom/entities/ContributorsContacts";
import FileTreeView from "@/components/custom/entities/dataset/FileTreeView";
import VignetteList from "@/components/custom/vitessce/VignetteList";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const Description = dynamic(() => import("@/components/custom/entities/sample/Description"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Provenance = dynamic(() => import( "@/components/custom/entities/Provenance"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewPublication() {
    const [data, setData] = useState(null)
    const [citationData, setCitationData] = useState(null)
    const [ancillaryPublicationData, setAncillaryPublicationData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {router, isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext)

    // only executed on init rendering, see the []
    useEffect(() => {
        // declare the async data fetching function
        const fetchData = async (uuid) => {

            log.debug('publication: getting data...', uuid)
            // get the data from the api
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('publication: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
            } else {
                setData(_data)
                const ancestry = await getAncestryData(_data.uuid)
                Object.assign(_data, ancestry)
                setData(_data)

                const citation = await fetchDataCite(_data.publication_url)
                setCitationData(citation)

                // there could potentially be multiple descendants
                let ancillaryPublication = null
                if (_data.descendants.length > 1) {
                    // get the most recent ancillary publication
                    ancillaryPublication = _data.descendants
                        .sort((a, b) => new Date(b.last_modified_timestamp) - new Date(a.last_modified_timestamp))
                        .find(d => d.dataset_type === 'Publication [ancillary]' && d?.files[0]?.rel_path)
                } else {
                    ancillaryPublication = _data.descendants
                        .find(d => d.dataset_type === 'Publication [ancillary]' && d?.files[0]?.rel_path)
                }

                setAncillaryPublicationData(ancillaryPublication || {})

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
                                                <a href="#Files"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Files</a>
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

                                <main className="col m-md-3 entity_details">
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

                                            {/* Visualizations */}
                                            <VignetteList 
                                                publication={{uuid: data.uuid}}
                                                ancillaryPublication={ancillaryPublicationData}/>

                                            {/*Provenance*/}
                                            {data &&
                                                <Provenance nodeData={data}/>
                                            }

                                            {/*Files*/}
                                            <FileTreeView data={data}/>

                                             {!!(data.contacts && Object.keys(data.contacts).length) &&
                                                <ContributorsContacts title={'Authors'} data={data.contacts}/>
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
