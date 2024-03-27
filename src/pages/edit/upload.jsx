import React, {useContext, useEffect, useState} from "react";
import {useRouter} from 'next/router';
import {Alert, Button, Form} from 'react-bootstrap';
import {Layout} from "@elastic/react-search-ui-views";
import log from "loglevel";
import {cleanJson, eq, getRequestHeaders, getStatusColor} from "../../components/custom/js/functions";
import AppNavbar from "../../components/custom/layout/AppNavbar";
import {update_create_dataset} from "../../lib/services";
import Unauthorized from "../../components/custom/layout/Unauthorized";
import AppFooter from "../../components/custom/layout/AppFooter";
import GroupSelect from "../../components/custom/edit/GroupSelect";
import Header from "../../components/custom/layout/Header";
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import Spinner from '../../components/custom/Spinner'
import EntityHeader from '../../components/custom/layout/entity/Header'
import EntityFormGroup from '../../components/custom/layout/entity/FormGroup'
import SenNetPopover from "../../components/SenNetPopover";
import $ from "jquery";
import DatasetSubmissionButton from "../../components/custom/edit/dataset/DatasetSubmissionButton";
import DatasetRevertButton, {statusRevertTooltip} from "../../components/custom/edit/dataset/DatasetRevertButton";
import SenNetAlert from "../../components/SenNetAlert";


