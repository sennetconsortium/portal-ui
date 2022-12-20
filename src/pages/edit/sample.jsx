import React, {useEffect, useState, useContext} from "react";
import {useRouter} from 'next/router';
import 'bootstrap/dist/css/bootstrap.css';
import {Button, Form} from 'react-bootstrap';
import {Layout} from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import AncestorId from "../../components/custom/edit/sample/AncestorId";
import SampleCategory from "../../components/custom/edit/sample/SampleCategory";
import AncestorInformationBox from "../../components/custom/edit/sample/AncestorInformationBox";
import log from "loglevel";
import {
    cleanJson,
    fetchEntity,
    getDOIPattern,
    getHeaders,
    getRequestHeaders
} from "../../components/custom/js/functions";
import AppNavbar from "../../components/custom/layout/AppNavbar";
import {update_create_entity, parseJson, get_ancestor_organs} from "../../lib/services";
import Unauthorized from "../../components/custom/layout/Unauthorized";
import AppFooter from "../../components/custom/layout/AppFooter";
import GroupSelect from "../../components/custom/edit/GroupSelect";
import Header from "../../components/custom/layout/Header";
import RuiIntegration from "../../components/custom/edit/sample/rui/RuiIntegration";
import RUIButton from "../../components/custom/edit/sample/rui/RUIButton";
import AppContext from '../../context/AppContext'
import {EntityProvider} from '../../context/EntityContext'
import EntityContext from '../../context/EntityContext'
import Spinner from '../../components/custom/Spinner'
import {ENTITIES, SAMPLE_CATEGORY} from '../../config/constants'
import EntityHeader from '../../components/custom/layout/entity/Header'
import EntityFormGroup from "../../components/custom/layout/entity/FormGroup";
import Alert from "../../components/custom/Alert";
import {getEntityEndPoint, getUserName, isOrganRuiSupported} from "../../config/config";


