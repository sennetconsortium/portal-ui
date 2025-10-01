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
import {getAncestryData, getEntityData, updateCreateDataset} from '@/lib/services'
import {cleanJson, eq, fetchEntity} from '@/components/custom/js/functions'
import AppContext from '@/context/AppContext'
import EntityContext, {EntityProvider} from '@/context/EntityContext'
import $ from 'jquery'
import GroupSelect from "@/components/custom/edit/GroupSelect";
import {valid_dataset_ancestor_config} from "@/config/config";

const AncestorIds = dynamic(() => import('@/components/custom/edit/dataset/AncestorIds'))
const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('@/components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('@/components/custom/layout/entity/FormGroup'))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const SenNetPopover = dynamic(() => import("@/components/SenNetPopover"))


export default function EditPublication() {
    const {
        isPreview, getModal, setModalDetails,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal, setShowModal,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit, getCancelBtn
    } = useContext(EntityContext)
    const {_t, cache, adminGroup, getPreviewView, toggleBusyOverlay} = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)
    const [publicationStatus, setPublicationStatus] = useState(null)

    useEffect(() => {
        // Update valid_dataset_ancestor_config to only display `Dataset` as valid ancestors
        valid_dataset_ancestor_config['searchQuery']['includeFilters'] = [{
            'type': 'term',
            'field': 'entity_type.keyword',
            'values': ['Dataset']
        }]

        const fetchData = async (uuid) => {
            log.debug('editPublication: getting data...', uuid)
            // fetch publication data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('editPublication: Got data', _data)
            if (_data.hasOwnProperty('error')) {
                setError(true)
                setData(false)
                setErrorMessage(_data['error'])
                return
            }

            // set state with the result
            setData(_data)

            getAncestryData(_data.uuid, {endpoints: ['ancestors'], otherEndpoints: ['immediate_ancestors']}).then(ancestry => {
                Object.assign(_data, ancestry)
                setData(_data)
                if (ancestry.immediate_ancestors) {
                    const uuids = ancestry.immediate_ancestors.map(ancestor => ancestor.uuid)
                    setValues(prevState => ({...prevState, direct_ancestor_uuids: uuids}))
                    fetchAncestors(uuids).catch(log.error)
                }
            }).catch(log.error)

            // Set state with default values that will be PUT to Entity API to update
            setValues(prevState => ({
                'lab_dataset_id': _data.lab_dataset_id || _data.title,
                'dataset_type': _data.dataset_type,
                'description': _data.description,
                'dataset_info': _data.dataset_info,
                'direct_ancestor_uuids': prevState.direct_ancestor_uuids || [],
                'publication_status': _data.publication_status
            }))
            setEditMode('Edit')
        }

        if (router.query.hasOwnProperty('uuid')) {
            if (eq(router.query.uuid, 'register')) {
                setData(true)
                setEditMode('Register')
            } else {
                // fetch publication data
                fetchData(router.query.uuid)
                    .catch(log.error);
            }
        } else {
            setData(null);
            setAncestors(null)
        }
    }, [router]);

    async function fetchAncestors(ancestorUuids) {
        let newAncestors = []
        if (ancestors) {
            newAncestors = [...ancestors];
        }

        const ancestorPromises = ancestorUuids.map(ancestorUuid => fetchEntity(ancestorUuid))
        const ancestorResults = await Promise.allSettled(ancestorPromises)
        for (const result of ancestorResults) {
            if (result.status !== 'fulfilled' || result.value.hasOwnProperty('error')) {
                setError(true)
                setErrorMessage(result.value['error'])
                break
            }

            // delete the ancestor if it already exists, append the new one
            const ancestor = result.value
            let idx = newAncestors.findIndex((d) => d.uuid === ancestor.uuid)
            if (idx > -1) {
                newAncestors.splice(idx, 1)
            }
            newAncestors.push(ancestor)
        }

        setAncestors(newAncestors)
    }

    const deleteAncestor = (ancestor_uuid) => {
        const old_ancestors = [...ancestors];
        log.debug(old_ancestors)
        let updated_ancestors = old_ancestors.filter(e => e.uuid !== ancestor_uuid);
        setAncestors(updated_ancestors);
        log.debug(updated_ancestors);
    }

    const modalResponse = (response) => {
        toggleBusyOverlay(false)

        setModalDetails({
            entity: cache.entities.publication,
            type: response.title,
            typeHeader: _t('Title'),
            response
        })
    }

    const handleProcessing = async () => {
        setModalProps({})
        const requestOptions = {
            method: 'PUT',
            headers: getAuthJsonHeaders(),
            body: JSON.stringify(values)
        }
        const url = getIngestEndPoint() + 'publications/' + data['uuid'] + '/submit'
        setShowModal(false)
        toggleBusyOverlay(true, <><code>Process</code> the <code>Publication</code></>)
        const response = await fetch(url, requestOptions)
        let submitResult = await response.text()
        toggleBusyOverlay(false)
        setSubmissionModal(submitResult, !response.ok)
    
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

                toggleBusyOverlay(true)

                values.issue = values.issue ? Number(values.issue) : null
                values.volume = values.volume ? Number(values.volume) : null

                values['publication_status'] = publicationStatus

                // Follow value population like HuBAMP
                // values['dataset_type'] = 'Publication'
                values['contains_human_genetic_sequences'] = false

                if (!values['group_uuid'] && editMode === 'Register') {
                    values['group_uuid'] = selectedUserWriteGroupUuid || userWriteGroups[0]?.uuid
                }

                if (isEditMode) {
                    delete values['dataset_type']
                }

                // Remove empty strings
                let json = cleanJson(values);
                let uuid = data.uuid

                await updateCreateDataset(uuid, json, editMode, 'publications')
                    .then((response) => {
                        modalResponse(response)
                    }).catch((e) => {
                        log.error(e)
                        toggleBusyOverlay(false)
                    })
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
                                    {
                                        !(userWriteGroups.length === 1 || isEditMode()) &&
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={onChange}
                                            entity_type={'dataset'}/>
                                    }

                                    {/*Ancestor IDs*/}
                                    {/*editMode is only set when page is ready to load */}
                                    {editMode &&
                                        <AncestorIds data={data} values={values} ancestors={ancestors} onChange={onChange}
                                                     fetchAncestors={fetchAncestors} deleteAncestor={deleteAncestor}/>
                                    }

                                    {/*/!*Title*!/*/}
                                    <EntityFormGroup label='Title' placeholder='The title of the publication'
                                                     controlId='title' value={data.title}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The title of the publication.</>}/>

                                    {/*/!*Venue*!/*/}
                                    <EntityFormGroup label='Venue' controlId='publication_venue'
                                                     value={data.publication_venue}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The venue of the publication, journal, conference, preprint server, etc.</>}/>

                                    <div className='row'>
                                        <div className='col-md-3'>
                                            {/*/!*Publication Date*!/*/}
                                            <EntityFormGroup label='Publication Date' controlId='publication_date'
                                                             isRequired={true}
                                                             type={'date'}
                                                             otherInputProps={{placeholder:'mm/dd/YYYY'}}
                                                             value={data.publication_date}
                                                             onChange={onChange}
                                                             popoverHelpText={<>The date of the publication.</>}/>
                                        </div>
                                    </div>

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
                                                     type='url'
                                                     value={data.publication_url}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]</>}/>

                                    {/*/!*Publication DOI*!/*/}
                                    <EntityFormGroup label='Publication DOI' controlId='publication_doi'
                                                     value={data.publication_doi}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The doi of the publication. (##.####/[alpha-numeric-string])</>}/>

                                    {/*/!*OMAP DOI*!/*/}
                                    <EntityFormGroup label='OMAP DOI' controlId='omap_doi'
                                                     value={data.omap_doi}
                                                     onChange={onChange}
                                                     popoverHelpText={<>A DOI pointing to an Organ Mapping Antibody Panel relevant to this publication</>}/>


                                    {/*/!*Issue*!/*/}
                                    <EntityFormGroup label='Issue Number' controlId='issue'
                                                     type={'number'}
                                                     value={data.issue}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The issue number of the journal that it was published in.</>}/>

                                    {/*/!*Volume*!/*/}
                                    <EntityFormGroup label='Volume Number' controlId='volume'
                                                     type={'number'}
                                                     value={data.volume}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The volume number of a journal that it was published in.</>}/>

                                    {/*/!*Pages or Article Number*!/*/}
                                    <EntityFormGroup label='Pages or Article Number' controlId='pages_or_article_num'
                                                     value={data.pages_or_article_num}
                                                     onChange={onChange}
                                                     popoverHelpText={<>The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.</>}/>


                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Abstract' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={onChange}
                                                     popoverHelpText={<>An abstract publicly available when the <code>Publication</code> is published.  This will be included with the DOI information of the published <code>Publication</code>.</>}/>



                                    <div className={'d-flex flex-row-reverse'}>

                                        {getCancelBtn('publication')}

                                        {/*
                                            If a user is a data admin and the status is either 'New' or 'Submitted' allow this Dataset to be
                                            processed via the pipeline.
                                            */}
                                        {!['Processing', 'Published'].contains(data['status'])  && adminGroup && isEditMode() && (eq(data['status'], 'New') || eq(data['status'], 'Submitted')) &&
                                            <SenNetPopover
                                                text={<>Process this <code>Publication</code> via the Ingest Pipeline.</>}
                                                className={'initiate-dataset-processing'}>
                                                <DatasetSubmissionButton
                                                    actionBtnClassName={'js-btn--process'}
                                                    btnLabel={"Process"}
                                                    modalBody={<div><p>By clicking "Process"
                                                        this <code>Publication</code> will
                                                        be processed via the Ingest Pipeline and its status set
                                                        to <span className={`${getStatusColor('QA')} badge`}>QA</span>.
                                                    </p></div>}
                                                    onClick={handleProcessing} disableSubmit={disableSubmit}/>
                                            </SenNetPopover>
                                        }

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