function EditUpload() {
    const {
        isUnauthorized, isAuthorizing, getModal, setModalDetails,
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
        dataAccessPublic, setDataAccessPublic,
        getCancelBtn
    } = useContext(EntityContext)
    const {_t, cache, adminGroup, getBusyOverlay, toggleBusyOverlay} = useContext(AppContext)

    const router = useRouter()
    const [source, setSource] = useState(null)


    // Disable all form elements if data_access_level is "public"
    // Wait until "sampleCategories" and "editMode" are set prior to running this
    useEffect(() => {
        if (dataAccessPublic === true) {
            const form = document.getElementById("upload-form");
            const elements = form?.elements;
            for (let i = 0, len = elements?.length; i < len; ++i) {
                elements[i].setAttribute('disabled', true);
            }
        }
    }, [dataAccessPublic, editMode])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editUpload: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, getRequestHeaders());
            // convert the data to json
            const data = await response.json();

            log.debug('editUpload: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                setData(data);

                // Set state with default values that will be PUT to Entity API to update
                let _values = {
                    'title': data.title,
                    'ingest_task': adminGroup ? data.ingest_task : undefined,
                    'description': data.description,
                    'assigned_to_group_name': adminGroup ? data.assigned_to_group_name : undefined,
                    'status': data.status,
                }

                setValues(_values)
                setEditMode("Edit")
                setDataAccessPublic(data.data_access_level === 'public')
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
            setSource(null)
        }
    }, [router]);

    const modalResponse = (response) => {
        setValues({...values, status: response.status})
        setModalDetails({
            entity: cache.entities.upload,
            type: response.status,
            typeHeader: _t('Status'),
            response
        })
    }

    const handlePut = async (action, body = {}) => {
        await update_create_dataset(data.uuid, body, action, 'uploads').then((response) => {
            toggleBusyOverlay(false)
            modalResponse(response)
        }).catch((e) => log.error(e))
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
            log.debug("Form is valid")

            if (values['group_uuid'] === null && !isEditMode()) {
                values['group_uuid'] = selectedUserWriteGroupUuid
            }

            // Remove empty strings
            let json = cleanJson(values);

            handlePut(editMode, json)
        }

        setValidated(true);
    };

    const handleValidate = () => {
        toggleBusyOverlay(true, <><code>Validate</code> the <code>Upload</code></>)
        handlePut('validate')
    }

    const handleRevert = async () => {
        const json = {
            status: values.status,
            validation_message: "",
        }
        handlePut(editMode, json)
    }

    const handleSubmit = () => {
        handlePut('submit')
    }

    const handleReorganize = () => {
        toggleBusyOverlay(true, <><code>Reorganize</code> the <code>Upload</code></>)
        handlePut('reorganize')
    }

    if (isAuthorizing() || isUnauthorized()) {
        return (
            isUnauthorized() ? <Unauthorized/> : <Spinner/>
        )
    } else {
        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Upload | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader adminGroup={adminGroup} entity={cache.entities.upload}
                                              isEditMode={isEditMode()} data={data} values={values}/>
                            }
                            bodyContent={
                                <>
                                    {editMode && editMode === 'Register' &&
                                        <SenNetAlert variant={'warning'}
                                                     text={<> This page is intended for registering a single data
                                                         upload. An upload is a unique entity with one SenNet ID and
                                                         Globus location. Valid uploads will be reorganized into
                                                         individual datasets with their own SenNet IDs by CODCC
                                                         Curation. Uploads must have directory structures, contributors,
                                                         and metadata files per the <a target="_blank" href={"https://docs.google.com/document/d/1jXjUhC9ErfU7CVe5UGA5UEYx1MIXTq7KmDpF0s69ZsY/edit#heading=h.35zdcmzbs5a0"}>Data Submission Guide</a>. A new section
                                                         on this topic is forthcoming as of 2023-09-29. For now, please
                                                         schedule a <a target="_blank" href={"https://calendly.com/bhonick-psc/30min"}>Data Submission Office Hours</a> meeting with the
                                                         Curation team or email the Help Desk for guidance on
                                                         constructing an upload.
                                                         {/*<br></br><br></br>*/}
                                                         {/*Temporarily removing this line*/}
                                                         {/*If a data provider would rather have SenNet IDs for their*/}
                                                         {/*datasets as soon as possible, CODCC Curation recommends bulk*/}
                                                         {/*dataset registration through <a*/}
                                                         {/*    href={getRootURL() + 'edit/bulk/dataset?action=register'}>this*/}
                                                         {/*    page</a>.*/}
                                                     </>}
                                                     icon={<i class="bi bi-exclamation-triangle-fill"></i>}/>
                                    }
                                    <Form noValidate validated={validated} onSubmit={handleSave} id={"upload-form"}>
                                        {/*Group select*/}
                                        {
                                            !(userWriteGroups.length === 1 || isEditMode()) &&
                                            <GroupSelect
                                                data={data}
                                                groups={userWriteGroups}
                                                onGroupSelectChange={onChange}
                                                entity_type={'source'}/>
                                        }

                                        {
                                            !(userWriteGroups.length === 1) && isEditMode() && adminGroup &&
                                            <GroupSelect
                                                optionValueProp={'displayname'}
                                                title={'Assigned to Group Name'}
                                                required={false}
                                                controlId={'assigned_to_group_name'}
                                                popover={<>The group responsible for the next step in the data ingest process.</>}
                                                data={data}
                                                value={values.assigned_to_group_name}
                                                groups={userWriteGroups.map(item => {if (item.data_provider) return item})}
                                                onGroupSelectChange={onChange}
                                                entity_type={'dataset'}/>
                                        }

                                        {/*/!*Ingest*!/*/}
                                        {isEditMode() && adminGroup &&
                                            <EntityFormGroup label='Ingest Task'
                                                             type={'textarea'}
                                                             controlId='ingest_task' value={data.ingest_task}
                                                             onChange={onChange}
                                                             text={<>The next task in the data ingest process.</>} />}

                                        {/*Title*/}
                                        <EntityFormGroup label="Upload Title" placeholder='Upload Title'
                                                         controlId='title' value={data.title}
                                                         isRequired={true}
                                                         onChange={onChange}
                                                         text={<>A meaningful title for the <code>Upload</code>.
                                                         </>}/>

                                        {/*/!*Description*!/*/}
                                        <EntityFormGroup isRequired={true} label='Description' type='textarea'
                                                         controlId='description' value={data.description}
                                                         onChange={onChange}
                                                         text={<>Free text field to enter a description of
                                                             the <code>Upload</code>.</>}/>


                                        <div className={'d-flex flex-row-reverse'}>
                                            {getCancelBtn('upload')}


                                            {!eq(data['status'], 'Processing') && !eq(data['status'], 'Reorganized') &&
                                                <SenNetPopover text={<>Save changes to this <code>Upload</code>.</>}
                                                               className={'save-button'}>
                                                    <Button variant="outline-primary rounded-0 js-btn--save"
                                                            className={'me-2'}
                                                            onClick={handleSave}
                                                            disabled={disableSubmit}>
                                                        {_t('Save')}
                                                    </Button>
                                                </SenNetPopover>
                                            }

                                            {!eq(data['status'], 'Processing') && isEditMode() && (eq(data['status'], 'New') || eq(data['status'], 'Valid')) &&
                                                <SenNetPopover
                                                    text={<>Mark this <code>Upload</code> as "Submitted" and ready for
                                                        reorganizing.</>} className={'submit-dataset'}>
                                                    <DatasetSubmissionButton
                                                        btnLabel={"Submit"}
                                                        modalBody={<div><p>By clicking "Submit"
                                                            this <code>Upload</code> will
                                                            have its status set to <span
                                                                className={`${getStatusColor('Submitted')} badge`}>Submitted</span> and
                                                            be ready for reorganizing.</p>
                                                            <p>
                                                                Before submitting your <code>Upload</code> please
                                                                confirm that all files (including metadata/contributors
                                                                TSVs) have been uploaded in Globus.
                                                            </p>
                                                        </div>}
                                                        onClick={handleSubmit} disableSubmit={disableSubmit}/>
                                                </SenNetPopover>
                                            }

                                            {adminGroup && isEditMode() && !(eq(data['status'], 'Processing') || eq(data['status'], 'Reorganized')) &&
                                                <SenNetPopover
                                                    text={<>Validate upload.
                                                    </>}
                                                    className={'validate-button'}>
                                                    <DatasetSubmissionButton
                                                        actionBtnClassName={'js-btn--validate'}
                                                        btnLabel={"Validate"}
                                                        modalTitle={'Validation'}
                                                        modalBody={<div><p>By clicking "Validate"
                                                            this <code>Upload</code> will
                                                            have its status set to <span
                                                                className={`${getStatusColor('Valid')} badge`}>Valid</span> if
                                                            upload checks are met and
                                                            be ready for submitting.</p>
                                                        </div>}
                                                        onClick={handleValidate} disableSubmit={disableSubmit}/>
                                                </SenNetPopover>}

                                            {!eq(data['status'], 'Processing') && adminGroup && isEditMode() && (eq(data['status'], 'Valid') || eq(data['status'], 'Submitted')) &&
                                                <SenNetPopover
                                                    text={<>Reorganize this <code>Upload</code>.
                                                    </>}
                                                    className={'reorganize-button'}>
                                                    <DatasetSubmissionButton
                                                        actionBtnClassName={'js-btn--reorganize'}
                                                        btnLabel={"Reorganize"}
                                                        modalTitle={'Reorganization'}
                                                        modalBody={<div><p>By clicking "Reorganize"
                                                            this <code>Upload</code> will
                                                            have its status set to <span
                                                                className={`${getStatusColor('Processing')} badge`}>Processing</span> and
                                                            corresponding Datasets and respective directories created
                                                            and moved accordingly.</p>
                                                        </div>}
                                                        onClick={handleReorganize} disableSubmit={disableSubmit}/>
                                                </SenNetPopover>}

                                            {!['Processing', 'Published', 'Reorganized'].contains(data['status']) && adminGroup && isEditMode() &&
                                                <SenNetPopover
                                                    text={statusRevertTooltip(cache.entities.upload)}
                                                    className={'revert-button'}>
                                                    <DatasetRevertButton data={data} onClick={handleRevert}
                                                                         disableSubmit={disableSubmit}
                                                                         onStatusChange={onChange}/>
                                                </SenNetPopover>}
                                        </div>
                                        {getModal()}
                                        {getBusyOverlay()}
                                    </Form>
                                </>
                            }
                        />
                    </div>
                }
                {!showModal && <AppFooter/>}

            </>
        )
    }
}

EditUpload.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}

export default EditUpload