function EditSample() {
    const {
        isUnauthorized, isAuthorizing, getModal, setModalDetails,
        data, setData,
        error, setError,
        values, setValues,
        errorMessage, setErrorMessage,
        validated, setValidated,
        userWriteGroups,
        editMode, setEditMode, isEditMode,
        showModal,
        selectedUserWriteGroupUuid,
        disableSubmit, setDisableSubmit
    } = useContext(EntityContext)
    const {_t} = useContext(AppContext)
    const router = useRouter()
    const [source, setSource] = useState(null)
    const [sourceId, setSourceId] = useState(null)
    const [ruiLocation, setRuiLocation] = useState('')
    const [showRui, setShowRui] = useState(false)
    const [showRuiButton, setShowRuiButton] = useState(false)
    const [ancestorOrgan, setAncestorOrgan] = useState([])
    const [sampleCategories, setSampleCategories] = useState(null)
    const [organ_group_hide, set_organ_group_hide] = useState('none')
    const [organ_other_hide, set_organ_other_hide] = useState('none')

    useEffect(() => {
        const fetchSampleCategories = async () => {
            setSampleCategories(null)
            if (source !== null) {
                const entityType = source.entity_type.toLowerCase()
                let body = {entity_type: entityType}
                if (entityType === 'sample') {
                    const sample_category = source.sample_category.toLowerCase()
                    body['sample_category'] = sample_category
                    if (sample_category === 'organ') {
                        body['value'] = source.organ
                    }
                }
                const requestOptions = {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(body)
                }
                const response = await fetch(getEntityEndPoint() + 'constraints?' + new URLSearchParams({relationship_direction: 'descendants'}), requestOptions)
                if (response.ok) {
                    const provenance_constraints = await response.json()
                    provenance_constraints.forEach(constraint => {
                        if (constraint.entity_type.toLowerCase() === 'sample') {
                            const filter = Object.entries(SAMPLE_CATEGORY).filter(sample_category => constraint.sample_category.includes(sample_category[0]));
                            let sample_categories = {}
                            filter.forEach(entry => sample_categories[entry[0]] = entry[1])
                            setSampleCategories(sample_categories)
                        }
                    })
                }
            }
        }
        fetchSampleCategories()
        resetSampleCategory()
    }, [source])

    // only executed on init rendering, see the []
    useEffect(() => {

        // declare the async data fetching function
        const fetchData = async (uuid) => {
            log.debug('editSample: getting data...', uuid)
            // get the data from the api
            const response = await fetch("/api/find?uuid=" + uuid, getRequestHeaders());
            // convert the data to json
            const data = await response.json();

            log.debug('editSample: Got data', data)
            if (data.hasOwnProperty("error")) {
                setError(true)
                setErrorMessage(data["error"])
            } else {
                setData(data);
                // Set state with default values that will be PUT to Entity API to update
                setValues({
                    'sample_category': data.sample_category,
                    'organ': data.organ,
                    'organ_other': data.organ_other,
                    'protocol_url': data.protocol_url,
                    'lab_tissue_sample_id': data.lab_tissue_sample_id,
                    'description': data.description,
                    'direct_ancestor_uuid': data.immediate_ancestors[0].uuid
                })
                setEditMode("Edit")

                if (data.hasOwnProperty("immediate_ancestors")) {
                    await fetchSource(data.immediate_ancestors[0].uuid);
                }

                let ancestor_organ = await get_ancestor_organs(data.uuid)
                setAncestorOrgan(ancestor_organ)

                if (data['rui_location'] !== undefined) {
                    setRuiLocation(data['rui_location'])
                    setShowRuiButton(true)
                }
            }
        }

        if (router.query.hasOwnProperty("uuid")) {
            if (router.query.uuid === 'create') {
                setData(true)
                setEditMode("Create")
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
    const onChange = (e, fieldId, value) => {
        // log.debug('onChange', fieldId, value)
        // use a callback to find the field in the value list and update it
        setValues((previousValues) => {
            if (previousValues !== null) {
                return {...previousValues, [fieldId]: value}
            } else {
                return {
                    [fieldId]: value
                }
            }
        });
    };

    const resetSampleCategory = () => {
        if (Object.hasOwn(values, 'sample_category')) {
            delete values['sample_category']
        }
        if (Object.hasOwn(values, 'organ')) {
            delete values['organ']
        }
        if (Object.hasOwn(values, 'organ_other')) {
            delete values['organ_other']
        }
        setValues(values)
        set_organ_group_hide('none')
        set_organ_other_hide('none')

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
            }
            setAncestorOrgan(ancestor_organ)
        }
    }

    const checkRui = () => {
        // Define logic to show RUI tool
        // An ancestor must be a Sample with Sample Category: "Organ" and Organ Type that exists in isOrganRuiSupported
        // This Sample must a Sample Category: "Block"
        log.debug(ancestorOrgan)
        if (ancestorOrgan.length > 0) {
            if (values !== null && values['sample_category'] === 'block' && isOrganRuiSupported(ancestorOrgan)) {
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

    const handleSubmit = async (event) => {
        setDisableSubmit(true);

        const form = event.currentTarget.parentElement;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            log.debug("Form is invalid")
            setDisableSubmit(false);
        } else {
            event.preventDefault();
            log.debug("Form is valid")

            if (values['group_uuid'] === null && editMode === 'Create') {
                values['group_uuid'] = selectedUserWriteGroupUuid
            }

            if (ruiLocation !== '') {
                values['rui_location'] = parseJson(ruiLocation)
            }

            // Remove empty strings
            let json = cleanJson(values);
            let uuid = data.uuid


            await update_create_entity(uuid, json, editMode, ENTITIES.sample, router).then((response) => {
                setModalDetails({
                    entity: ENTITIES.sample, type: response.sample_category,
                    typeHeader: _t('Sample Category'), response
                })

            }).catch((e) => log.error(e))
        }

        setValidated(true);
    };


    if (isAuthorizing() || isUnauthorized()) {
        return (
            isUnauthorized() ? <Unauthorized/> : <Spinner/>
        )
    } else {
        return (
            <>
                {editMode &&
                    <Header title={`${editMode} Sample | SenNet`}></Header>
                }

                <AppNavbar/>

                {error &&
                    <Alert message={errorMessage}/>
                }
                {showRui &&
                    <RuiIntegration
                        organ={ancestorOrgan}
                        sex={'male'}
                        user={getUserName()}
                        blockStartLocation={ruiLocation}
                        setRuiLocation={setRuiLocation}
                        setShowRui={setShowRui}
                    />
                }

                {data && !error &&
                    <div className="no_sidebar">
                        <Layout
                            bodyHeader={
                                <EntityHeader entity={ENTITIES.sample} isEditMode={isEditMode()} data={data}/>

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
                                            entity_type={'sample'}/>
                                    }

                                    {/*Ancestor ID*/}
                                    {/*editMode is only set when page is ready to load */}
                                    {editMode &&
                                        <AncestorId source={source} onChange={onChange} fetchSource={fetchSource}/>
                                    }

                                    {/*Source Information Box*/}
                                    {source &&
                                        <AncestorInformationBox ancestor={source}/>
                                    }

                                    {/*/!*Tissue Sample Type*!/*/}

                                    {((isEditMode() && source) || (editMode === 'Create')) &&
                                        <>
                                            <SampleCategory
                                                organ_group_hide={organ_group_hide}
                                                set_organ_group_hide={set_organ_group_hide}
                                                organ_other_hide={organ_other_hide}
                                                set_organ_other_hide={set_organ_other_hide}
                                                sample_categories={sampleCategories === null ? SAMPLE_CATEGORY : sampleCategories}
                                                data={values}
                                                source={source}
                                                onChange={onChange}/>
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
                                                     onChange={onChange}
                                                     text='The protocol used when procuring or preparing the tissue. This must be provided as a protocols.io DOI URL see https://www.protocols.io/'/>

                                    {/*/!*Lab Sample ID*!/*/}
                                    <EntityFormGroup label='Lab Sample ID' placeholder='Lab specific alpha-numeric ID'
                                                     controlId='lab_tissue_sample_id'
                                                     value={data.lab_tissue_sample_id}
                                                     onChange={onChange} text='An identifier used by the lab to identify the specimen, this
                                        can be an identifier from the system used to track the specimen in the lab. This field will be entered by the user.'/>


                                    {/*/!*Description*!/*/}
                                    <EntityFormGroup label='Description' type='textarea' controlId='description'
                                                     value={data.description}
                                                     onChange={onChange}
                                                     text='A free text description of the specimen.'/>


                                    <Button variant="outline-primary rounded-0 js-btn--submit" onClick={handleSubmit}
                                            disabled={disableSubmit}>
                                        {_t('Submit')}

                                    </Button>
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

EditSample.withWrapper = function (page) {
    return <EntityProvider>{page}</EntityProvider>
}

export default EditSample