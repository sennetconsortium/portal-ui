import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import {BoxArrowUpRight, CircleFill, List} from 'react-bootstrap-icons';
import Description from "../components/custom/entities/sample/Description";
import Attribution from "../components/custom/entities/sample/Attribution";
import log from "loglevel";
import {getOrganTypeFullName, getRequestHeaders, getStatusColor} from "../components/custom/js/functions";
import AppNavbar from "../components/custom/layout/AppNavbar";
import {get_write_privilege_for_group_uuid} from "../lib/services";
import Unauthorized from "../components/custom/layout/Unauthorized";
import AppFooter from "../components/custom/layout/AppFooter";
import Header from "../components/custom/layout/Header";
import Files from "../components/custom/entities/dataset/Files";
import Spinner from "../components/custom/Spinner";
import AppContext from "../context/AppContext";
import Alert from "../components/custom/Alert";
import Provenance from "../components/custom/entities/Provenance";
import {ENTITIES} from "../config/constants";
import Metadata from "../components/custom/entities/sample/Metadata";
import Contributors from "../components/custom/entities/dataset/Contributors";
import {EntityViewHeaderButtons} from "../components/custom/layout/entity/ViewHeader";


function ViewDataset() {
    const router = useRouter()
    const [data, setData] = useState(null)
    const [ancestors, setAncestors] = useState(null)
    const [descendants, setDescendants] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [hasWritePrivilege, setHasWritePrivilege] = useState(false)

    const {isRegisterHidden, isLoggedIn, isUnauthorized, isAuthorizing} = useContext(AppContext)

    // only executed on init rendering, see the []
    useEffect(() => {
        // declare the async data fetching function
        const fetchData = async (uuid) => {


            log.debug('dataset: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, getRequestHeaders());
            // convert the data to json
            const data = await response.json();

            log.debug('dataset: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
                setData(false)
            } else {
                // set state with the result
                setData(data);
                get_write_privilege_for_group_uuid(data.group_uuid).then(response => {
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

    if ((isAuthorizing() || isUnauthorized()) && !data) {
        return (
            data == null ? <Spinner/> : <Unauthorized/>
        )
    } else {
        return (
            <>
                {data && <Header title={`${data.sennet_id} | Dataset | SenNet`}></Header>}

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>

                {error &&
                    <Alert message={errorMessage}/>
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
                                                <a href="#Provenance"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Provenance</a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="#Files"
                                                   className="nav-link"
                                                   data-bs-parent="#sidebar">Files</a>
                                            </li>

                                            {!!(data.metadata && Object.keys(data.metadata).length && 'metadata' in data.metadata) &&
                                                <li className="nav-item">
                                                    <a href="#Metadata"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Metadata</a>
                                                </li>
                                            }

                                            {!!(data.contributors && Object.keys(data.contributors).length) &&
                                                <li className="nav-item">
                                                    <a href="#Contributors"
                                                       className="nav-link"
                                                       data-bs-parent="#sidebar">Contributors</a>
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

                                <main className="col m-md-3">
                                    <div className="d-none d-md-block sticky-top" id="sections-button">
                                        <a href="#" data-bs-target="#sidebar" data-bs-toggle="collapse"
                                           className="btn btn-outline-primary rounded-0 link_with_icon mb-2"><List/></a>
                                    </div>

                                    <div style={{width: '100%'}}>
                                        <h4>Dataset</h4>
                                        <h3>{data.sennet_id}</h3>

                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="entity_subtitle link_with_icon">
                                                {data.data_types &&
                                                    <>
                                                        {data.data_types[0]}
                                                    </>
                                                }
                                                {data.lab_dataset_id &&
                                                    <>
                                                        <span className="mx-2">|</span>
                                                        {getOrganTypeFullName(data.origin_sample.organ)}
                                                    </>
                                                }

                                                {data.doi_url &&
                                                    <>
                                                        |
                                                        <a href={data.doi_url} className="ms-1 link_with_icon">
                                                            <span className="me-1">doi:{data.registered_doi}</span>
                                                            <BoxArrowUpRight/>
                                                        </a>
                                                    </>
                                                }
                                            </div>
                                            <div className="entity_subtitle link_with_icon">
                                                <CircleFill
                                                    className={`me-1 text-${getStatusColor(data.status)}`}/>
                                                <div className={'m-2'}>{data.status}</div>
                                                |
                                                {/*TODO: Add some access level?  | {data.mapped_data_access_level} Access*/}

                                                <EntityViewHeaderButtons data={data} entity={Object.keys(ENTITIES)[2]}
                                                                         hasWritePrivilege={hasWritePrivilege}/>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="row">
                                        <div className="col-12">
                                            {/*Description*/}
                                            <Description primaryDateTitle="Publication Date"
                                                         primaryDate={data.published_timestamp}
                                                         secondaryDateTitle="Modification Date"
                                                         secondaryDate={data.last_modified_timestamp}
                                                         data={data}/>

                                            {/*Provenance*/}
                                            {data &&
                                                <Provenance nodeData={data}/>
                                            }

                                            {/*Files*/}
                                            <Files sennet_id={data.sennet_id}/>


                                            {/*Metadata*/}
                                            {!!(data.metadata && Object.keys(data.metadata).length && 'metadata' in data.metadata) &&
                                                <Metadata data={data.metadata.metadata} filename={data.sennet_id}/>
                                            }

                                            {/*Contributors*/}
                                            {!!(data.contributors && Object.keys(data.contributors).length) &&
                                                <Contributors data={data.contributors}/>
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


export default ViewDataset