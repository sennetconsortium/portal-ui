import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import 'bootstrap/dist/css/bootstrap.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import {Layout} from '@elastic/react-search-ui-views'
import '@elastic/react-search-ui-views/lib/styles/styles.css'
import log from 'loglevel'
import {callService, filterProperties, getEntityData, update_create_entity} from '@/lib/services'
import {cleanJson, eq, fetchEntity, getIdRegEx} from '@/components/custom/js/functions'
import AppContext from '@/context/AppContext'
import EntityContext, {EntityProvider} from "@/context/EntityContext";
import {getEntityEndPoint, getIngestEndPoint, valid_dataset_ancestor_config} from "@/config/config";
import $ from 'jquery'
import SenNetPopover, {SenPopoverOptions} from "@/components/SenNetPopover"
import AttributesUpload, {getResponseList} from "@/components/custom/edit/AttributesUpload";
import DataTable from "react-data-table-component";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from '@mui/material/Tooltip';
import Zoom from "@mui/material/Zoom"
import {CloseIcon} from "next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon";
import {CheckIcon} from "primereact/icons/check";
import {SpinnerEl} from "@/components/custom/Spinner";

const AncestorIds = dynamic(() => import('@/components/custom/edit/dataset/AncestorIds'))
const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('@/components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('@/components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("@/components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))

export default function EditCollection({collectionType='Collection', entitiesTableLabel='Entities', entitiesButtonLabel='entity'}) {
    const {
        isPreview, getModal, setModalDetails,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal, getEntityConstraints,
        disableSubmit, setDisableSubmit,
        setDataAccessPublic,
        getCancelBtn,
        contactsTSV, contacts, setContacts, contributors, setContactsAttributes, setContactsAttributesOnFail
    } = useContext(EntityContext)
    const {_t, cache, adminGroup, getBusyOverlay, toggleBusyOverlay, getPreviewView} = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)
    const [bulkAddField, setBulkAddField] = useState(false)
    const isBulkHandling = useRef(false)
    const [bulkErrorMessage, setBulkErrorMessage] = useState(null)
    const [bulkPopover, setBulkPopover] = useState(false)
    const bulkAddBtnTooltipDefault = <span>Toggle the field to bulk add comma separated SenNet IDs or UUIDs.</span>
    const [bulkAddBtnTooltip, setBulkAddBtnTooltip] = useState(bulkAddBtnTooltipDefault)
    const [bulkAddTextareaVal, setBulkAddTextareaVal] = useState(null)
    const supportedEntities = [cache.entities.dataset, cache.entities.sample, cache.entities.source]
    const [bulkAddSpinnerVisible, setBulkAddSpinnerVisible] = useState(false)

     useEffect(() => {
        async function fetchAncestorConstraints() {
            const fullBody = [
                {
                    descendants: [{
                        entity_type: collectionType
                    }]
                }
            ]

            const response = await getEntityConstraints(fullBody, {order: 'descendants', filter: 'search'})
            if (response.ok) {
                const body = await response.json()
                const searchQuery = body.description[0].description
                let includeFilters = []
                for (const query of searchQuery) {
                    let includeFilter = {
                        "type": 'term',
                        "field": query.keyword,
                        "values": [query.value]
                    }
                    includeFilters.push(includeFilter)
                }
                valid_dataset_ancestor_config['searchQuery']['includeFilters'] = includeFilters
            }
        }

        fetchAncestorConstraints()
    }, [])

    useEffect(() => {
        const fetchData = async (uuid) => {
            log.debug('editCollection: getting data...', uuid)
            // fetch collection data
            const _data = await getEntityData(uuid, ['ancestors', 'descendants']);

            log.debug('editCollection: Got data', _data)
            if (_data.hasOwnProperty('error')) {
                setError(true)
                setData(false)
                setErrorMessage(_data['error'])
                return
            }

            // set state with the result
            setData(_data)

            callService(filterProperties.collectionEntities, `${getEntityEndPoint()}collections/${_data.uuid}/entities`, 'POST').then(entities => {
                Object.assign(_data, {entities})
                setData(_data)

                if (entities) {
                    const uuids = entities.map((entity) => entity.uuid)
                    setValues(prevValue => ({...prevValue, entity_uuids: uuids}))
                    fetchLinkedEntities(uuids).catch(log.error)
                }
            }).catch(log.error)

            if (_data.contacts) {
                setContacts({description: {records: _data.contacts, headers: contactsTSV.headers}})
            }

            // Set state with default values that will be PUT to Entity API to update
            setValues(prevState => ({
                'title': _data.title,
                'description': _data.description,
                'entity_uuids': prevState.entity_uuids || [],
                'contacts': _data.contacts,
                'contributors': _data.contributors
            }))
            setEditMode('Edit')
            setDataAccessPublic(_data.data_access_level === 'public')
        }

        if (router.query.hasOwnProperty('uuid')) {
            if (eq(router.query.uuid, 'register')) {
                setData(true)
                setEditMode('Register')
            } else {
                // fetch collection data
                fetchData(router.query.uuid)
                    .catch(console.error);
            }
        } else {
            setData(null);
            setAncestors(null)
        }
    }, [router]);

    async function fetchLinkedEntities(datasetUuids, errMsgs) {
        let newDatasets = []
        if (ancestors) {
            newDatasets = [...ancestors];
        }

        let notSupported = []
        for (const uuid of datasetUuids) {
            let paramKey = getIdRegEx().exec(uuid) ? 'sennet_id' : 'uuid'
            let entity = await fetchEntity(uuid, paramKey)

            if (entity.hasOwnProperty("error")) {
                if (isBulkHandling.current) {
                    setBulkPopover(true)
                    errMsgs = <>{errMsgs} <br/>{entity["error"]}</>
                } else {
                    setError(true)
                    setErrorMessage(entity["error"])
                }
            } else {
                if (supportedEntities.includes(entity.entity_type)) {
                    // delete the entity if it already exists, append the new one
                    let idx = newDatasets.findIndex((d) => d.uuid === entity.uuid)
                    if (idx > -1) {
                        newDatasets.splice(idx, 1)
                    }
                    newDatasets.push(entity)
                } else {
                    if (isBulkHandling.current) {
                        notSupported.push(uuid)
                    }
                }
            }
        }
        if (errMsgs && !notSupported.length) {
            setBulkPopover(true)
            setBulkErrorMessage(<>{errMsgs}</>)
        }
        if (notSupported.length) {
            setBulkPopover(true)
            setBulkErrorMessage(<>{errMsgs}{errMsgs && <br/>}<span>Entity with <code>{notSupported.join(',')}</code>
                {notSupported.length > 1 ? ' are' : ' is'} not{notSupported.length > 1 ? '' : ' a'} dataset{notSupported.length > 1 ? 's' : ''}.</span></>)
        }
        isBulkHandling.current = false
        setBulkAddSpinnerVisible(false)
        setAncestors(newDatasets)
        return newDatasets
    }

    const deleteLinkedEntity = (uuid) => {
        const prevEntities = [...ancestors];
        log.debug(prevEntities)
        let updatedEntities = prevEntities.filter(e => e.uuid !== uuid);
        setAncestors(updatedEntities);
        log.debug(updatedEntities);
    }

    const modalResponse = (response) => {
        toggleBusyOverlay(false)

        setModalDetails({
            entity: collectionType,
            type: response?.title,
            typeHeader: _t('Title'),
            response
        })
    }

    const handlePublish = async (event) => {
        setDisableSubmit(true)
        toggleBusyOverlay(true, <span>DOI publish the <code>{collectionType}</code></span>)
        const form = $(event.currentTarget.form)[0]
        if (form.checkValidity() === false) {

            event.preventDefault()
            event.stopPropagation()
            setDisableSubmit(false)
            toggleBusyOverlay(false)
        } else {

            const publishResult = await callService(null, `${getIngestEndPoint()}collections/${data.uuid}/register-doi`, 'PUT')
            modalResponse(publishResult)
            setDisableSubmit(false)
        }
        setValidated(true)
    }

    const handleSave = async (event) => {
        setDisableSubmit(true)

        const form = $(event.currentTarget.form)[0]
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            log.debug("Form is invalid")
            setDisableSubmit(false);
        } else {
            event.preventDefault();
            if (values['entity_uuids'] === undefined || values['entity_uuids'].length === 0) {
                event.stopPropagation();
                setDisableSubmit(false);
            } else {

                log.debug("Form is valid")

                if (!_.isEmpty(contributors) && contributors.description.records) {
                    values["contributors"] = contributors.description.records
                    values['contacts'] = contacts.description.records
                }

                // Remove empty strings
                let json = cleanJson(values);
                let uuid = data.uuid

                await update_create_entity(uuid, json, editMode, collectionType).then((response) => {
                    modalResponse(response)
                }).catch((e) => log.error(e))
            }
        }
        setValidated(true)
    }

    const showBulkAdd = () => {
        setBulkAddBtnTooltip(
            <span>Add your comma separated SenNet ids or uuids, and then click this button to bulk add <code>Entities</code> to the <code>Collection</code>.</span>)
        setBulkAddField(true)
    }

    const hideBulkAdd = () => {
        setBulkAddBtnTooltip(bulkAddBtnTooltipDefault)
        clearBulkPopover()
        setBulkAddTextareaVal(null)
        setBulkAddField(false)
    }

    const getTextareaVal = () => $('[name="ancestor_ids"]').val()

    const clearBulkPopover = () => {
        setBulkErrorMessage(null)
        setBulkPopover(false)
    }

    const handleBulkAddTextChange = () => {
        clearBulkPopover()
        setBulkAddTextareaVal(getTextareaVal())
    }

    const handleBulkAdd = async () => {
        const textareaVal = getTextareaVal()
        setBulkAddTextareaVal(textareaVal)
        clearBulkPopover()
        isBulkHandling.current = true
        setBulkAddSpinnerVisible(true)
        if (textareaVal) {
            let ids = textareaVal.split(',')
            let idsSet = new Set(ids) // remove duplicates
            ids = Array.from(idsSet)

            // in case of lingering commas or too many commas between inputs, let's clear empty values out of array
            ids = ids.filter((id) => id.trim() !== '')
            const re = getIdRegEx()
            let validIds = []
            let previous = ancestors ? [...ancestors] : []
            let dict = {}
            for (let p of previous) {
                dict[p.uuid] = true
                dict[p.sennet_id] = true
            }
            let alreadyAdded = []
            let invalidFormat = []
            for (let id of ids) {
                id = id.trim()
                let matched = getIdRegEx().test(id)
                if ((matched || id.length === 32) && !dict[id]) {
                    validIds.push(id)
                }
                if (dict[id]) {
                    alreadyAdded.push(id)
                }
                if (!matched && id.length !== 32) {
                    invalidFormat.push(id)
                }
            }
            let errMsg
            if (alreadyAdded.length) {
                errMsg = <span>The dataset{alreadyAdded.length > 1 ? 's' : ''}&nbsp;
                    <code>{alreadyAdded.join(',')}</code> {alreadyAdded.length > 1 ? 'have' : 'has'} already been added.</span>
            }
            if (invalidFormat.length) {
                errMsg = <>{errMsg}<span>Invalid dataset{invalidFormat.length > 1 ? 's' : ''} id format <code>{invalidFormat.join(',')}</code>.</span></>
            }
            let datasets = await fetchLinkedEntities(validIds, errMsg)
            if (datasets.length) {
                onChange(null, 'entity_uuids', datasets.map((item) => item.uuid))

                const $field = document.getElementById('ancestor_ids')
                // Clear textfield if all went well
                try {
                    if (datasets.length === ids.length) {
                        $field.value = ''
                    } else {
                        const idsDict = {}
                        for (let d of datasets) {
                            // delete what can be deleted, i.e. those user inputs that match normalized casing, making list smaller to deal with
                            idsSet.delete(d.uuid)
                            idsSet.delete(d.sennet_id)
                            //flag them to not be included in userReducedInput below
                            idsDict[d.uuid.toLowerCase()] = false
                            idsDict[d.sennet_id.toLowerCase()] = false
                        }

                        const userReducedInput = Array.from(idsSet).filter((x) => idsDict[x.trim().toLowerCase()] === undefined)
                        $field.value = userReducedInput.join(',')
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        }

    }

    if (isPreview(error)) {
        return getPreviewView(data)
    } else {

        return (
            <>
                {editMode &&
                    <Header title={`${editMode} ${collectionType} | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={collectionType} isEditMode={isEditMode()} data={data}
                                              values={values} adminGroup={adminGroup}/>
                            }
                            bodyContent={
                                <Form noValidate validated={validated} id="collection-form">
                                    {/*Group select*/}
                                    {
                                        !(userWriteGroups.length === 1 || isEditMode()) &&
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={onChange}
                                            entity_type={'dataset'}/>
                                    }

                                    {/*Linked Datasets*/}
                                    <AncestorIds controlId={'entity_uuids'}
                                                 otherWithAdd={<>&nbsp; &nbsp;
                                                     <SenNetPopover
                                                         placement={SenPopoverOptions.placement.top}
                                                         trigger={SenPopoverOptions.triggers.hoverOnClickOff}
                                                         className={`c-metadataUpload__popover--entity_uuids`}
                                                         text={bulkAddBtnTooltip}
                                                     ><Button variant="outline-secondary rounded-0 mt-1"
                                                              onClick={!bulkAddField ? showBulkAdd : handleBulkAdd}
                                                              aria-controls='js-modal'>
                                                         Bulk add {entitiesTableLabel.toLowerCase()} <i className="bi bi-plus-lg"></i>
                                                     </Button></SenNetPopover>

                                                     <Tooltip
                                                         PopperProps={{
                                                             disablePortal: true,
                                                         }}
                                                         onClose={() => {
                                                             setBulkPopover(false)
                                                         }}
                                                         open={bulkPopover}
                                                         TransitionComponent={Zoom}
                                                         disableFocusListener
                                                         disableHoverListener
                                                         disableTouchListener
                                                         title={<><span role='button'
                                                                        aria-label='Close bulk add entity tooltip'
                                                                        className='tooltip-close'
                                                                        onClick={() => {
                                                                            setBulkPopover(false)
                                                                        }}><CloseIcon/>
                                                    </span>
                                                             <div
                                                                 className={'tooltip-content tooltip-bulk-add-id'}>{bulkErrorMessage}</div>
                                                         </>}
                                                     ><span>&nbsp;</span>
                                                     </Tooltip>
                                                     <textarea id='ancestor_ids' name='ancestor_ids'
                                                               className={bulkAddField ? 'is-visible' : ''}
                                                               onChange={handleBulkAddTextChange}/>
                                                     <SenNetPopover
                                                         placement={SenPopoverOptions.placement.top}
                                                         trigger={SenPopoverOptions.triggers.hover}
                                                         className={`c-metadataUpload__popover--btnClose`}
                                                         text={<span>Click here to cancel/close this field.</span>}
                                                     >
                                                         <span role={'button'} aria-label={'Cancel/close this field'}
                                                               className={`btn-close ${bulkAddField ? 'is-visible' : ''}`}
                                                               onClick={hideBulkAdd}></span>
                                                     </SenNetPopover>

                                                     {bulkAddField && bulkAddTextareaVal && <SenNetPopover
                                                         placement={SenPopoverOptions.placement.bottom}
                                                         trigger={SenPopoverOptions.triggers.hover}
                                                         className={`c-metadataUpload__popover--btnAdd`}
                                                         text={
                                                             <span>Click here to bulk add <code>Entities</code> to the <code>Collection</code></span>}
                                                     >
                                                 <span role='button' aria-label={'Bulk add Entities to the Collection'}
                                                       onClick={bulkAddSpinnerVisible ? undefined : handleBulkAdd}
                                                       className={`btn-add ${bulkAddField && bulkAddTextareaVal ? 'is-visible' : ''}`}> {!bulkAddSpinnerVisible &&
                                                     <CheckIcon/>}
                                                     {bulkAddSpinnerVisible && <SpinnerEl/>}
                                                 </span>
                                                     </SenNetPopover>}
                                                 </>}
                                                 formLabel={entitiesButtonLabel} formLabelPlural={entitiesTableLabel} values={values}
                                                 ancestors={ancestors} onChange={onChange}
                                                 onShowModal={clearBulkPopover}
                                                 fetchAncestors={fetchLinkedEntities}
                                                 deleteAncestor={deleteLinkedEntity}/>

                                    {/*/!*Lab Name or ID*!/*/}
                                    <EntityFormGroup label='Title' placeholder='The title of the collection'
                                                     controlId='title' value={data.title}
                                                     isRequired={true}
                                                     onChange={onChange}
                                                     text={<>The title of the <code>Collection</code>.</>}/>

                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Description' type='textarea' controlId='description'
                                                     isRequired={true}
                                                     value={data.description}
                                                     onChange={onChange}
                                                     text={<>An abstract publicly available when
                                                         the <code>Collection</code> is published.</>}/>

                                    <AttributesUpload ingestEndpoint={contactsTSV.uploadEndpoint} showAllInTable={true}
                                                      setAttribute={setContactsAttributes}
                                                      setAttributesOnFail={setContactsAttributesOnFail}
                                                      entity={collectionType}
                                                      excludeColumns={contactsTSV.excludeColumns}
                                                      attribute={'Contributors'} title={<h6>Contributors</h6>}
                                                      customFileInfo={<span><a
                                                          className='btn btn-outline-primary rounded-0 fs-8' download
                                                          href={'https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv'}> <FileDownloadIcon/>EXAMPLE.TSV</a></span>}/>

                                    {/*This table is just for showing data.contributors list in edit mode. Regular table from AttributesUpload will show if user uploads new file*/}
                                    {isEditMode && !contributors.description && data.contributors &&
                                        <div className='c-metadataUpload__table table-responsive'>
                                            <h6>Contributors</h6>
                                            <DataTable
                                                columns={getResponseList({headers: contactsTSV.headers}, contactsTSV.excludeColumns).columns}
                                                data={data.contributors}
                                                pagination/>
                                        </div>}


                                    <div className={'d-flex flex-row-reverse'}>

                                        {getCancelBtn('collection')}

                                        {!data.doi_url &&
                                            <SenNetPopover text={<>Save changes to this <code>Collection</code>.</>}
                                                           className={'save-button'}>
                                                <Button variant="outline-primary rounded-0 js-btn--save"
                                                        className={'me-2'}
                                                        onClick={handleSave}
                                                        disabled={disableSubmit}>
                                                    {_t('Save')}
                                                </Button>
                                            </SenNetPopover>}

                                        {isEditMode() && adminGroup && !data.registered_doi &&
                                            <SenNetPopover text={<>Save changes to this <code>Collection</code>.</>}
                                                           className={'publish-button'}>
                                                <Button variant="outline-primary rounded-0 js-btn--publish"
                                                        className={'me-2'}
                                                        onClick={handlePublish}
                                                        disabled={disableSubmit}>
                                                    {_t('Publish')}
                                                </Button>
                                            </SenNetPopover>}

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

EditCollection.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}
