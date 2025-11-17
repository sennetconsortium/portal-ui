import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import log from "loglevel";
import {
    callService,
    filterProperties,
    getWritePrivilegeForGroupUuid,
    getEntityData
} from "@/lib/services";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {getEntityEndPoint} from "@/config/config";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import AppNavbar from "@/components/custom/layout/AppNavbar"
import Description from "@/components/custom/entities/sample/Description";
import FileTreeView from "@/components/custom/entities/dataset/FileTreeView";
import Datasets from "@/components/custom/entities/collection/Datasets";
import Attribution from "@/components/custom/entities/sample/Attribution";
import FilesDataProducts from "@/components/custom/entities/dataset/FilesDataProducts";
import BulkDataTransfer from "@/components/custom/entities/dataset/BulkDataTransfer";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewUpload() {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [isDatasetsLoading, setIsDatasetsLoading] = useState(true)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)
    const {isRegisterHidden, _t, cache, isPreview, getPreviewView} = useContext(AppContext);
    const [showFilesSection, setShowFilesSection] = useState(null)

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('upload: getting data...', uuid)
            // fetch upload data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('upload: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
                setIsDatasetsLoading(false)
                return
            }

            // set state with the result
            setData(_data)

            // fetch datasets data
            callService(filterProperties.uploadsDatasets, `${getEntityEndPoint()}uploads/${_data.uuid}/datasets`, 'POST').then(datasets => {
                Object.assign(_data, {datasets})
                setData(_data)
                setIsDatasetsLoading(false)
            }).catch(log.error)

            // fetch write privilege
            getWritePrivilegeForGroupUuid(_data.group_uuid).then(response => {
                setHasWritePrivilege(response.has_write_privs)
            }).catch(log.error)
        }

        if (router.query.hasOwnProperty("uuid")) {
            // fetch upload data
            fetchData(router.query.uuid)
                .catch(log.error);
        } else {
            setData(null);
        }
    }, [router]);

    const toggleFilesSection = ({hasData, filepath, status}) => {
        const has = hasData || (filepath?.length > 0) || (status > 200)
        if (has !== showFilesSection && showFilesSection !== true) {
            setShowFilesSection(has)
        }
    }

    if (isPreview(data, error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                {data && <Header title={`${data.sennet_id} | Upload | SenNet`}></Header>}

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
                                            <li className="nav-item">
                                                <a href="#bulk-data-transfer"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Bulk Data Transfer</a>
                                            </li>
                                            {data.datasets?.length > 0 && <li className="nav-item">
                                                <a href="#Datasets"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Datasets</a>
                                            </li>}
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

                                    <EntityViewHeader data={data} entity={cache.entities.upload.toLowerCase()}
                                                      hasWritePrivilege={hasWritePrivilege}/>

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Creation Date"
                                                         primaryDate={data.created_timestamp}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                                         labId={data.title}
                                                         data={data}
                                            />

                                            {/*Bulk Data Transfer*/}
                                             <BulkDataTransfer data={data} entityType={data.entity_type} />

                                            {/*Datasets*/}
                                            {isDatasetsLoading ? (
                                                <LoadingAccordion id='Datasets' title='Datasets' />
                                            ) : (
                                                <Datasets data={data.datasets}/>
                                            )}

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


export default ViewUpload
