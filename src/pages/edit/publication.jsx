import React, {useContext, useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import 'bootstrap/dist/css/bootstrap.css'
import {Button, Form} from 'react-bootstrap'
import {Layout} from '@elastic/react-search-ui-views'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import {QuestionCircleFill} from 'react-bootstrap-icons'
import log from 'loglevel'
import {get_headers, update_create_dataset, update_create_entity} from '../../lib/services'
import {
    cleanJson,
    equals,
    fetchEntity,
    getDataTypesByProperty,
    getHeaders,
    getRequestHeaders
} from '../../components/custom/js/functions'
import AppNavbar from '../../components/custom/layout/AppNavbar'
import AncestorIds from '../../components/custom/edit/dataset/AncestorIds'
import Unauthorized from '../../components/custom/layout/Unauthorized'
import AppFooter from '../../components/custom/layout/AppFooter'
import Header from '../../components/custom/layout/Header'

import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import Spinner from '../../components/custom/Spinner'
import EntityHeader from '../../components/custom/layout/entity/Header'
import EntityFormGroup from '../../components/custom/layout/entity/FormGroup'
import Alert from 'react-bootstrap/Alert';
import $ from 'jquery'
import SenNetPopover from "../../components/SenNetPopover"
import {valid_dataset_ancestor_config} from "../../config/config";

export default function EditPublication() {
    const {
        isUnauthorized, isAuthorizing, getModal, setModalDetails, setSubmissionModal,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit,
    } = useContext(EntityContext)
    const {_t, cache} = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)
    const [publicationStatus, setPublicationStatus] = useState(null)

    useEffect(() => {
        valid_dataset_ancestor_config['searchQuery']['includeFilters'] = [
            {
                "keyword": "entity_type.keyword",
                "value": "Dataset"
            }]
    }, [])


    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editPublication: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, getRequestHeaders());
            // convert the data to json
            const data = await response.json();

            log.debug('editPublication: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                setData(data);

                let immediate_ancestors = []
                if (data.hasOwnProperty("immediate_ancestors")) {
                    for (const ancestor of data.immediate_ancestors) {
                        immediate_ancestors.push(ancestor.uuid)
                    }
                    await fetchAncestors(immediate_ancestors)
                }

                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'lab_dataset_id': data.lab_dataset_id || data.title,
                    'data_types': [data.data_types[0]],
                    'description': data.description,
                    'dataset_info': data.dataset_info,
                    'direct_ancestor_uuids': immediate_ancestors,
                    'publication_status': data.publication_status
                })
                setEditMode("Edit")
            }
        }

        if (router.query.hasOwnProperty("uuid")) {
            if (equals(router.query.uuid, 'register')) {
                setData(true)
                setEditMode("Register")
            } else {
                // call the function
                fetchData(router.query.uuid)
                    // make sure to catch any error
                    .catch(console.error);
            }
        } else {
            setData(null);
            setAncestors(null)
        }
    }, [router]);

    async function fetchAncestors(ancestor_uuids) {
        let new_ancestors = []
        if (ancestors) {
            new_ancestors = [...ancestors];
        }

        for (const ancestor_uuid of ancestor_uuids) {
            let ancestor = await fetchEntity(ancestor_uuid);
            if (ancestor.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(ancestor["error"])
            } else {
                new_ancestors.push(ancestor)
            }
        }
        setAncestors(new_ancestors)
    }

    const deleteAncestor = (ancestor_uuid) => {
        const old_ancestors = [...ancestors];
        log.debug(old_ancestors)
        let updated_ancestors = old_ancestors.filter(e => e.uuid !== ancestor_uuid);
        setAncestors(updated_ancestors);
        log.debug(updated_ancestors);
    }

    const handleSave = async (event) => {
        setDisableSubmit(true);
        const form = $(event.currentTarget.form)[0]
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            log.debug("Form is invalid")
            setDisableSubmit(false);
        } else {

            event.preventDefault();
            if (values['direct_ancestor_uuids'] === undefined || values['direct_ancestor_uuids'].length === 0) {
                event.stopPropagation();
                setDisableSubmit(false);
            } else {
                debugger
                log.debug("Form is valid")

                values.issue = values.issue ? Number(values.issue) : null
                values.volume = values.volume ? Number(values.volume) : null

                values['publication_status'] = publicationStatus

                // Follow value population like HuBAMP
                values['data_types'] = ['publication']
                values['contains_human_genetic_sequences'] = false

                if (!values['group_uuid'] && editMode === 'Register') {

                    values['group_uuid'] = selectedUserWriteGroupUuid || userWriteGroups[0]?.uuid
                }
                // Remove empty strings
                let json = cleanJson(values);
                let uuid = data.uuid

                await update_create_entity(uuid, json, editMode, cache.entities.publication).then((response) => {
                    setModalDetails({
                        entity: cache.entities.publication,
                        type: response.title,
                        typeHeader: _t('Title'),
                        response
                    })
                }).catch((e) => log.error(e))
            }
        }


        setValidated(true);
    };

    function handlePublicationStatusYes() {
        setPublicationStatus(true)
    }

    function handlePublicationStatusNo() {
        setPublicationStatus(false)
    }

    if (isAuthorizing() || isUnauthorized()) {
        return (
            isUnauthorized() ? <Unauthorized/> : <Spinner/>
        )
    } else {

        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Publication | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <Alert variant='warning'>{_t(errorMessage)}</Alert>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.publication} isEditMode={isEditMode()} data={data}/>
                            }
                            bodyContent={
                                <Form noValidate validated={validated}>
                                    {/*Group select*/}


                                    {/*Ancestor IDs*/}
                                    {/*editMode is only set when page is ready to load */}
                                    {editMode &&
                                        <AncestorIds values={values} ancestors={ancestors} onChange={onChange}
                                                     fetchAncestors={fetchAncestors} deleteAncestor={deleteAncestor}/>
                                    }

                                    {/*/!*Title*!/*/}
                                    <EntityFormGroup label='Title' placeholder='The title of the publication'
                                                     controlId='title' value={data.title}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     text={<>The title of the publication.</>}/>

                                    {/*/!*Venue*!/*/}
                                    <EntityFormGroup label='Venue' controlId='publication_venue'
                                                     value={data.publication_venue}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     text={<>The venue of the publication, journal, conference, preprint server, etc.</>}/>

                                    {/*/!*Human Gene Sequences*!/*/}
                                    {editMode &&
                                        <Form.Group controlId="publication_status" className="mb-3">
                                            <Form.Label>{_t('Publication Status')} <span
                                                className="required">* </span>
                                                <SenNetPopover className={'publication_status'} text={'Has this Publication been Published?'}>
                                                    <QuestionCircleFill/>
                                                </SenNetPopover>

                                            </Form.Label>
                                            <div
                                                className="mb-2 text-muted">{_t('Has this Publication been Published?')}
                                            </div>
                                            <Form.Check
                                                required
                                                type="radio"
                                                label="No"
                                                name="publication_status"
                                                value={false}
                                                defaultChecked={(data.publication_status === false)}
                                                onChange={handlePublicationStatusNo}
                                            />
                                            <Form.Check
                                                required
                                                type="radio"
                                                label="Yes"
                                                name="publication_status"
                                                value={true}
                                                defaultChecked={data.publication_status}
                                                onChange={handlePublicationStatusYes}
                                            />
                                        </Form.Group>
                                    }

                                    {/*/!*Publication URL*!/*/}
                                    <EntityFormGroup label='Publication URL' controlId='publication_url'
                                                     value={data.publication_url}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     text={<>The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]</>}/>

                                    {/*/!*Publication DOI*!/*/}
                                    <EntityFormGroup label='Publication DOI' controlId='publication_doi'
                                                     value={data.publication_doi}
                                                     onChange={onChange}
                                                     text={<>The doi of the publication. (##.####/[alpha-numeric-string])</>}/>

                                    {/*/!*Issue*!/*/}
                                    <EntityFormGroup label='Issue Number' controlId='issue'
                                                     type={'number'}
                                                     value={data.issue}
                                                     onChange={onChange}
                                                     text={<>The issue number of the journal that it was published in.</>}/>

                                    {/*/!*Volume*!/*/}
                                    <EntityFormGroup label='Volume Number' controlId='volume'
                                                     type={'number'}
                                                     value={data.volume}
                                                     onChange={onChange}
                                                     text={<>The volume number of a journal that it was published in.</>}/>

                                    {/*/!*Pages or Article Number*!/*/}
                                    <EntityFormGroup label='Pages or Article Number' controlId='pages_or_article_num'
                                                     value={data.pages_or_article_num}
                                                     onChange={onChange}
                                                     text={<>The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.</>}/>


                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='DOI Abstract' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={onChange}
                                                     text={<>Free text description of the publication.</>}/>



                                    <div className={'d-flex flex-row-reverse'}>

                                        { data['status'] !== 'Processing' &&
                                            <SenNetPopover text={'Save changes to this dataset'} className={'save-button'}>
                                                <Button variant="outline-primary rounded-0 js-btn--save"
                                                        className={'me-2'}
                                                        onClick={handleSave}
                                                        disabled={disableSubmit}>
                                                    {_t('Save')}
                                                </Button>
                                            </SenNetPopover>
                                        }
                                    </div>
                                    {getModal()}
                                </Form>
                            }
                        />
                    </div>
                }
                {!showModal && <AppFooter/>}
            </>
        )
    }
}

EditPublication.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}
