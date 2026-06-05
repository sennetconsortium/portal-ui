import dynamic from "next/dynamic";
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { Layout } from '@elastic/react-search-ui-views'
import log from 'xac-loglevel'
import _ from 'lodash';
import { callService, filterProperties, getEntityData, update_create_entity } from '@/lib/services'
import { cleanJson, eq} from '@/components/custom/js/functions'
import AppContext from '@/context/AppContext'
import EntityContext, { EntityProvider } from "@/context/EntityContext";
import { getEntityEndPoint, getIngestEndPoint, valid_dataset_ancestor_config } from "@/config/config";
import $ from 'jquery';
import SenNetPopover from "@/components/SenNetPopover"
import AttributesUpload, { getResponseList } from "@/components/custom/edit/AttributesUpload";

const DataTable = dynamic(() => import('react-data-table-component'), {
    ssr: false,
});
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const AncestorIdsBulkButton = dynamic(() => import('@/components/custom/edit/dataset/AncestorIdsBulkButton'))
const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const EntityHeader = dynamic(() => import('@/components/custom/layout/entity/Header'))
const EntityFormGroup = dynamic(() => import('@/components/custom/layout/entity/FormGroup'))
const GroupSelect = dynamic(() => import("@/components/custom/edit/GroupSelect"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))

