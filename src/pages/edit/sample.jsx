import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from "react";
import {useRouter} from 'next/router';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Layout} from "@elastic/react-search-ui-views";
import log from "loglevel";
import {cleanJson, eq, fetchEntity, getDOIPattern, getRequestHeaders} from "../../components/custom/js/functions";
import {get_ancestor_organs, getAncestryData, getEntityData, parseJson, update_create_entity} from "../../lib/services";
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import {getUserName, isRuiSupported} from "../../config/config";
import {SenPopoverOptions} from "../../components/SenNetPopover";
import $ from "jquery";

const AncestorId = dynamic(() => import("../../components/custom/edit/sample/AncestorId"))
const AncestorInformationBox = dynamic(() => import("../../components/custom/entities/sample/AncestorInformationBox"))
const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('../../components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('../../components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("../../components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const ImageSelector = dynamic(() => import("../../components/custom/edit/ImageSelector"))
const RUIIntegration = dynamic(() => import("../../components/custom/edit/sample/rui/RUIIntegration"))
const RUIButton = dynamic(() => import("../../components/custom/edit/sample/rui/RUIButton"))
const SampleCategory = dynamic(() => import("../../components/custom/edit/sample/SampleCategory"))
const SenNetAlert = dynamic(() => import("../../components/SenNetAlert"))
const ThumbnailSelector = dynamic(() => import("../../components/custom/edit/ThumbnailSelector"))

function EditSample() {
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
        getSampleEntityConstraints,
        getMetadataNote, checkProtocolUrl,
        warningClasses, getCancelBtn
    } = useContext(EntityContext)
    const {_t, cache, filterImageFilesToAdd, getPreviewView} = useContext(AppContext)
    const router = useRouter()
    const [source, setSource] = useState(null)
    const [sourceId, setSourceId] = useState(null)
    const [ruiLocation, setRuiLocation] = useState('')
    const [showRui, setShowRui] = useState(false)
    const [showRuiButton, setShowRuiButton] = useState(false)
    const [ancestorOrgan, setAncestorOrgan] = useState([])
    const [ancestorSource, setAncestorSource] = useState([])
    const [sampleCategories, setSampleCategories] = useState(null)
    const [organ_group_hide, set_organ_group_hide] = useState('none')

    const [imageFilesToAdd, setImageFilesToAdd] = useState([])
    const [imageFilesToRemove, setImageFilesToRemove] = useState([])
    const [thumbnailFileToAdd, setThumbnailFileToAdd] = useState(null)
    const [thumbnailFileToRemove, setThumbnailFileToRemove] = useState(null)
    const [imageByteArray, setImageByteArray] = useState([])
    const alertStyle = useRef('info')


    useEffect(() => {
        const fetchSampleCategories = async () => {
            setSampleCategories(null)
            if (source !== null) {
                const response = await getSampleEntityConstraints(source)
                if (response.ok) {
                    const body = await response.json()
                    const provenance_constraints = body.description[0].description
                    let sub_types = []
                    provenance_constraints.forEach(constraint => {
                        if (eq(constraint.entity_type, cache.entities.sample)) {
                            sub_types = sub_types.concat(constraint.sub_type || [])
                        }
                    })
                    const filter = Object.entries(cache.sampleCategories).filter(sample_category => sub_types.includes(sample_category[0]));
                    let sample_categories = {}
                    filter.forEach(entry => sample_categories[entry[0]] = entry[1])
                    setSampleCategories(sample_categories)
                }
            }
        }
        fetchSampleCategories()
    }, [source])

    // Disable all form elements if data_access_level is "public"
    // Wait until "sampleCategories" and "editMode" are set prior to running this
    useEffect(() => {
        if (dataAccessPublic === true) {
            const form = document.getElementById("sample-form");
            const elements = form.elements;
            for (let i = 0, len = elements.length; i < len; ++i) {
                elements[i].setAttribute('disabled', true);
            }
        }
    }, [dataAccessPublic, sampleCategories, editMode])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editSample: getting data...', uuid)
            // get the data from the api
            const _data = await getEntityData(uuid)

            log.debug('editSample: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(_data["error"])
            } else {

                setData(_data)
                const ancestry = await getAncestryData(_data.uuid, {otherEndpoints: ['immediate_ancestors']})
                Object.assign(_data, ancestry)
                setData(_data)

                checkProtocolUrl(_data.protocol_url)

                // Show organ input group if sample category is 'organ'
                if (eq(_data.sample_category, cache.sampleCategories.Organ)) {
                    set_organ_group_hide('')
                }

                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'sample_category': _data.sample_category,
                    'organ': _data.organ,
                    'organ_other': _data.organ_other,
                    'protocol_url': _data.protocol_url,
                    'lab_tissue_sample_id': _data.lab_tissue_sample_id,
                    'description': _data.description,
                    'direct_ancestor_uuid': _data.immediate_ancestors[0].uuid,
                    'metadata': _data.metadata
                })
                if (_data.image_files) {
                    setValues(prevState => ({...prevState, image_files: _data.image_files}))
                }
                if (_data.thumbnail_file) {
                    setValues(prevState => ({...prevState, thumbnail_file: _data.thumbnail_file}))
                }
                setImageFilesToAdd(_data.image_files)
                setThumbnailFileToAdd(_data.thumbnail_file)
                setEditMode("Edit")
                setDataAccessPublic(_data.data_access_level === 'public')

                if (_data.hasOwnProperty("immediate_ancestors")) {
                    await fetchSource(_data.immediate_ancestors[0].uuid);
                }

                let ancestor_organ = await get_ancestor_organs(_data.uuid)
                setAncestorOrgan(ancestor_organ)
                setAncestorSource([getSourceType(_data.source)])

                if (_data['rui_location'] !== undefined) {
                    setRuiLocation(_data['rui_location'])
                    setShowRuiButton(true)
                }
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
            setSourceId(null)
        }
    }, [router]);

    // On changes made to ancestorOrgan run checkRui function
    useEffect(() => {
        checkRui();
    }, [ancestorOrgan, values]);

    // callback provided to components to update the main list of form values
    const _onChange = (e, fieldId, value) => {
        // log.debug('onChange', fieldId, value)
        // use a callback to find the field in the value list and update it
        onChange(e, fieldId, value)

        if (fieldId === 'direct_ancestor_uuid') {
            resetSampleCategory(e)
        }
    };

    const _onBlur = (e, fieldId, value) => {
        if (fieldId === 'protocol_url') {
            checkProtocolUrl(value)
        }
    };

    const resetSampleCategory = (e) => {

        if (Object.hasOwn(values, 'sample_category')) {
            _onChange(e, "sample_category", "")
        }
        if (Object.hasOwn(values, 'organ')) {
            _onChange(e, "organ", "")
        }
        if (Object.hasOwn(values, 'organ_other')) {
            _onChange(e, "organ_other", "")
        }
        set_organ_group_hide('none')


        const sample_category = document.getElementById('sample_category')
        const organ = document.getElementById("organ")
        const organ_other = document.getElementById("organ_other")
        if (sample_category !== null) {
            sample_category.value = ''
        }
        if (organ !== null) {
            organ.value = ''
        }
        if (organ_other !== null) {
            organ_other.value = ''
        }
    }

    const getSourceType = (root) => {
        if (root.source) {
            return getSourceType(root.source)
        } else {
            return root.source_type
        }
    }

    const fetchSource = async (sourceId) => {
        let source = await fetchEntity(sourceId);
        if (source.hasOwnProperty("error")) {
            setError(true)
            setErrorMessage(source["error"])
        } else {
            setSource(source);
            setSourceId(source.sennet_id)

            // Manually set ancestor organs when ancestor is updated via modal
            let ancestor_organ = []
            if (source.hasOwnProperty("organ")) {
                ancestor_organ.push(source['organ'])
            } else if (source.hasOwnProperty("origin_sample")) {
                if (source.origin_sample.hasOwnProperty("organ")) {
                    ancestor_organ.push(source.origin_sample['organ'])
                }
            }
            setAncestorOrgan(ancestor_organ)
            setAncestorSource([getSourceType(source)])
        }
    }

    const checkRui = () => {
        // Define logic to show RUI tool
        // An ancestor must be a Sample with Sample Category: "Organ" and Organ Type that exists in isOrganRuiSupported
        // This Sample must a Sample Category: "Block"
        log.debug(ancestorOrgan)
        if (ancestorOrgan.length > 0) {
            if (values !== null && values['sample_category'] === cache.sampleCategories.Block && isRuiSupported(ancestorOrgan, ancestorSource)) {
                if (!showRuiButton) {
                    setShowRuiButton(true)
                }
            } else {
                setShowRuiButton(false)
            }
        } else {
            setShowRuiButton(false)
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
            log.debug("Form is valid")

            if (values['group_uuid'] === null && editMode === 'Register') {
                values['group_uuid'] = selectedUserWriteGroupUuid
            }

            if (ruiLocation !== '') {
                values['rui_location'] = parseJson(ruiLocation)
            }

            filterImageFilesToAdd(values);

            if (imageFilesToRemove.length !== 0) {
                values['image_files_to_remove'] = imageFilesToRemove
            }

            if (thumbnailFileToAdd && thumbnailFileToAdd.temp_file_id !== undefined) {
                values['thumbnail_file_to_add'] = thumbnailFileToAdd
            }

            if (thumbnailFileToRemove) {
                values['thumbnail_file_to_remove'] = thumbnailFileToRemove
            }

            // Remove empty strings
            let json = cleanJson(values);
            let uuid = data.uuid


            await update_create_entity(uuid, json, editMode, cache.entities.sample).then((response) => {
                setModalDetails({
                    entity: cache.entities.sample, type: response.sample_category,
                    typeHeader: _t('Sample Category'), response
                })

                if (response.image_files) {
                    setValues(prevState => ({...prevState, image_files: response.image_files}))
                }
                if (response.thumbnail_file) {
                    setValues(prevState => ({...prevState, thumbnail_file: response.thumbnail_file}))
                }
                if (values.image_files_to_add) {
                    delete values.image_files_to_add
                }
                if (values.image_files_to_remove) {
                    delete values.image_files_to_remove
                }
                if (values.thumbnail_file_to_add) {
                    delete values.thumbnail_file_to_add
                }
                if (values.thumbnail_file_to_remove) {
                    delete values.thumbnail_file_to_remove
                }
                setImageByteArray([])
            }).catch((e) => log.error(e))
        }

        setValidated(true);
    };

    const supportsMetadata = () => {
        return values.sample_category !== cache.sampleCategories.Organ
    }

    const metadataNote = () => {
        if (isEditMode() && (values.metadata && Object.values(values.metadata).length)) {
            let text = []
            text.push(getMetadataNote(cache.entities.sample, 0))
            text.push(getMetadataNote(cache.entities.sample, 1))
            if (data.sample_category === values.sample_category) {
                alertStyle.current = 'info'
            } else {
                alertStyle.current = 'warning'
                text.push(getMetadataNote(cache.entities.sample, 2))
            }
            return text
        } else {
            return false
        }
    }

    if (isPreview(error))  {
        return getPreviewView(data)
    } else {
        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Sample | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }

                {showRui &&
                    <RUIIntegration
                        organ={ancestorOrgan}
                        sex={'male'}
                        user={getUserName()}
                        blockStartLocation={ruiLocation}
                        setRuiLocation={setRuiLocation}
                        setShowRui={setShowRui}
                        cache={cache}
                    />
                }

                {!showRui && data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.sample} isEditMode={isEditMode()} data={data}/>

                            }
                            bodyContent={

                                <Form noValidate validated={validated} id={"sample-form"}>
                                    {/*Group select*/}
                                    {
                                        !(userWriteGroups.length === 1 || isEditMode()) &&
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={_onChange}
                                            entity_type={'sample'}/>
                                    }

                                    {/*Ancestor ID*/}
                                    {/*editMode is only set when page is ready to load */}
                                    {editMode &&
                                        <AncestorId data={data} source={source} onChange={_onChange} fetchSource={fetchSource}/>
                                    }

                                    {/*Source Information Box*/}
                                    {source &&
                                        <AncestorInformationBox ancestor={source}/>
                                    }

                                    {/*/!*Tissue Sample Type*!/*/}

                                    {((isEditMode() && source) || (editMode === 'Register')) &&
                                        <>
                                            <SampleCategory
                                                organ_group_hide={organ_group_hide}
                                                set_organ_group_hide={set_organ_group_hide}
                                                sample_categories={sampleCategories === null ? cache.sampleCategories : sampleCategories}
                                                data={values}
                                                source={source}
                                                onChange={_onChange}/>
                                            <RUIButton
                                                showRegisterLocationButton={showRuiButton}
                                                ruiLocation={ruiLocation}
                                                setShowRui={setShowRui}
                                            />
                                        </>
                                    }

                                    {/*/!*Preparation Protocol*!/*/}
                                    <EntityFormGroup label="Preparation Protocol" placeholder='protocols.io DOI'
                                                     controlId='protocol_url' value={data.protocol_url}
                                                     isRequired={true} pattern={getDOIPattern()}
                                                     className={warningClasses.protocol_url}
                                                     warningText={<>The supplied protocols.io DOI URL, formatting is
                                                         correct but does not resolve. This will need to be corrected
                                                         for any <code>Dataset</code> submission that uses this entity
                                                         as an ancestor.</>}
                                                     popoverTrigger={SenPopoverOptions.triggers.hoverOnClickOff}
                                                     onChange={_onChange}
                                                     onBlur={_onBlur}
                                                     text={<span>The protocol used when procuring or preparing the tissue. This must be provided as a protocols.io DOI URL see: <a
                                                         href="https://www.protocols.io/." target='_blank'
                                                         className='lnk--ic'>https://www.protocols.io/ <i
                                                         className="bi bi-box-arrow-up-right"></i></a>.</span>}/>

                                    {/*/!*Lab Sample ID*!/*/}
                                    <EntityFormGroup label='Lab Sample ID'
                                                     placeholder='A non-PHI ID or deidentified name used by the lab when referring to the specimen'
                                                     controlId='lab_tissue_sample_id'
                                                     isRequired={true}
                                                     value={data.lab_tissue_sample_id}
                                                     onChange={_onChange}
                                                     text='An identifier used internally by the lab to identify the specimen. This can be useful for lab members to identify and look-up Samples.'/>


                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Lab Notes' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={_onChange}
                                                     text='Free text field to enter a description of the specimen'/>

                                    {metadataNote() &&
                                        <Alert variant={alertStyle.current}><span>{metadataNote()}</span></Alert>}

                                    {/* Deidentify images warning */}
                                    <SenNetAlert className='deidentify-alert'
                                                 text='Upload de-identified images and thumbnails only'/>

                                    {/* Images */}
                                    <ImageSelector editMode={editMode}
                                                   values={values}
                                                   setValues={setValues}
                                                   imageByteArray={imageByteArray}
                                                   setImageByteArray={setImageByteArray}/>

                                    {/* Thumbnail */}
                                    <ThumbnailSelector editMode={editMode}
                                                       values={values}
                                                       setValues={setValues}/>


                                    <div className={'d-flex flex-row-reverse'}>
                                        {getCancelBtn('sample')}
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

                {!showRui && !showModal && <AppFooter/>}
            </>
        )
    }
}

EditSample.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}

export default EditSample
