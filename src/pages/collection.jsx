import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react";
import log from "loglevel";
import {fetchDataCite, getRequestHeaders} from "@/components/custom/js/functions";
import Header from "@/components/custom/layout/Header";
import AppContext from "@/context/AppContext";
import Alert from 'react-bootstrap/Alert';
import {EntityViewHeader} from "@/components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "@/context/DerivedContext";
import {useRouter} from "next/router";
import {get_write_privilege_for_group_uuid, getAncestryData, getEntityData} from "@/lib/services";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const Attribution = dynamic(() => import("@/components/custom/entities/sample/Attribution"))
const ContributorsContacts = dynamic(() => import("@/components/custom/entities/ContributorsContacts"))
const Datasets = dynamic(() => import("@/components/custom/entities/collection/Datasets"))
const Description = dynamic(() => import("@/components/custom/entities/sample/Description"))
const SidebarBtn = dynamic(() => import("@/components/SidebarBtn"))

function ViewCollection() {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [doiData, setDoiData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, _t, isPreview, getPreviewView} = useContext(AppContext)

    // only executed on init rendering, see the []
    useEffect(() => {
        // declare the async data fetching function
        const fetchData = async (uuid) => {


            log.debug('collection: getting data...', uuid)
            // get the data from the api
            const _data = await getEntityData(uuid)

            log.debug('collection: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
                setData(false)
            } else {
                setData(_data)
                const ancestry = await getAncestryData(_data.uuid)
                Object.assign(_data, ancestry)
                setData(_data)

                const doi = await fetchDataCite(_data.doi_url)
                setDoiData(doi?.data)

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
                {data && <Header title={`${data.sennet_id} | Collection | SenNet`}></Header>}

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
                                                <a href="#Contacts"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Contacts</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Entities"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Entities</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Creators"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Creators</a>
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

                                    <EntityViewHeader data={data} entity={'collection'}
                                                      hasWritePrivilege={hasWritePrivilege}
                                    />

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description
                                                data={data}
                                                doiData={doiData}
                                                primaryDateTitle="Creation Date"
                                                primaryDate={data.created_timestamp}
                                                secondaryDateTitle="Modification Date"
                                                secondaryDate={data.last_modified_timestamp}
                                            />

                                            {/*Contacts*/}
                                            <ContributorsContacts title={'Contacts'} data={data.contacts}/>

                                            {/*Entities*/}
                                            <Datasets data={data.entities || data.datasets} label={'Entities'}/>

                                            {/*Creators*/}
                                            <ContributorsContacts title={'Creators'} data={data.creators}/>

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
