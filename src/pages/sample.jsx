import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import log from 'xac-loglevel'
import {getAncestryData, getEntityData, getServerEntityData, getWritePrivilegeForGroupUuid} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {APP_ROUTES} from "@/config/constants";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import Tissue from "@/components/custom/entities/sample/Tissue";
import Collections from "@/components/custom/entities/Collections";
import {getCanonicalUrl} from "@/lib/meta";
import {APP_TITLE} from "@/config/config";
import PropTypes from "prop-types";
import {getCookie} from "cookies-next";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Metadata = dynamic(() => import("@/components/custom/entities/Metadata"))
const Protocols = dynamic(() => import("@/components/custom/entities/sample/Protocols"))
const Provenance = dynamic(() => import("@/components/custom/entities/Provenance"), {
    loading: () => <LoadingAccordion id="Provenance" title="Provenance" style={{height: '490px'}}/>
})
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

const sampleDescription = (data) => {
    if (data.description) {
        return data.description
    }
    if (data.sample_category === "Organ") {
        return `${data.organ_hierarchy || 'Organ'} sample ${data.sennet_id || ''}`
    } else {
        return `${data.sample_category} sample ${data.sennet_id || ''}`
    }
}

function ViewSample({initialData, initialError}) {
    const router = useRouter()
    const [data, setData] = useState(initialData)
    const [hasAncestry, setHasAncestry] = useState(false)
    const [ancestorHasMetadata, setAncestorHasMetadata] = useState(false)
    const [error, setError] = useState(Boolean(initialError))
    const [errorMessage, setErrorMessage] = useState(initialError)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext)

    // Fetch entity if SSR didn't provide it
    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('sample: getting data...', uuid)

            const _data = await getEntityData(
                uuid,
                ['ancestors', 'descendants']
            )

            log.debug('sample: Got data', _data)

            if (_data?.error) {
                setError(true)
                setErrorMessage(_data.error)
                setData(false)
                return
            }

            setData(_data)
        }

        const uuid = router.query?.uuid

        if (!uuid) {
            setData(null)
            return
        }

        // Skip fetch if SSR already provided data
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

        // Fetch ancestry
        getAncestryData(data.uuid)
            .then((ancestry) => {
                setData(prev => ({
                    ...prev,
                    ...ancestry
                }))

                setHasAncestry(true)

                for (const ancestor of ancestry.ancestors || []) {
                    if (
                        ancestor.metadata &&
                        Object.keys(ancestor.metadata).length
                    ) {
                        setAncestorHasMetadata(true)
                        break
                    }
                }
            })
            .catch(log.error)

        // Fetch write privileges
        getWritePrivilegeForGroupUuid(data.group_uuid)
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
                        title={`${data.sennet_id || ''} | Sample | ${APP_TITLE}`}
                        description={sampleDescription(data)}
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
                                            className="nav list-group  text-sm-start">
                                            <li className="nav-item">
                                                <a href="#Summary"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Summary</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Tissue"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Tissue</a>
                                            </li>
                                            {data.collections && data.collections.length > 0 && (
                                                <li className="nav-item">
                                                    <a href="#Collections"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Associated Collections</a>
                                                </li>
                                            )}
                                            <li className="nav-item">
                                                <a href="#Provenance"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Provenance</a>
                                            </li>
                                            {!!((data.metadata && Object.keys(data.metadata).length) || ancestorHasMetadata) &&
                                                <li className="nav-item">
                                                    <a href="#Metadata"
                                                       className="nav-link "
                                                       data-bs-parent="#sidebar">Metadata</a>
                                                </li>
                                            }
                                            <li className="nav-item">
                                                <a href="#Protocols"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Protocols</a>
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

                                    <EntityViewHeader data={data} entity={cache?.entities?.sample.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}
                                                      uniqueHeader={data.sample_category}
                                                      uniqueHeaderUrl={data.sample_category == "Organs" ? APP_ROUTES.organs : undefined}
                                    />

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Creation Date"
                                                         primaryDate={data.created_timestamp}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                                         labId={data.lab_tissue_sample_id}
                                            />

                                            {/*Tissue*/}
                                            <Tissue data={data}/>

                                            {/*Collections*/}
                                            {data.collections && data.collections.length > 0 && (
                                                <Collections entityType='Sample' data={data.collections}/>
                                            )}

                                            {/*Provenance*/}
                                            <Provenance data={data} hasAncestry={hasAncestry}/>

                                            {/*Metadata*/}
                                            {/*Samples have their metadata inside "metadata"*/}
                                            {!!((data.metadata && Object.keys(data.metadata).length) || ancestorHasMetadata) &&
                                                <Metadata
                                                    data={data}
                                                    metadata={data?.metadata}
                                                    mappedMetadata={data?.cedar_mapped_metadata}
                                                />
                                            }

                                            {/*Protocols*/}
                                            {data.protocol_url &&
                                                <Protocols protocolUrl={data.protocol_url}/>
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

ViewSample.propTypes = {
    initialData: PropTypes.object,
    initialError: PropTypes.string
}

export default ViewSample