export default function EditCollection({ collectionType = 'Collection', entitiesTableLabel = 'Entities', entitiesButtonLabel = 'entity' }) {
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
        entityForm,
        getCancelBtn,
        contactsTSV, contacts, setContacts, contributors, setContactsAttributes, setContactsAttributesOnFail
    } = useContext(EntityContext)
    const { _t, adminGroup, getBusyOverlay, toggleBusyOverlay, getPreviewView } = useContext(AppContext)
    const router = useRouter()
    const [ancestors, setAncestors] = useState(null)

    useEffect(() => {
        async function fetchAncestorConstraints() {
            const fullBody = [
                {
                    descendants: [{
                        entity_type: collectionType
                    }]
                }
            ]

            const response = await getEntityConstraints(fullBody, { order: 'descendants', filter: 'search' })
            if (response.ok) {
                const body = await response.json()
                const searchQuery = body.description[0].description

                // Build includeFilters from constraints response
                const includeFilters = []
                for (const query of searchQuery) {
                    const idx = includeFilters.findIndex((filter) => filter.field === query.keyword)
                    if (idx > -1) {
                        includeFilters[idx].values.push(query.value)
                    } else {
                        includeFilters.push({
                            'type': 'term',
                            'field': query.keyword,
                            'values': [query.value]
                        })
                    }
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
                Object.assign(_data, { entities })
                setData(_data)

                if (entities) {
                    const uuids = entities.map((entity) => entity.uuid)
                    setValues(prevValue => ({ ...prevValue, entity_uuids: uuids }))
                    setAncestors(entities)
                }
            }).catch(log.error)

            if (_data.contacts) {
                setContacts({ description: { records: _data.contacts, headers: contactsTSV.headers } })
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

    if (isPreview(error)) {
        return getPreviewView(data)
    } else {

        return (
            <>
                {editMode && (
                    <Header
                        title={`${editMode} ${collectionType} | SenNet`}
                    ></Header>
                )}

                <AppNavbar />

                {error && (
                    <div>
                        <Alert variant='warning'>{_t(errorMessage)}</Alert>
                    </div>
                )}
                {data && !error && (
                    <div className='no_sidebar'>
                        <Layout
                            bodyHeader={
                                <EntityHeader
                                    entity={collectionType}
                                    isEditMode={isEditMode()}
                                    data={data}
                                    values={values}
                                    adminGroup={adminGroup}
                                />
                            }
                            bodyContent={
                                <Form
                                    noValidate
                                    validated={validated}
                                    id='collection-form'
                                    ref={entityForm}
                                >
                                    {/*Group select*/}
                                    {!(
                                        userWriteGroups.length === 1 ||
                                        isEditMode()
                                    ) && (
                                        <GroupSelect
                                            data={data}
                                            groups={userWriteGroups}
                                            onGroupSelectChange={onChange}
                                            entity_type={'dataset'}
                                        />
                                    )}

                                    {/*Linked Datasets*/}
                                    <AncestorIdsBulkButton
                                        setAncestors={setAncestors}
                                        data={data}
                                        values={values}
                                        ancestors={ancestors}
                                        onChange={onChange}
                                    />

                                    {/*/!*Lab Name or ID*!/*/}
                                    <EntityFormGroup
                                        label='Title'
                                        placeholder='The title of the collection'
                                        controlId='title'
                                        value={data.title}
                                        isRequired={true}
                                        onChange={onChange}
                                        popoverHelpText={
                                            <>
                                                The title of the{' '}
                                                <code>Collection</code>.
                                            </>
                                        }
                                    />

                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup
                                        label='Description'
                                        type='textarea'
                                        controlId='description'
                                        isRequired={true}
                                        value={data.description}
                                        onChange={onChange}
                                        popoverHelpText={
                                            <>
                                                An abstract publicly available
                                                when the <code>Collection</code>{' '}
                                                is published.
                                            </>
                                        }
                                    />

                                    <AttributesUpload
                                        ingestEndpoint={
                                            contactsTSV.uploadEndpoint
                                        }
                                        showAllInTable={true}
                                        setAttribute={setContactsAttributes}
                                        setAttributesOnFail={
                                            setContactsAttributesOnFail
                                        }
                                        entity={collectionType}
                                        excludeColumns={
                                            contactsTSV.excludeColumns
                                        }
                                        attribute={'Contributors'}
                                        title={<h6>Contributors</h6>}
                                        customFileInfo={
                                            <span>
                                                <a
                                                    className='btn btn-outline-primary rounded-0 fs-8'
                                                    download
                                                    href={
                                                        'https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv'
                                                    }
                                                >
                                                    {' '}
                                                    <FileDownloadIcon />
                                                    EXAMPLE.TSV
                                                </a>
                                            </span>
                                        }
                                    />

                                    {/*This table is just for showing data.contributors list in edit mode. Regular table from AttributesUpload will show if user uploads new file*/}
                                    {isEditMode &&
                                        !contributors.description &&
                                        data.contributors && (
                                            <div className='c-metadataUpload__table table-responsive'>
                                                <h6>Contributors</h6>
                                                <DataTable
                                                    columns={
                                                        getResponseList(
                                                            {
                                                                headers:
                                                                    contactsTSV.headers
                                                            },
                                                            contactsTSV.excludeColumns
                                                        ).columns
                                                    }
                                                    data={data.contributors}
                                                    pagination
                                                />
                                            </div>
                                        )}

                                    <div className={'d-flex flex-row-reverse'}>
                                        {getCancelBtn('collection')}

                                        {!data.doi_url && (
                                            <SenNetPopover
                                                text={
                                                    <>
                                                        Save changes to this{' '}
                                                        <code>Collection</code>.
                                                    </>
                                                }
                                                className={'save-button'}
                                            >
                                                <Button
                                                    variant='outline-primary rounded-0 js-btn--save'
                                                    className={'me-2'}
                                                    onClick={handleSave}
                                                    disabled={disableSubmit}
                                                >
                                                    {_t('Save')}
                                                </Button>
                                            </SenNetPopover>
                                        )}

                                        {isEditMode() &&
                                            adminGroup &&
                                            !data.registered_doi && (
                                                <SenNetPopover
                                                    text={
                                                        <>
                                                            Save changes to this{' '}
                                                            <code>
                                                                Collection
                                                            </code>
                                                            .
                                                        </>
                                                    }
                                                    className={'publish-button'}
                                                >
                                                    <Button
                                                        variant='outline-primary rounded-0 js-btn--publish'
                                                        className={'me-2'}
                                                        onClick={handlePublish}
                                                        disabled={disableSubmit}
                                                    >
                                                        {_t('Publish')}
                                                    </Button>
                                                </SenNetPopover>
                                            )}
                                    </div>
                                    {getModal()}
                                    {getBusyOverlay()}
                                </Form>
                            }
                        />
                    </div>
                )}
                {!showModal && <AppFooter />}
            </>
        )
    }
}

EditCollection.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}
