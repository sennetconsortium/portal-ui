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
import {getEntityData, update_create_entity} from '../../lib/services'
import {cleanJson, eq, fetchEntity, getIdRegEx, getRequestHeaders} from '../../components/custom/js/functions'
import AppContext from '../../context/AppContext'
import EntityContext, {EntityProvider} from '../../context/EntityContext'
import {valid_dataset_ancestor_config} from "../../config/config";
import $ from 'jquery'
import SenNetPopover, {SenPopoverOptions} from "../../components/SenNetPopover"
import AttributesUpload, {getResponseList} from "../../components/custom/edit/AttributesUpload";
import DataTable from "react-data-table-component";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from '@mui/material/Tooltip';
import Zoom from "@mui/material/Zoom"
import {CloseIcon} from "next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon";
import {CheckIcon} from "primereact/icons/check";

const AncestorIds = dynamic(() => import('../../components/custom/edit/dataset/AncestorIds'))
const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('../../components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('../../components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("../../components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const NotFound = dynamic(() => import("../../components/custom/NotFound"))

export default function EditCollection() {
    const {
        isPreview, isAuthorizing, getModal, setModalDetails, setSubmissionModal, setCheckDoiModal,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups, onChange,
        editMode, setEditMode, isEditMode,
        showModal, setShowModal,
        disableSubmit, setDisableSubmit,
        dataAccessPublic, setDataAccessPublic,
        getEntityConstraints, getCancelBtn,
        contactsTSV, contacts, setContacts, creators, setCreators, setContactsAttributes, setContactsAttributesOnFail
    } = useContext(EntityContext)
    const {_t, cache, adminGroup, isLoggedIn, getBusyOverlay, toggleBusyOverlay, getPreviewView} = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)
    const isPrimary = useRef(false)
    const [bulkAddField, setBulkAddField] = useState(false)
    const isBulkHandling = useRef(false)
    const [bulkErrorMessage, setBulkErrorMessage] = useState(null)
    const [bulkPopover, setBulkPopover] = useState(false)
    const bulkAddBtnTooltipDefault = <span>Toggle the field to bulk add comma separated SenNet ids or uuids.</span>
    const [bulkAddBtnTooltip, setBulkAddBtnTooltip] = useState(bulkAddBtnTooltipDefault)
    const [bulkAddTextareaVal, setBulkAddTextareaVal] = useState(null)
    const supportedEntities = [cache.entities.dataset, cache.entities.sample, cache.entities.source]

    useEffect(() => {
        async function fetchAncestorConstraints() {
            // TODO: maybe we want to add to entity-api constraints for Collection instead of hard coding here ...
            let searchFilters = []
            for (let e of supportedEntities) {
                searchFilters.push({
                        "keyword": "entity_type.keyword",
                        "value": e
                    }
                )
            }
            valid_dataset_ancestor_config['searchQuery']['includeFilters'] = searchFilters
        }

        fetchAncestorConstraints()
    }, [])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editCollection: getting data...', uuid)
            // get the data from the api
            const data = await getEntityData(uuid)

            log.debug('editCollection: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                setData(data)
                //isPrimary.current = isPrimaryAssay(data)
                let entity_uuids = []

                if (data.hasOwnProperty("entities")) {
                    for (const ancestor of data.entities) {
                        entity_uuids.push(ancestor.uuid)
                    }
                    await fetchLinkedEntity(entity_uuids)
                }

                if (data.contacts) {
                    setContacts({description: {records: data.contacts, headers: contactsTSV.headers}})
                }

                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'title': data.title,
                    'description': data.description,
                    'entity_uuids': entity_uuids,
                    'contacts': data.contacts,
                    'creators': data.creators
                })
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
            setAncestors(null)
        }
    }, [router]);

    async function fetchLinkedEntity(datasetUuids, errMsgs) {
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
                    setBulkErrorMessage(entity["error"])
                } else {
                    setError(true)
                    setErrorMessage(entity["error"])
                }
            } else {
                //TODO:
                if (supportedEntities.includes(entity.entity_type)) {
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
            entity: cache.entities.collection,
            type: response.title,
            typeHeader: _t('Title'),
            response
        })
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
            if (values['entity_uuids'] === undefined || values['entity_uuids'].length === 0) {
                event.stopPropagation();
                setDisableSubmit(false);
            } else {

                log.debug("Form is valid")


                if (!_.isEmpty(creators) && creators.description.records) {
                    values["creators"] = creators.description.records
                    values['contacts'] = contacts.description.records
                }

                // Remove empty strings
                let json = cleanJson(values);
                let uuid = data.uuid

                await update_create_entity(uuid, json, editMode, cache.entities.collection).then((response) => {
                    modalResponse(response)
                }).catch((e) => log.error(e))
            }
        }
        setValidated(true);
    };

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
        if (textareaVal) {
            let ids = textareaVal.split(',')
            ids = new Set(ids) // remove duplicates
            ids = Array.from(ids)
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
                errMsg = <span>The dataset{alreadyAdded.length > 1 ? 's' : ''}
                    <code>{alreadyAdded.join(',')}</code> {alreadyAdded.length > 1 ? 'have' : 'has'} already been added.</span>
            }
            if (invalidFormat.length) {
                errMsg = <>{errMsg}<span>Invalid dataset{invalidFormat.length > 1 ? 's' : ''} id format <code>{invalidFormat.join(',')}</code>.</span></>
            }
            let datasets = await fetchLinkedEntity(validIds, errMsg)
            if (datasets.length) {
                onChange(null, 'entity_uuids', datasets.map((item) => item.uuid))
            }
        }

    }

    // TODO: remove this return when ready to support
    return <NotFound/>

    if (isPreview(error) || (!isAuthorizing() && !adminGroup))  {
        return getPreviewView(data)
    } else {

        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Collection | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <div><Alert variant='warning'>{_t(errorMessage)}</Alert></div>
                }
                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={cache.entities.collection} isEditMode={isEditMode()} data={data}
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
                                                         Bulk add entities <i className="bi bi-plus-lg"></i>
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
                                                             <div className={'tooltip-content'}>{bulkErrorMessage}</div>
                                                         </>}
                                                     ><span>&nbsp;</span>
                                                     </Tooltip>
                                                     <textarea name='ancestor_ids'
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
                                                       onClick={handleBulkAdd}
                                                       className={`btn-add ${bulkAddField && bulkAddTextareaVal ? 'is-visible' : ''}`}> <CheckIcon/>
                                                 </span>
                                                     </SenNetPopover>}
                                                 </>}
                                                 formLabel={'entity'} formLabelPlural={'entities'} values={values}
                                                 ancestors={ancestors} onChange={onChange}
                                                 onShowModal={clearBulkPopover}
                                                 fetchAncestors={fetchLinkedEntity}
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
                                                      entity={cache.entities.collection} excludeColumns={contactsTSV.excludeColumns}
                                                      attribute={'Creators'} title={<h6>Creators</h6>}
                                                      customFileInfo={<span><a
                                                          className='btn btn-outline-primary rounded-0 fs-8' download
                                                          href={'https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv'}> <FileDownloadIcon/>EXAMPLE.TSV</a></span>}/>

                                    {/*This table is just for showing data.creators list in edit mode. Regular table from AttributesUpload will show if user uploads new file*/}
                                    {isEditMode && !creators.description && data.creators &&
                                        <div className='c-metadataUpload__table table-responsive'>
                                            <h6>Creators</h6>
                                            <DataTable
                                                columns={getResponseList({headers: contactsTSV.headers}, contactsTSV.excludeColumns).columns}
                                                data={data.creators}
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
