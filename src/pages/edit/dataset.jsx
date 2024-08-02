import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import 'bootstrap/dist/css/bootstrap.css'
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Layout} from '@elastic/react-search-ui-views'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import log from 'loglevel'
import {get_headers, getAncestryData, getEntityData, update_create_dataset} from '../../lib/services'
import {
    cleanJson,
    eq,
    fetchEntity,
    fetchProtocols,
    getEntityViewUrl,
    getIsPrimaryDataset,
    getRequestHeaders,
    getStatusColor,
} from '../../components/custom/js/functions'
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import {getIngestEndPoint, valid_dataset_ancestor_config} from "../../config/config";
import $ from 'jquery'
import DatasetRevertButton, {statusRevertTooltip} from "../../components/custom/edit/dataset/DatasetRevertButton";
import DataTable from "react-data-table-component";
import AttributesUpload, {getResponseList} from "@/components/custom/edit/AttributesUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const AncestorIds = dynamic(() => import('../../components/custom/edit/dataset/AncestorIds'))
const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const DatasetSubmissionButton = dynamic(() => import("../../components/custom/edit/dataset/DatasetSubmissionButton"))
const DatasetType = dynamic(() => import('../../components/custom/edit/dataset/DatasetType'))
const EntityHeader = dynamic(() => import('../../components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('../../components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("../../components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const SenNetPopover = dynamic(() => import("../../components/SenNetPopover"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

export default function EditDataset() {
    const {
        isPreview, getModal, setModalDetails, setSubmissionModal, setCheckDoiModal,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal, setShowModal,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit,
        dataAccessPublic, setDataAccessPublic,
        getEntityConstraints,
        getSampleEntityConstraints,
        buildConstraint, successIcon, errIcon, getCancelBtn,
        isAdminOrHasValue, getAssignedToGroupNames,
        contactsTSV, contacts, setContacts, creators, setCreators, setContactsAttributes, setContactsAttributesOnFail
    } = useContext(EntityContext)
    const {_t, cache, adminGroup, isLoggedIn, getBusyOverlay, toggleBusyOverlay, getPreviewView} = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)
    const [containsHumanGeneticSequences, setContainsHumanGeneticSequences] = useState(null)
    const [dataTypes, setDataTypes] = useState(null)
    const isPrimary = useRef(false)


    useEffect(() => {
        async function fetchAncestorConstraints() {
            const fullBody = [
                {
                    descendants: [{
                        entity_type: cache.entities.dataset
                    }]
                }
            ]

            const response = await getEntityConstraints(fullBody, {order: 'descendants', filter: 'search'})
            if (response.ok) {
                const body = await response.json()
                valid_dataset_ancestor_config['searchQuery']['includeFilters'] = body.description[0].description
            }
        }

        fetchAncestorConstraints()
    }, [])

    useEffect(() => {
        const fetchDataTypes = async () => {
            setDataTypes(null)
            if (ancestors !== null && ancestors.length !== 0) {
                let constraints = []
                for (let ancestor of ancestors) {
                    constraints = buildConstraint(ancestor, constraints)
                }
                const response = await getEntityConstraints(constraints)
                let constraintsDataTypes = {}
                if (response.ok) {
                    const body = await response.json()
                    for (let constraintResponse of body.description) {
                        let currentConstraints = constraintResponse.description

                        let sub_types = []
                        currentConstraints.forEach(constraint => {
                            if (eq(constraint.entity_type, cache.entities.dataset)) {
                                sub_types = sub_types.concat(constraint.sub_type || [])
                            }
                        })
                    } // end for
                    if (!$.isEmptyObject(constraintsDataTypes)) {
                        setDataTypes(constraintsDataTypes)
                    }
                }
            }
        }
        fetchDataTypes()
    }, [ancestors])

    // Disable all form elements if data_access_level is "public"
    // Wait until "dataTypes" and "editMode" are set prior to running this
    useEffect(() => {
        if (data != null && isLoggedIn()) {
            if (dataAccessPublic === true || data.status === 'Published') {
                const form = document.getElementById("dataset-form");
                const elements = form?.elements;
                for (let i = 0, len = elements?.length; i < len; ++i) {
                    elements[i].setAttribute('disabled', true);
                }
            }
        }
    }, [dataAccessPublic, data, dataTypes, editMode])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editDataset: getting data...', uuid)
            // get the data from the api
            const _data = await getEntityData(uuid)

            log.debug('editDataset: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
            } else {
                setData(_data)
                const ancestry = await getAncestryData(_data.uuid, {otherEndpoints: ['immediate_ancestors']})
                Object.assign(_data, ancestry)
                setData(_data)

                isPrimary.current = getIsPrimaryDataset(_data)
                let immediate_ancestors = []
                if (_data.hasOwnProperty("immediate_ancestors")) {
                    for (const ancestor of _data.immediate_ancestors) {
                        immediate_ancestors.push(ancestor.uuid)
                    }
                    await fetchAncestors(immediate_ancestors)
                }

                if (_data.contacts) {
                    setContacts({description: {records: _data.contacts, headers: contactsTSV.headers}})
                }

                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'status': _data.status,
                    'lab_dataset_id': _data.lab_dataset_id,
                    'dataset_type': _data.dataset_type,
                    'description': _data.description,
                    'dataset_info': _data.dataset_info,
                    'direct_ancestor_uuids': immediate_ancestors,
                    'assigned_to_group_name': adminGroup ? _data.assigned_to_group_name : undefined,
                    'ingest_task': adminGroup ? _data.ingest_task : undefined,
                    'contains_human_genetic_sequences': _data.contains_human_genetic_sequences,
                    'contacts': _data.contacts,
                    'contributors': _data.contributors
                })
                setEditMode("Edit")
                setContainsHumanGeneticSequences(_data.contains_human_genetic_sequences)
                setDataAccessPublic(_data.data_access_level === 'public')
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

    const modalResponse = (response) => {
        toggleBusyOverlay(false)
        setValues({...values, status: response.status})
        setModalDetails({
            entity: cache.entities.dataset,
            type: (response.dataset_type ? response.dataset_type : null),
            typeHeader: _t('Dataset Type'),
            response
        })
    }

    const handleRevert = async () => {
        const json = {
            status: values.status,
            contributors: [],
            pipeline_message: "",
            ingest_id: "",
            run_id: ""
        }
        toggleBusyOverlay(true, <><code>Revert</code> the <code>Dataset</code></>)
        await update_create_dataset(data.uuid, json, editMode).then((response) => {
            modalResponse(response)
        }).catch((e) => log.error(e))
    }

    const checkDoi = async () => {
        try {
            setDisableSubmit(true)
            setCheckDoiModal(<span className={'text-center p-3 spinner-wrapper'}><Spinner text={''}/></span>)
            let i = 0
            let results = []
            let allValid = true
            let apiResult
            let viewResult
            let uri
            for (const ancestor of data.ancestors) {
                if (eq(ancestor.entity_type, cache.entities.source) || eq(ancestor.entity_type, cache.entities.sample)) {
                    uri = ancestor.protocol_url
                    apiResult = await fetchProtocols(uri)
                    if (!apiResult) {
                        allValid = false
                    }
                    let icon = apiResult ? successIcon() : errIcon()
                    results.push(<span key={`doi-check-${i}`}>{icon} <a
                        href={getEntityViewUrl(ancestor.entity_type, ancestor.uuid, {isEdit: true})}
                        target='_blank'>{ancestor.sennet_id}</a>  <br/></span>)
                    i++
                }
            }
            if (!allValid) {
                results.push(<p key={`doi-check-msg`}><br/>Not all DOI URLs are valid. Please click on the failed SenNet
                    IDs from the list above to correct. Then return to this form and submit again for processing. </p>)
            } else {
                setShowModal(false)
            }
            setDisableSubmit(false)
            setCheckDoiModal(results)
            return allValid
        } catch (e) {
            log.error(e)
        }
    }

    const handleSubmit = async () => {
        const json = {
            status: 'Submitted'
        }
        await update_create_dataset(data.uuid, json, editMode).then((response) => {
            modalResponse(response)
        }).catch((e) => log.error(e))
    }

    const handleProcessing = async () => {
        let result = await checkDoi()
        if (result) {
            const requestOptions = {
                method: 'PUT',
                headers: get_headers(),
                body: JSON.stringify(values)
            }
            const submitDatasetUrl = getIngestEndPoint() + 'datasets/' + data['uuid'] + '/submit'
            setShowModal(false)
            toggleBusyOverlay(true, <><code>Process</code> the <code>Dataset</code></>)
            const response = await fetch(submitDatasetUrl, requestOptions)
            let submitResult = await response.text()
            toggleBusyOverlay(false)
            setSubmissionModal(submitResult, !response.ok)
        }

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

                const assignedToGroupName = values['assigned_to_group_name']
                const ingestTask = values['ingest_task']
                values['contains_human_genetic_sequences'] = containsHumanGeneticSequences
                if (values['group_uuid'] === null && editMode === 'Register') {
                    values['group_uuid'] = selectedUserWriteGroupUuid
                }

                if (adminGroup && !_.isEmpty(creators) && creators.description.records) {
                    values['contributors'] = creators.description.records
                    values['contacts'] = contacts.description.records
                }

                // Remove empty strings
                let json = cleanJson({...values});
                let uuid = data.uuid

                if (adminGroup && assignedToGroupName?.isEmpty()) {
                    json['assigned_to_group_name'] = ''
                }

                if (adminGroup && ingestTask?.isEmpty()) {
                    json['ingest_task'] = ''
                }

                // Remove 'status' from values. Not a field to pass to Entity API for a normal update of Dataset
                delete json['status']

                // Temporarily disable
                // If dataset is not `primary` then don't send direct_ancestor_uuids
                // if (data.dataset_category !== 'primary') {
                //     delete json['direct_ancestor_uuids']
                // }

                await update_create_dataset(uuid, json, editMode).then((response) => {
                    modalResponse(response)
                }).catch((e) => log.error(e))
            }
        }


        setValidated(true);
    };

    function handleContainsHumanGeneticSequencesYes() {
        setContainsHumanGeneticSequences(true)
    }

    function handleContainsHumanGeneticSequencesNo() {
        setContainsHumanGeneticSequences(false)
    }


    if (isPreview(error))  {
        return getPreviewView(data)
    } else {

        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Dataset | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.dataset} isEditMode={isEditMode()} data={data}
                                              values={values} adminGroup={adminGroup}/>
                            }
                            bodyContent={
                                <Form noValidate validated={validated} id="dataset-form">
                                    {/*Group select*/}
                                    {
                                        !(userWriteGroups.length === 1 || isEditMode()) &&
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={onChange}
                                            entity_type={'dataset'}/>
                                    }
                                    {
                                        isAdminOrHasValue(adminGroup, 'assigned_to_group_name') && isEditMode() &&
                                        <GroupSelect
                                            optionValueProp={'displayname'}
                                            isDisabled={!adminGroup}
                                            title={'Assigned to Group Name'}
                                            required={false}
                                            controlId={'assigned_to_group_name'}
                                            popover={<>The group responsible for the next step in the data ingest
                                                process.</>}
                                            data={data}
                                            value={data.assigned_to_group_name}
                                            groups={getAssignedToGroupNames(adminGroup)}
                                            onGroupSelectChange={onChange}
                                            entity_type={'dataset'}/>
                                    }

                                    {/*/!*Ingest*!/*/}
                                    {isEditMode() && isAdminOrHasValue(adminGroup, 'ingest_task') &&
                                        <EntityFormGroup label='Ingest Task'
                                                         isDisabled={!adminGroup}
                                                         type={'textarea'}
                                                         controlId='ingest_task' value={data.ingest_task}
                                                         onChange={onChange}
                                                         text={<>The next task in the data ingest process.</>}/>}

                                    {/*Ancestor IDs*/}
                                    {/*editMode is only set when page is ready to load */}
                                    {editMode &&
                                        <AncestorIds data={data} values={values} ancestors={ancestors} onChange={onChange}
                                                     dataset_category={data.dataset_category}
                                                     fetchAncestors={fetchAncestors} deleteAncestor={deleteAncestor}
                                                     addButtonDisabled={data.dataset_category != null && data.dataset_category !== 'primary' }/>
                                    }

                                    {/*/!*Lab Name or ID*!/*/}
                                    <EntityFormGroup label='Lab Name or ID'
                                                     placeholder='A non-PHI ID or deidentified name used by the lab when referring to the dataset'
                                                     controlId='lab_dataset_id' value={data.lab_dataset_id}
                                                     onChange={onChange}
                                                     text={<>An identifier used internally by the lab to identify
                                                         the <code>Dataset</code>. This can be useful for lab members to
                                                         identify and look-up Datasets.</>}/>

                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='DOI Abstract' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={onChange}
                                                     text={<>An abstract publicly available when
                                                         the <code>Dataset</code> is published. This will be included
                                                         with the DOI information of the
                                                         published <code>Dataset</code>.</>}/>

                                    {/*/!*Additional Information*!/*/}
                                    <EntityFormGroup label='Lab Notes' type='textarea'
                                                     controlId='dataset_info' value={data.dataset_info}
                                                     onChange={onChange}
                                                     text={<>Free text field to enter a description of
                                                         the <code>Dataset</code>.</>}/>


                                    {/*/!*Human Gene Sequences*!/*/}
                                    {editMode &&
                                        <Form.Group controlId="contains_human_genetic_sequences" className="mb-3">
                                            <Form.Label>{_t('Human Gene Sequences')} <span
                                                className="required">* </span>
                                                <SenNetPopover className={'contains_human_genetic_sequences'}
                                                               text={'Does this data contain any human genetic sequences?'}>
                                                    <i className="bi bi-question-circle-fill"></i>
                                                </SenNetPopover>

                                            </Form.Label>
                                            <div
                                                className="mb-2 text-muted">{_t('Does this data contain any human genetic sequences?')}
                                            </div>
                                            <div hidden={isEditMode() ? true : false}
                                                 className="mb-2 text-muted">{_t('This can not be altered after entity has been created.')}
                                            </div>
                                            <Form.Check
                                                required
                                                type="radio"
                                                label="No"
                                                name="contains_human_genetic_sequences"
                                                value={false}
                                                disabled={isEditMode() ? true : false}
                                                defaultChecked={(data.contains_human_genetic_sequences === false && isEditMode()) ? true : false}
                                                onChange={handleContainsHumanGeneticSequencesNo}
                                            />
                                            <Form.Check
                                                required
                                                type="radio"
                                                label="Yes"
                                                name="contains_human_genetic_sequences"
                                                value={true}
                                                disabled={isEditMode() ? true : false}
                                                defaultChecked={data.contains_human_genetic_sequences ? true : false}
                                                onChange={handleContainsHumanGeneticSequencesYes}
                                            />
                                        </Form.Group>
                                    }

                                    {/*/!*Data Types*!/*/}
                                    {editMode &&
                                        <DatasetType
                                            datasetTypes={dataTypes === null ? Object.values(cache.datasetTypes) : dataTypes}
                                            values={values} data={data} onChange={onChange}/>
                                    }

                                    {adminGroup && <AttributesUpload ingestEndpoint={contactsTSV.uploadEndpoint} showAllInTable={true}
                                                      setAttribute={setContactsAttributes}
                                                      setAttributesOnFail={setContactsAttributesOnFail}
                                                      entity={cache.entities.dataset} excludeColumns={contactsTSV.excludeColumns}
                                                      attribute={'Contributors'} title={<h6>Contributors</h6>}
                                                      customFileInfo={<span><a
                                                          className='btn btn-outline-primary rounded-0 fs-8' download
                                                          href={'https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv'}> <FileDownloadIcon/>EXAMPLE.TSV</a></span>}/>}

                                    {/*This table is just for showing data.creators list in edit mode. Regular table from AttributesUpload will show if user uploads new file*/}
                                    {isEditMode && !creators.description && data.contributors &&
                                        <div className='c-metadataUpload__table table-responsive'>
                                            <h6>Contributors</h6>
                                            <DataTable
                                                columns={getResponseList({headers: contactsTSV.headers}, contactsTSV.excludeColumns).columns}
                                                data={data.contributors}
                                                pagination/>
                                        </div>}

                                    {/*When a user uploads a file, the is_contact property is used to determine contacts, on edit mode, this just displays list from data.contacts*/}
                                    {contacts && contacts.description &&
                                        <div className='c-metadataUpload__table table-responsive'>
                                            <h6>Contacts</h6>
                                            <DataTable
                                                columns={getResponseList(contacts, contactsTSV.excludeColumns).columns}
                                                data={contacts.description.records}
                                                pagination/>
                                        </div>}

                                    <div className={'d-flex flex-row-reverse'}>

                                        {getCancelBtn('dataset')}

                                        {!eq(data['status'], 'Processing') &&
                                            <SenNetPopover text={<>Save changes to this <code>Dataset</code>.</>}
                                                           className={'save-button'}>
                                                <Button variant="outline-primary rounded-0 js-btn--save"
                                                        className={'me-2'}
                                                        onClick={handleSave}
                                                        disabled={disableSubmit}>
                                                    {_t('Save')}
                                                </Button>
                                            </SenNetPopover>
                                        }

                                        {/*If the status for the Dataset is 'New' then allow the user to mark this as 'Submitted'*/}
                                        {!eq(data['status'], 'Processing') && isPrimary.current && isEditMode() && eq(data['status'], 'New') &&
                                            <SenNetPopover
                                                text={<>Mark this <code>Dataset</code> as "Submitted" and ready for
                                                    processing.</>} className={'initiate-dataset-submission'}>
                                                <DatasetSubmissionButton
                                                    btnLabel={"Submit"}
                                                    modalBody={<div><p>By clicking "Submit"
                                                        this <code>Dataset</code> will
                                                        have its status set to
                                                        <span className={`${getStatusColor('Submitted')} badge`}>
                                                        Submitted</span> and
                                                        be ready for processing.</p>
                                                        <p>
                                                            Before submitting your Dataset please confirm that all files
                                                            (including metadata/contributors TSVs) have been uploaded in
                                                            Globus.
                                                        </p>
                                                    </div>}
                                                    onClick={handleSubmit} disableSubmit={disableSubmit}/>
                                            </SenNetPopover>
                                        }

                                        {/*
                                         If a user is a data admin and the status is either 'New' or 'Submitted' allow this Dataset to be
                                         processed via the pipeline.
                                         */}
                                        {!eq(data['status'], 'Processing') && isPrimary.current && adminGroup && isEditMode() && (eq(data['status'], 'New') || eq(data['status'], 'Submitted')) &&
                                            <SenNetPopover
                                                text={<>Process this <code>Dataset</code> via the Ingest Pipeline.</>}
                                                className={'initiate-dataset-processing'}>
                                                <DatasetSubmissionButton
                                                    actionBtnClassName={'js-btn--process'}
                                                    btnLabel={"Process"}
                                                    modalBody={<div><p>By clicking "Process"
                                                        this <code>Dataset</code> will
                                                        be processed via the Ingest Pipeline and its status set
                                                        to <span className={`${getStatusColor('QA')} badge`}>QA</span>.
                                                    </p></div>}
                                                    onClick={handleProcessing} disableSubmit={disableSubmit}/>
                                            </SenNetPopover>
                                        }

                                        {!['Processing', 'Published', 'Reorganized'].contains(data['status']) && isPrimary.current && adminGroup && isEditMode() &&
                                            <SenNetPopover
                                                text={statusRevertTooltip(cache.entities.dataset)}
                                                className={'initiate-dataset-status-change'}>
                                                <DatasetRevertButton data={data} onClick={handleRevert}
                                                                     disableSubmit={disableSubmit}
                                                                     onStatusChange={onChange}/>
                                            </SenNetPopover>
                                        }
                                    </div>
                                    {getModal()}
                                    {getBusyOverlay()}
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

EditDataset.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}
