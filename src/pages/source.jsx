import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import log from 'xac-loglevel'
import {eq, extractSourceMappedMetadataInfo} from "@/components/custom/js/functions";
import {getAncestryData, getEntityData, getServerEntityData, getWritePrivilegeForGroupUuid} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
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

function ViewSource({initialData, initialError}) {
    const router = useRouter()
    const [data, setData] = useState(initialData)
    const [hasAncestry, setHasAncestry] = useState(false)
    const [metadata, setMetadata] = useState(null)
    const [mappedMetadata, setMappedMetadata] = useState(null)
    const [groups, setGroups] = useState(null)
    const [error, setError] = useState(Boolean(initialError))
    const [errorMessage, setErrorMessage] = useState(initialError)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext);

    // Fetch entity if SSR didn't provide it
    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('source: getting data...', uuid)

            const _data = await getEntityData(
                uuid,
                ['ancestors', 'descendants']
            )

            log.debug('source: Got data', _data)

            if (_data?.error) {
                setError(true)
                setErrorMessage(_data.error)
                setData(false)
                return
            }

            setData(_data)
        }

        if (!router.query.uuid) {
            setData(null)
            return
        }

        // SSR already provided the entity
        if (data) {
            return
        }

        fetchData(router.query.uuid)
            .catch(console.error)

    }, [router.query.uuid])

    // Fill in remaining fields when data is available
    useEffect(() => {
        if (!data || data === false) {
            return
        }

        // Metadata handling
        if (
            eq(data.source_type, cache?.sourceTypes?.Human) &&
            data.source_mapped_metadata
        ) {
            const {groups, metadata} =
                extractSourceMappedMetadataInfo(
                    data.source_mapped_metadata
                )

            setGroups(groups)
            setMetadata(metadata)
        } else if (
            eq(data.source_type, cache?.sourceTypes?.Mouse) &&
            data.metadata
        ) {
            setMappedMetadata(
                data.cedar_mapped_metadata
            )

            setMetadata(data.metadata)
        }

        // Ancestry
        getAncestryData(data.uuid)
            .then(ancestry => {
                setData(prev => ({
                    ...prev,
                    ...ancestry
                }))

                setHasAncestry(true)
            })
            .catch(log.error)

        // Write privileges
        getWritePrivilegeForGroupUuid(
            data.group_uuid
        )
            .then(response => {
                setHasWritePrivilege(
                    response.has_write_privs
                )
            })
            .catch(log.error)

    }, [
        data?.uuid,
        cache?.sourceTypes?.Human,
        cache?.sourceTypes?.Mouse
    ])

    if (isPreview(data, error)) {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data &&
                    <Header
                        title={`${data.sennet_id || ''} | Source | ${APP_TITLE}`}
                        description={data.description || `${data.source_type} source ${data.sennet_id || ''}`}
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
                                            {!!((eq(data.source_type, cache?.sourceTypes.Mouse) && data.metadata && Object.keys(data.metadata).length) ||
                                                    (eq(data.source_type, cache?.sourceTypes.Human) && data.source_mapped_metadata && Object.keys(data.source_mapped_metadata).length)) &&
                                                <li className="nav-item">
                                                    <a href="#Metadata"
                                                       className="nav-link"
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

                                    <EntityViewHeader data={data} entity={cache?.entities?.source.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}/>

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Creation Date"
                                                         primaryDate={data.created_timestamp}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                                         labId={data.lab_source_id}
                                            />

                                            {/*Collections*/}
                                            {data.collections && data.collections.length > 0 && (
                                                <Collections entityType='Source' data={data.collections}/>
                                            )}

                                            {/*Provenance*/}
                                            <Provenance data={data} hasAncestry={hasAncestry}/>

                                            {/*Metadata*/}
                                            {metadata &&
                                                <Metadata
                                                    data={data}
                                                    metadata={metadata}
                                                    mappedMetadata={mappedMetadata}
                                                    groups={groups}/>
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

ViewSource.propTypes = {
    initialData: PropTypes.object,
    initialError: PropTypes.string
}

export default ViewSource
