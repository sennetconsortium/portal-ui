import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from 'xac-loglevel'
import {eq, fetchDataCite} from "@/components/custom/js/functions";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "@/context/DerivedContext";
import {useRouter} from "next/router";
import {
    callService,
    filterProperties,
    getEntityData,
    getServerEntityData,
    getWritePrivilegeForGroupUuid
} from "@/lib/services";
import {APP_TITLE, getEntityEndPoint} from "@/config/config";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import Datasets from "@/components/custom/entities/collection/Datasets"
import ContributorsContacts from "@/components/custom/entities/ContributorsContacts"
import AssociatedEntityTable from "../AssociatedEntityTable";
import Lineage from "@/components/custom/entities/sample/Lineage";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import SenNetSuspense from "@/components/SenNetSuspense";
import {getCanonicalUrl} from "@/lib/meta";
import PropTypes from "prop-types";
import {getCookie} from "cookies-next";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewCollection({collectionType = 'Collection', entitiesLabel = 'Entities', initialData, initialError}) {
    const router = useRouter()
    const [data, setData] = useState(initialData)
    const [isEntitiesLoading, setIsEntitiesLoading] = useState(true)
    const [citationData, setCitationData] = useState(null)
    const [error, setError] = useState(Boolean(initialError))
    const [errorMessage, setErrorMessage] = useState(initialError)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, _t, isPreview, getPreviewView} = useContext(AppContext)

    // Fetch entity if SSR didn't provide it
    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('collection: getting data...', uuid)

            const _data = await getEntityData(
                uuid,
                ['ancestors', 'descendants']
            )

            log.debug('collection: Got data', _data)

            if (_data?.error) {
                setError(true)
                setErrorMessage(_data.error)
                setData(false)
                setIsEntitiesLoading(false)
                return
            }

            setData(_data)
        }

        const uuid = router.query?.uuid

        if (!uuid) {
            setData(null)
            return
        }

        // Skip fetch when provided by SSR
        if (data) {
            return
        }

        fetchData(uuid)
            .catch(log.error)

    }, [router.query?.uuid])

    // Fill in remaining fields when data is available
    useEffect(() => {
        if (!data || data === false) {
            return
        }

        // Fetch collection entities
        callService(
            filterProperties.collectionEntities,
            `${getEntityEndPoint()}collections/${data.uuid}/entities`,
            'POST'
        )
            .then((entities) => {
                setData(prev => ({
                    ...prev,
                    entities
                }))

                setIsEntitiesLoading(false)
            })
            .catch(log.error)

        // Fetch citation data
        if (data.doi_url) {
            fetchDataCite(data.doi_url)
                .then(setCitationData)
                .catch(log.error)
        }

        // Fetch write privilege
        getWritePrivilegeForGroupUuid(
            data.group_uuid
        )
            .then((response) => {
                setHasWritePrivilege(
                    response.has_write_privs
                )
            })
            .catch(log.error)

    }, [data?.uuid])

    if (isPreview(data, error)) {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data &&
                    <Header
                        title={`${data.sennet_id} | ${collectionType} | ${APP_TITLE}`}
                        description={data.description || data.title}
                        canonical={getCanonicalUrl(data)}
                    />
                }

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <>
                        <div className="container-fluid">
                            <div className="row flex-nowrap entity-body g-0">
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
                                            {data.associated_publication && Object.values(data.associated_publication).length > 0 &&
                                                <li className="nav-item">
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

                                            {data.associated_publication && Object.values(data.associated_publication).length > 0 &&
                                                <AssociatedEntityTable id='AssociatedEntity--Publication' data={{
                                                    ...data,
                                                    publications: [data.associated_publication]
                                                }} propertyName={'publications'}/>}

                                            {/*Entities*/}
                                            <SenNetSuspense showChildren={!isEntitiesLoading}>
                                                {eq(entitiesLabel, 'entities') &&
                                                    <SenNetAccordion title={entitiesLabel}>
                                                        <Lineage lineage={data.entities}/>
                                                    </SenNetAccordion>}

                                                {!eq(entitiesLabel, 'entities') &&
                                                    <Datasets data={data.entities} label={entitiesLabel}/>}
                                            </SenNetSuspense>


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

export async function getServerSideProps(context) {
    const {uuid} = context.query
    const token = getCookie('groups_token', {
        req: context.req,
        res: context.res
    })

    try {
        const initialData = await getServerEntityData(
            uuid,
            token,
            ['ancestors', 'descendants']
        )

        return {
            props: {
                initialData,
                initialError: null
            }
        }
    } catch (e) {
        return {
            props: {
                initialData: null,
                initialError: e.message
            }
        }
    }
}
ViewCollection.withWrapper = function (page) {
    return <DerivedProvider>{page}</DerivedProvider>
}

ViewCollection.propTypes = {
    collectionType: PropTypes.string,
    entitiesLabel: PropTypes.string,
    initialData: PropTypes.object,
    initialError: PropTypes.string
}

export default ViewCollection
