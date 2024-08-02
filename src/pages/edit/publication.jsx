import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import 'bootstrap/dist/css/bootstrap.css'
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Layout} from '@elastic/react-search-ui-views'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import log from 'loglevel'
import {getAncestryData, getEntityData, update_create_entity} from '../../lib/services'
import {
    cleanJson,
    eq,
    fetchEntity,
    getRequestHeaders
} from '../../components/custom/js/functions'
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import $ from 'jquery'
import {valid_dataset_ancestor_config} from "../../config/config";

const AncestorIds = dynamic(() => import('../../components/custom/edit/dataset/AncestorIds'))
const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('../../components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('../../components/custom/layout/entity/FormGroup'))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const NotFound = dynamic(() => import("../../components/custom/NotFound"))
const SenNetPopover = dynamic(() => import("../../components/SenNetPopover"))


export default function EditPublication() {
    const {
        isPreview, getModal, setModalDetails, setSubmissionModal,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit, getCancelBtn
    } = useContext(EntityContext)
    const {_t, cache, getPreviewView} = useContext(AppContext)
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
            const _data = await getEntityData(uuid)

            log.debug('editPublication: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
            } else {
                setData(_data)
                const ancestry = await getAncestryData(_data.uuid, {otherEndpoints: ['immediate_ancestors']})
                Object.assign(_data, ancestry)
                setData(_data)

                let immediate_ancestors = []
                if (_data.hasOwnProperty("immediate_ancestors")) {
                    for (const ancestor of _data.immediate_ancestors) {
                        immediate_ancestors.push(ancestor.uuid)
                    }
                    await fetchAncestors(immediate_ancestors)
                }

                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'lab_dataset_id': _data.lab_dataset_id || _data.title,
                    'dataset_type': _data.dataset_type,
                    'description': _data.description,
                    'dataset_info': _data.dataset_info,
                    'direct_ancestor_uuids': immediate_ancestors,
                    'publication_status': _data.publication_status
                })
                setEditMode("Edit")
            }
        }

        if (router.query.hasOwnProperty("uuid")) {
            if (eq(router.query.uuid, 'register')) {
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
                log.debug("Form is valid")

                values.issue = values.issue ? Number(values.issue) : null
                values.volume = values.volume ? Number(values.volume) : null

                values['publication_status'] = publicationStatus

                // Follow value population like HuBAMP
                // values['dataset_type'] = 'Publication'
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

    // TODO: remove this return when ready to support
    return <NotFound />

    if (isPreview(error))  {
        return getPreviewView(data)
    } else {

        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Publication | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.publication} isEditMode={isEditMode()} data={data} showGroup={false}/>
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
                                                    <i className="bi bi-question-circle-fill"></i>
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

                                    {/*/!*Publication Date*!/*/}
                                    <EntityFormGroup label='Publication Date' controlId='publication_date'
                                                     isRequired={true}
                                                     type={'date'}
                                                     placeholder={'mm/dd/YYYY'}
                                                     value={data.publication_date}
                                                     onChange={onChange}
                                                     text={<>The date of the publication.</>}/>

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
                                                     text={<>An abstract publicly available when the <code>Publication</code> is published.  This will be included with the DOI information of the published <code>Publication</code>.</>}/>



                                    <div className={'d-flex flex-row-reverse'}>

                                        {getCancelBtn('publication')}

                                        { data['status'] !== 'Processing' &&
                                            <SenNetPopover text={'Save changes to this publication'} className={'save-button'}>
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
