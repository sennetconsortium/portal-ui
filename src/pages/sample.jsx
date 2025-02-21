import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import log from "loglevel";
import {get_write_privilege_for_group_uuid, getAncestryData, getEntityData} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {APP_ROUTES} from "@/config/constants";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import Tissue from "@/components/custom/entities/sample/Tissue";
import Collections from "@/components/custom/entities/Collections";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Metadata = dynamic(() => import("@/components/custom/entities/Metadata"))
const Protocols = dynamic(() => import("@/components/custom/entities/sample/Protocols"))
const Provenance = dynamic(() => import("@/components/custom/entities/Provenance"), {
    loading: () => <LoadingAccordion id="Provenance" title="Provenance" style={{ height:'490px' }} />
})
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewSample() {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [ancestorHasMetadata, setAncestorHasMetadata] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext)

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('sample: getting data...', uuid)
            // fetch sample data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('sample: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
                return
            }

            // set state with the result
            setData(_data)

            // fetch ancestry data
            getAncestryData(_data.uuid).then(ancestry => {
                Object.assign(_data, ancestry)
                setData(_data)

                for (const ancestor of ancestry.ancestors) {
                    if (ancestor.metadata && Object.keys(ancestor.metadata).length) {
                        setAncestorHasMetadata(true)
                        break
                    }
                }
            }).catch(log.error)

            // fetch write privilege
            get_write_privilege_for_group_uuid(_data.group_uuid).then(response => {
                setHasWritePrivilege(response.has_write_privs)
            }).catch(log.error)
        }

        if (router.query.hasOwnProperty("uuid")) {
            // fetch sample data
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
                {data && <Header title={`${data.sennet_id} | Sample | SenNet`}></Header>}

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

                                <main className="col m-md-3 entity_details">
                                    <SidebarBtn/>

                                    <EntityViewHeader data={data} entity={cache.entities.sample.toLowerCase()}
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
                                            <Provenance nodeData={data}/>

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


export default ViewSample
