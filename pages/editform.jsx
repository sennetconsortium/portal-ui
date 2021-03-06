import React, {useState, useEffect} from "react";
import {useRouter} from 'next/router'
import 'bootstrap/dist/css/bootstrap.css';
import Form from "../search-ui/components/core/Form";
import {useForm} from "react-hook-form";
import {FORM_FIELD_DEF} from "../config/formdefinitions";
import {Navbar, Nav, Container} from 'react-bootstrap';
import {save_update, find} from '../search-ui/lib/services';
import {uuid_query} from '../search-ui/lib/search-tools';
import {convertFacetArrayToStringArray, getUUID} from '../search-ui/lib/utils';
import {getSearchEndPoint, getAuth, APP_TITLE} from '../config/config';
import log from "loglevel";

//import useSWR from 'swr'

//const fetcher = (...args) => fetch(...args).then(res => res.json())


function EditForm() {

    const router = useRouter()
    const [whichPage, setWhichPage] = useState(0)
    const [form, setForm] = useState(FORM_FIELD_DEF)
    const [editMode, setEditMode] = useState(null)
    const [data, setData] = useState(null)
    const [uuid, setUuid] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [query, setQuery] = useState(router.query)

    // only executed on init rendering, see the []
    useEffect(() => {

        log.debug('ROUTER CHANGED: useEffect: query:', router.query.uuid)
        setQuery(router.query)

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            var myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + getAuth());
            myHeaders.append("Content-Type", "application/json");
            var requestOptions = {
                method: 'GET',
                headers: myHeaders
            }
            log.debug('editForm: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, requestOptions);
            // convert the data to json
            const data = await response.json();

            log.debug('editform: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                // set state with the result
                setData(data);
            }
        }

        if (router.query.hasOwnProperty("uuid")) {
            // call the function
            fetchData(router.query.uuid)
                // make sure to catch any error
                .catch(console.error);
            ;
        } else {
            setData({});
        }
    }, [router]);

    // effect runs when user state is updated
    useEffect(() => {
        // reset form with user data
        log.debug("editform: RESET data...")
        //reset(data);
    }, [data]);


    const onSubmit = (props) => {

        log.debug('editform: Submitted Values', props.data)

        var data = props.data
        var uuid = getUUID() // props.data["uuid"]

        data["uuid"] = uuid
        data["experimental_approach"] = convertFacetArrayToStringArray(props.data["experimental_approach"])

        log.debug('Submitted Values (after)', data)

        var ret = save_update(uuid, data, props.mode)

        log.debug(ret)
        // NEED A BETTER WAY TO TELL IF RECORD DID SAVE (FROM API)
        router.push('/search')

    };


    return (
        <div className="container">
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href="/search">
                        {APP_TITLE}
                    </Navbar.Brand>
                    <Nav className="justify-content-end">
                        <Nav.Link href="http://localhost:8484/logout">Sign-out</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            {error &&
                <div className="alert alert-warning" role="alert">{errorMessage}</div>
            }
            {data && !error &&

                <Form FORM_FIELD_DEF={form}
                      page={whichPage}
                      data={data}
                      onsubmit={onSubmit}
                      mode={editMode}
                />
            }

            {!data &&
                <div className="text-center p-3">
                    <span>Loading, please wait...</span>
                    <br></br>
                    <span className="spinner-border spinner-border-lg align-center alert alert-info"></span>
                </div>
            }
        </div>
    )
}

export default EditForm