import React, {useContext, useEffect, useState} from "react";
import Description from "../components/custom/entities/sample/Description";
import log from "loglevel";
import {getRequestHeaders} from "../components/custom/js/functions";
import AppNavbar from "../components/custom/layout/AppNavbar";
import {get_write_privilege_for_group_uuid} from "../lib/services";
import Unauthorized from "../components/custom/layout/Unauthorized";
import AppFooter from "../components/custom/layout/AppFooter";
import Header from "../components/custom/layout/Header";
import Spinner from "../components/custom/Spinner";
import AppContext from "../context/AppContext";
import Alert from 'react-bootstrap/Alert';
import ContributorsContacts from "../components/custom/entities/ContributorsContacts";
import {EntityViewHeader} from "../components/custom/layout/entity/ViewHeader";
import {DerivedProvider} from "../context/DerivedContext";
import SidebarBtn from "../components/SidebarBtn";
import {useRouter} from "next/router";
import Protocols from "../components/custom/entities/sample/Protocols";
import Datasets from "../components/custom/entities/collection/Datasets";



function ViewCollection() {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, isLoggedIn, isUnauthorized, isAuthorizing, _t, cache} = useContext(AppContext)

    // only executed on init rendering, see the []
    useEffect(() => {
        // declare the async data fetching function
        const fetchData = async (uuid) => {


            log.debug('collection: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, getRequestHeaders());
            // convert the data to json
            const data = await response.json();

            log.debug('collection: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
                setData(false)
            } else {
                // set state with the result
                setData(data);

                // get_write_privilege_for_group_uuid(data.group_uuid).then(response => {
                //     setHasWritePrivilege(response.has_write_privs)
                // }).catch(log.error)
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

    if ((isAuthorizing() || isUnauthorized()) && !data) {
        return (
            data == null ? <Spinner/> : <Unauthorized/>
        )
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
                                                <a href="#Contacts"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Contacts</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Datasets"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Datasets</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Protocols"
                                                   className="nav-link "
                                                   data-bs-parent="#sidebar">Protocols</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Creators"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Creators</a>
                                            </li>

                                        </ul>
                                    </div>
                                </div>

                                <main className="col m-md-3 entity_details">
                                    <SidebarBtn />

                                    <EntityViewHeader data={data} entity={'collection'}
                                                      hasWritePrivilege={hasWritePrivilege}
                                                      uniqueHeader={data.title} />

                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Creation Date"
                                                         primaryDate={data.created_timestamp}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                            />

                                            {/*Contacts*/}
                                            <ContributorsContacts title={'Contacts'} data={data.contacts} />

                                            {/*Datasets*/}
                                            <Datasets data={data.datasets} />

                                            {/*Protocols*/}
                                            {data.doi_url &&
                                                <Protocols protocol_url={data.doi_url}/>
                                            }

                                            {/*Creators*/}
                                            <ContributorsContacts title={'Creators'} data={data.creators} />
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

ViewCollection.withWrapper = function(page) { return <DerivedProvider>{ page }</DerivedProvider> }

export default ViewCollection
