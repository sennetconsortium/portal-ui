import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from "react";
import {useRouter} from 'next/router';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Layout} from "@elastic/react-search-ui-views";
import log from "loglevel";
import {cleanJson, eq, getDOIPattern, getRequestHeaders} from "../../components/custom/js/functions";
import {getEntityData, update_create_entity} from "../../lib/services";
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import {SenPopoverOptions} from "../../components/SenNetPopover";
import $ from "jquery";

const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('../../components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('../../components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("../../components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const ImageSelector = dynamic(() => import("../../components/custom/edit/ImageSelector"))
const SenNetAlert = dynamic(() => import("../../components/SenNetAlert"))
const SourceType = dynamic(() => import("../../components/custom/edit/source/SourceType"))


function EditSource() {
    const {
        isPreview, getModal, setModalDetails,
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
        getMetadataNote, checkProtocolUrl,
        warningClasses, getCancelBtn
    } = useContext(EntityContext)
    const {_t, filterImageFilesToAdd, cache, getPreviewView} = useContext(AppContext)

    const router = useRouter()
    const [source, setSource] = useState(null)
    const [imageByteArray, setImageByteArray] = useState([])
    const alertStyle = useRef('info')


    // Disable all form elements if data_access_level is "public"
    // Wait until "sampleCategories" and "editMode" are set prior to running this
    useEffect(() => {
        if (dataAccessPublic === true) {
            const form = document.getElementById("source-form");
            const elements = form.elements;
            for (let i = 0, len = elements.length; i < len; ++i) {
                elements[i].setAttribute('disabled', true);
            }
        }
    }, [dataAccessPublic, editMode])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editSource: getting data...', uuid)
            // get the data from the api
            const data = await getEntityData(uuid)

            log.debug('editSource: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                setData(data);

                checkProtocolUrl(data.protocol_url)

                // Set state with default values that will be PUT to Entity API to update
                let _values = {
                    'lab_source_id': data.lab_source_id,
                    'protocol_url': data.protocol_url,
                    'description': data.description,
                    'source_type': data.source_type,
                    'metadata': data.metadata
                }
                if (data.image_files) {
                    _values['image_files'] = data.image_files
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

            filterImageFilesToAdd(values)

            // Remove empty strings
            let json = cleanJson(values);
            let uuid = data.uuid


            await update_create_entity(uuid, json, editMode, cache.entities.source).then((response) => {
                setModalDetails({
                    entity: cache.entities.source,
                    type: response.source_type,
                    typeHeader: _t('Source Type'),
                    response
                })
                if (response.image_files) {
                    setValues(prevState => ({...prevState, image_files: response.image_files}))
                }
                if (values.image_files_to_add) {
                    delete values.image_files_to_add
                }
                if (values.image_files_to_remove) {
                    delete values.image_files_to_remove
                }
                setImageByteArray([])
            }).catch((e) => log.error(e))
        }

        setValidated(true);
    };

    const supportsMetadata = () => {
        return values.source_type === cache.sourceTypes.Mouse
    }

    const curatorHandledMetadata = () => {
        // TODO: check about Human Organoid
        return eq(values.source_type, cache.sourceTypes.Human)
    }

    const metadataNote = () => {
        let text = []

        const notEq = !eq(data.source_type, values.source_type)
        const className = values.metadata ? 'mt-2 d-block' : ''
        const curatorMessage = <span key={'md-curator'} className={className}><code>{values.source_type} Source</code> metadata must be sent through the <a
            href={`mailto:help@sennetconsortium.org`}>curator</a>. <br/></span>
        const noSupportMessage = <span key={'md-no-support'}
                                       className={className}>This <code>Source</code> type <code>{values.source_type}</code> does not offer metadata submission support.</span>
        alertStyle.current = notEq && values.metadata ? 'warning' : 'info'

        if (isEditMode() && values.metadata) {
            text.push(getMetadataNote(cache.entities.source, 0, 'type'))
            text.push(getMetadataNote(cache.entities.source, 1, 'type'))

            if (notEq) {
                text.push(getMetadataNote(cache.entities.source, 2, 'type'))
                if (!curatorHandledMetadata()) {
                    text.push(noSupportMessage)
                }
            }

            if (curatorHandledMetadata()) {
                text.push(curatorMessage)
                {/* text.push(<span>//TODO: confirm fields for Human and upload to docs.sennetconsortium.org */
                }
                {/*<small className='text-muted'>For details on what information should be included in your metadata submission, please see &nbsp;*/
                }
                {/*    <a href='https://docs.sennetconsortium.org/libraries/ingest-validation-tools/schemas/source/' target='_blank' className='lnk--ic'> the docs <i className="bi bi-box-arrow-up-right"></i></a>.*/
                }
                {/*</small><br /></span>)*/
                }
            }
            return text
        } else {
            text = []
            if (isEditMode() && curatorHandledMetadata()) {
                text.push(curatorMessage)
            }
            return text.length ? text : false
        }
    }


    const _onBlur = (e, fieldId, value) => {

        if (fieldId === 'protocol_url') {
            checkProtocolUrl(value)
        }
    };

    if (isPreview(error))  {
        return getPreviewView(data)
    } else {
        console.log(values)
        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Source | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.source} isEditMode={isEditMode()} data={data}/>
                            }
                            bodyContent={
                                <Form noValidate validated={validated} onSubmit={handleSave} id={"source-form"}>
                                    {/*Group select*/}
                                    {
                                        !(userWriteGroups.length === 1 || isEditMode()) &&
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={onChange}
                                            entity_type={'source'}/>
                                    }

                                    {/*Lab's Source Non-PHI ID*/}
                                    <EntityFormGroup label="Lab's Source Non-PHI ID or Name"
                                                     placeholder='A non-PHI ID or deidentified name used by the lab when referring to the source.'
                                                     controlId='lab_source_id' value={data.lab_source_id}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     text={<>An identifier used internally by the lab to identify
                                                         the <code>Source</code>. This can be useful for lab members to
                                                         identify and look-up Sources.
                                                     </>}/>

                                    {/*Source Type*/}
                                    <SourceType data={data} onChange={onChange}/>

                                    {/*Case Selection Protocol*/}
                                    <EntityFormGroup label="Case Selection Protocol" placeholder='protocols.io DOI'
                                                     popoverTrigger={SenPopoverOptions.triggers.hoverOnClickOff}
                                                     controlId='protocol_url' value={data.protocol_url}
                                                     isRequired={true} pattern={getDOIPattern()}
                                                     className={warningClasses.protocol_url}
                                                     warningText={<>The supplied protocols.io DOI URL, formatting is
                                                         correct but does not resolve. This will need to be corrected
                                                         for any <code>Dataset</code> submission that uses this entity
                                                         as an ancestor.</>}
                                                     onChange={onChange} onBlur={_onBlur}
                                                     text={<span>The protocol used for <code>Source</code> selection including any inclusion or exclusion criteria. This must  be provided  as a protocols.io DOI see: <a
                                                         href="https://www.protocols.io/." target='_blank'
                                                         className='lnk--ic'>https://www.protocols.io/ <i
                                                         className="bi bi-box-arrow-up-right"></i></a>.</span>}/>

                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Lab Notes' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={onChange}
                                                     text={<>Free text field to enter a description of
                                                         the <code>Source</code>.</>}/>

                                    {metadataNote() &&
                                        <Alert variant={alertStyle.current}><span>{metadataNote()}</span></Alert>}

                                    {/* Deidentify images warning */}
                                    <SenNetAlert className='deidentify-alert'
                                                 text='Upload de-identified images only'/>

                                    {/* Images */}
                                    <ImageSelector editMode={editMode}
                                                   values={values}
                                                   setValues={setValues}
                                                   imageByteArray={imageByteArray}
                                                   setImageByteArray={setImageByteArray}/>

                                    <div className={'d-flex flex-row-reverse'}>
                                        {getCancelBtn('source')}
                                        <Button className={"me-2"} variant="outline-primary rounded-0 js-btn--save"
                                                onClick={handleSave}
                                                disabled={disableSubmit}>
                                            {_t('Save')}
                                        </Button>
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

EditSource.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}

export default EditSource
