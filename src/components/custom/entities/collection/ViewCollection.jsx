import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {fetchDataCite} from "@/components/custom/js/functions";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "@/context/DerivedContext";
import {useRouter} from "next/router";
import {
    callService,
    filterProperties,
    getWritePrivilegeForGroupUuid,
    getEntityData
} from "@/lib/services";
import {getEntityEndPoint} from "@/config/config";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import Datasets from "@/components/custom/entities/collection/Datasets"
import ContributorsContacts from "@/components/custom/entities/ContributorsContacts"
import AssociatedEntity from "@/components/custom/entities/AssociatedEntity";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewCollection({collectionType='Collection', entitiesLabel='Entities'}) {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [isEntitiesLoading, setIsEntitiesLoading] = useState(true)
    const [citationData, setCitationData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, _t, isPreview, getPreviewView} = useContext(AppContext)

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('collection: getting data...', uuid)
            // fetch collection data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('collection: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
                setIsEntitiesLoading(false)
                return
            }

            // set state with the result
            setData(_data)

            // fetch entities data
            callService(filterProperties.collectionEntities, `${getEntityEndPoint()}collections/${_data.uuid}/entities`, 'POST').then(entities => {
                Object.assign(_data, {entities})
                setData(_data)
                setIsEntitiesLoading(false)
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
            // fetch collection data
            fetchData(router.query.uuid)
                .catch(log.error);
        } else {
            setData(null);
        }
    }, [router]);

    if (isPreview(data, error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data && <Header title={`${data.sennet_id} | ${collectionType} | SenNet`}></Header>}

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
                                            {data.associated_publication && Object.values(data.associated_publication).length > 0 && <li className="nav-item">
                                                <a href="#AssociatedEntity--Publication"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Associated Publication</a>
                                            </li>}
                                            <li className="nav-item">
                                                <a href="#Entities"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Entities</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Contributors"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Contributors</a>
                                            </li>
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

                                    <EntityViewHeader data={data} entity={collectionType.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}
                                    />

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description
                                                data={data}
                                                citationData={citationData}
                                                primaryDateTitle="Creation Date"
                                                primaryDate={data.created_timestamp}
                                                secondaryDateTitle="Modification Date"
                                                secondaryDate={data.last_modified_timestamp}
                                            />

                                            {data.associated_publication && Object.values(data.associated_publication).length > 0 && <AssociatedEntity currentEntity={data.entity_type} data={data.associated_publication} grammar={'contains'} />}

                                            {/*Entities*/}
                                            {isEntitiesLoading ? (
                                                <LoadingAccordion id={entitiesLabel} title={entitiesLabel} />
                                            ) : (
                                                <Datasets data={data.entities} label={entitiesLabel}/>
                                            )}

                                            {/*Contributors*/}
                                            <ContributorsContacts title={'Contributors'} data={data.contributors}/>

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

ViewCollection.withWrapper = function (page) {
    return <DerivedProvider>{page}</DerivedProvider>
}

export default ViewCollection
