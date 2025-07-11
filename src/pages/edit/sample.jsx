import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from "react";
import {useRouter} from 'next/router';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Layout} from "@elastic/react-search-ui-views";
import log from "loglevel";
import {cleanJson, eq, extractSourceSex, fetchEntity, getDOIPattern} from "@/components/custom/js/functions";
import {getAncestryData, getEntityData, parseJson, update_create_entity} from "@/lib/services";
import AppContext from '@/context/AppContext'
import EntityContext, {EntityProvider} from '@/context/EntityContext'
import {getUserEmail, getUserName, isRuiSupported} from "@/config/config";
import {SenPopoverOptions} from "@/components/SenNetPopover";
import LnkIc from "@/components/custom/layout/LnkIc";

const AncestorId = dynamic(() => import("@/components/custom/edit/sample/AncestorId"))
const AncestorInformationBox = dynamic(() => import("@/components/custom/entities/sample/AncestorInformationBox"))
const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('@/components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('@/components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("@/components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const ImageSelector = dynamic(() => import("@/components/custom/edit/ImageSelector"))
const RUIIntegration = dynamic(() => import("@/components/custom/edit/sample/rui/RUIIntegration"))
const RUIButton = dynamic(() => import("@/components/custom/edit/sample/rui/RUIButton"))
const SampleCategory = dynamic(() => import("@/components/custom/edit/sample/SampleCategory"))
const SenNetAlert = dynamic(() => import("@/components/SenNetAlert"))
const ThumbnailSelector = dynamic(() => import("@/components/custom/edit/ThumbnailSelector"))

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
        showModal, setAllModalDetails, handleClose, setModalProps,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit,
        entityForm, disabled,
        getSampleEntityConstraints,
        getMetadataNote, checkProtocolUrl,
        warningClasses, getCancelBtn
    } = useContext(EntityContext)
    const {_t, cache, filterImageFilesToAdd, getPreviewView} = useContext(AppContext)
    const router = useRouter()
    const [source, setSource] = useState(null)
    const [ruiSex, setRuiSex] = useState(undefined)
    const [ruiLocation, setRuiLocation] = useState('')
    const [showRui, setShowRui] = useState(false)
    const [showRuiButton, setShowRuiButton] = useState(false)
    const [ancestorOrgan, setAncestorOrgan] = useState([])
    const [ancestorSourceType, setAncestorSourceType] = useState([])
    const [sampleCategories, setSampleCategories] = useState(null)
    const [organ_group_hide, set_organ_group_hide] = useState('none')

    const [imageFilesToAdd, setImageFilesToAdd] = useState([])
    const [imageFilesToRemove, setImageFilesToRemove] = useState([])
    const [thumbnailFileToAdd, setThumbnailFileToAdd] = useState(null)
    const [thumbnailFileToRemove, setThumbnailFileToRemove] = useState(null)
    const [imageByteArray, setImageByteArray] = useState([])
    const alertStyle = useRef('info')
    const issuedUserWarning = useRef(null)

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

    // only executed on init rendering, see the []
    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('editSample: getting data...', uuid)
            // fetch sample data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('editSample: Got data', _data)
            if (_data.hasOwnProperty("error")) {
                setError(true)
                setData(false)
                setErrorMessage(_data["error"])
                return
            }

            setData(_data)
            setRuiSex(extractSourceSex(_data.source))


            // Show organ input group if sample category is 'organ'
            if (eq(_data.sample_category, cache.sampleCategories.Organ)) {
                set_organ_group_hide('')
            }

            getAncestryData(_data.uuid, {endpoints: ['ancestors'], otherEndpoints: ['immediate_ancestors']}).then(ancestry => {
                Object.assign(_data, ancestry)
                setData(_data)
                setValues(prevState => ({...prevState, direct_ancestor_uuid: ancestry.immediate_ancestors[0].uuid}))

                if (ancestry.hasOwnProperty("immediate_ancestors")) {
                    fetchSource(ancestry.immediate_ancestors[0].uuid)
                        .catch(log.error);
                } else {
                    setSource(_data.source)
                }
            }).catch(log.error)

            // Set state with default values that will be PUT to Entity API to update
            const vals = {
                'sample_category': _data.sample_category,
                'organ': _data.organ,
                'organ_other': _data.organ_other,
                'protocol_url': _data.protocol_url,
                'lab_tissue_sample_id': _data.lab_tissue_sample_id,
                'description': _data.description,
                'direct_ancestor_uuid': values.direct_ancestor_uuid || '',
                'metadata': _data.metadata
            }
            if (_data.image_files) {
                vals['image_files'] = _data.image_files
            }
            if (_data.thumbnail_file) {
                vals['thumbnail_file'] = _data.thumbnail_file
            }
            setValues(vals)

            setImageFilesToAdd(_data.image_files)
            setThumbnailFileToAdd(_data.thumbnail_file)
            setEditMode('Edit')

            setAncestorOrgan(_data.organ ? [_data.organ] : [_data?.origin_samples[0].organ])
            setAncestorSourceType([getSourceType(_data.source)])

            if (_data['rui_location'] !== undefined) {
                setRuiLocation(_data['rui_location'])
                setShowRuiButton(true)
            }
        }

        if (router.query.hasOwnProperty('uuid')) {
            if (eq(router.query.uuid, 'register')) {
                setData(true)
                issuedUserWarning.value = false
                setEditMode('Register')
            } else {
                // fetch sample data
                fetchData(router.query.uuid)
                    .catch(log.error);
            }
        } else {
            setData(null)
            setSource(null)
        }
    }, [router]);

    useEffect(() => {
        if (data && isEditMode()) {
            document.addEventListener(
                "checkProtocolUrl",
                (e) => {
                    checkProtocolUrl(data.protocol_url)
                },
                false,
            )
        }
    }, [data]);

    // On changes made to ancestorOrgan run checkRui function
    useEffect(() => {
        checkRui();
    }, [ancestorOrgan, values]);

    const selectedOtherOrgan = (val) => ['Other', 'UBERON:0010000', null].contains(val)

    // callback provided to components to update the main list of form values
    const _onChange = (e, fieldId, value) => {
        // log.debug('onChange', fieldId, value)
        // use a callback to find the field in the value list and update it
        onChange(e, fieldId, value)

        if (fieldId === 'direct_ancestor_uuid') {
            resetSampleCategory(e)
        }

        if (fieldId === 'organ') {
            const $organParent = document.getElementById('organ')?.parentElement?.parentElement
            const cls = 'has-warning'
            if (selectedOtherOrgan(value)) {
                $organParent?.classList.add(cls)
            } else {
                issuedUserWarning.value = true
                $organParent?.classList.remove(cls)
            }
        }
    };

    const _onBlur = (e, fieldId, value) => {
        if (fieldId === 'protocol_url') {
            checkProtocolUrl(value)
        }
    };

    const secondaryBtnFixHandler = () => {
        issuedUserWarning.value = false
        setDisableSubmit(false)
        handleClose()
    }

    const organOtherWarning = <span>will not be able to register data against this <code>Sample</code>. Please contact our <LnkIc icClassName={'bi bi-envelope-fill'} href={'help@sennetconsortium.org'} title={'help desk'} /> to ensure that we can provide appropriate support for your work.</span>

    const checkRegistration = () => {
       if (selectedOtherOrgan(values['organ']) && eq(values['sample_category'], cache.sampleCategories.Organ)) {
           setAllModalDetails({
               title: <span>"<span className={'text-codePink'}>Other</span>" Organ Registration</span>,
               isWarning: true,
               modalProps: {
                    actionBtnLabel: 'Confirm',
                    actionBtnHandler: handleSave,
                    secondaryBtnLabel: 'Fix',
                    secondaryBtnHandler: secondaryBtnFixHandler,
               },
               body: <p>We have identified that you are registering a <code>Sample Organ</code> with the organ type <code>Other</code>. While it is permissible to register this organ type, you {organOtherWarning} Please click "Confirm" to complete the registration process.</p>
           })
       }
        issuedUserWarning.value = true
    }

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
            setSource(source)

            // Manually set ancestor organs when ancestor is updated via modal
            let ancestor_organ = []
            if (source.hasOwnProperty("organ")) {
                ancestor_organ.push(source['organ'])
            } else if (source.hasOwnProperty("origin_samples")) {
                if (source.origin_samples[0].hasOwnProperty("organ")) {
                    ancestor_organ.push(source.origin_samples[0]['organ'])
                }
            }
            setAncestorOrgan(ancestor_organ)
            setAncestorSourceType([getSourceType(source)])
        }
    }

    const checkRui = () => {
        // Define logic to show RUI tool
        // An ancestor must be a Sample with Sample Category: "Organ" and Organ Type that exists in isOrganRuiSupported
        // This Sample must a Sample Category: "Block"
        log.debug(ancestorOrgan)
        if (ancestorOrgan.length > 0) {
            if (values !== null && values['sample_category'] === cache.sampleCategories.Block && isRuiSupported(ancestorOrgan, ancestorSourceType)) {
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
        setModalProps({})
        setDisableSubmit(true);

        const form = entityForm.current
        if (form.checkValidity() === false) {
            event?.preventDefault();
            event?.stopPropagation();
            log.debug("Form is invalid")
            setDisableSubmit(false);
        } else {
            event?.preventDefault();
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

            if (issuedUserWarning.value === false) {
                checkRegistration()
            } else {
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
                        sex={ruiSex}
                        user={getUserName()}
                        email={getUserEmail()}
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

                                <Form noValidate validated={validated} id={"sample-form"} ref={entityForm}>
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
                                        <AncestorId isDisabled={isEditMode()} data={data} source={source} onChange={_onChange} fetchSource={fetchSource}/>
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
                                                popoverWarningText={organOtherWarning}
                                                onChange={_onChange}
                                                selectedOtherOrgan={selectedOtherOrgan}
                                                isDisabled={isEditMode() || !source}
                                            />
                                            <RUIButton
                                                showRegisterLocationButton={showRuiButton}
                                                ruiSex={ruiSex}
                                                setRuiSex={setRuiSex}
                                                ruiLocation={ruiLocation}
                                                setShowRui={setShowRui}
                                            />
                                        </>
                                    }

                                    {/*/!*Preparation Protocol*!/*/}
                                    <EntityFormGroup label="Preparation Protocol" placeholder='protocols.io DOI'
                                                     controlId='protocol_url' value={data.protocol_url}
                                                     isRequired={true}
                                                     className={warningClasses.protocol_url}
                                                     popoverWarningText={<>The supplied protocols.io DOI URL, formatting is
                                                         correct but does not resolve. This will need to be corrected
                                                         for any <code>Dataset</code> submission that uses this entity
                                                         as an ancestor.</>}
                                                     popoverTrigger={SenPopoverOptions.triggers.hoverOnClickOff}
                                                     onChange={_onChange}
                                                     popoverHelpText={<span>The protocol used when procuring or preparing the tissue. This must be provided as a protocols.io DOI URL see: <a
                                                         href="https://www.protocols.io/." target='_blank'
                                                         className='lnk--ic'>https://www.protocols.io/ <i
                                                         className="bi bi-box-arrow-up-right"></i></a>.</span>}
                                                     otherInputProps={{
                                                         'data-js-appevent': 'checkProtocolUrl',
                                                         pattern:getDOIPattern(),
                                                         onBlur: (e) => _onBlur(e, e.target.id, e.target.value)
                                                     }}
                                    />

                                    {/*/!*Lab Sample ID*!/*/}
                                    <EntityFormGroup label='Lab Sample ID'
                                                     placeholder='A non-PHI ID or deidentified name used by the lab when referring to the specimen'
                                                     controlId='lab_tissue_sample_id'
                                                     isRequired={true}
                                                     value={data.lab_tissue_sample_id}
                                                     onChange={_onChange}
                                                     popoverHelpText='An identifier used internally by the lab to identify the specimen. This can be useful for lab members to identify and look-up Samples.'/>


                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Lab Notes' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={_onChange}
                                                     popoverHelpText='Free text field to enter a description of the specimen'/>

                                    {metadataNote() &&
                                        <Alert variant={alertStyle.current}><span>{metadataNote()}</span></Alert>}

                                    {/* Deidentify images warning */}
                                    <SenNetAlert className='deidentify-alert'
                                                 text='Upload de-identified images and thumbnails only'/>

                                    {/* Images */}
                                    <ImageSelector editMode={editMode}
                                                   isDisabled={disabled}
                                                   values={values}
                                                   setValues={setValues}
                                                   imageByteArray={imageByteArray}
                                                   setImageByteArray={setImageByteArray}/>

                                    {/* Thumbnail */}
                                    <ThumbnailSelector editMode={editMode}
                                                       isDisabled={disabled}
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
