import React, {useEffect, useRef, useState, useContext} from 'react';
import {styled} from '@mui/material/styles';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import VerifiedIcon from '@mui/icons-material/Verified';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StepConnector, {stepConnectorClasses} from '@mui/material/StepConnector';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {Button} from "react-bootstrap";
import {Alert, Container, Grid} from "@mui/material";
import {Row, Col} from "react-bootstrap";
import {Download, ArrowRightSquareFill} from "react-bootstrap-icons";
import {getAuth, getIngestEndPoint} from "../../../config/config";
import Spinner from "../Spinner";
import AppFooter from "../layout/AppFooter";
import GroupsIcon from '@mui/icons-material/Groups';
import GroupSelect from "../edit/GroupSelect";
import AppModal from "../../AppModal";
import {formatErrorColumn, tableColumns, formatErrorColumnTimer, getErrorList} from "../edit/MetadataUpload";
import DataTable from 'react-data-table-component';
import {equals} from "../js/functions";
import AppContext from "../../../context/AppContext";
import {get_headers, get_auth_header} from "../../../lib/services";


export default function BulkCreate({
                                       entityType,
                                       subType,
                                       exampleFileName,
                                       bulkUploadUrl,
                                       bulkUrl,
                                       userWriteGroups,
                                       handleHome,
                                       isMetadata=false,
                                   }) {
    const buttonVariant = "btn btn-outline-primary rounded-0"
    const inputFileRef = useRef(null)
    const [activeStep, setActiveStep] = useState(0)
    const [file, setFile] = useState(null)
    const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true)
    const [tempId, setTempId] = useState(null)
    const [error, setError] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [validationSuccess, setValidationSuccess] = useState(null)
    const [bulkSuccess, setBulkSuccess] = useState(null)
    const [bulkResponse, setBulkResponse] = useState([])
    const [isLoading, setIsLoading] = useState(null)
    const stepLabels = ['Attach Your File', 'Review Validation', 'Complete']
    const [steps, setSteps] = useState(stepLabels)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showModal, setShowModal] = useState(true)
    const {cache} = useContext(AppContext)

    const ColorlibConnector = styled(StepConnector)(({theme}) => ({
        [`&.${stepConnectorClasses.alternativeLabel}`]: {
            top: 22,
        },
        [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundImage:
                    'linear-gradient(128deg, rgba(0,212,255,1) 0%, rgba(154,102,167,1) 60%, rgba(154,102,167,1) 100%)',
            },
        },
        [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundImage:
                    'linear-gradient(128deg, rgba(0,212,255,1) 0%, rgba(154,102,167,1) 60%, rgba(154,102,167,1) 100%)',
            },
        },
        [`& .${stepConnectorClasses.line}`]: {
            height: 3,
            border: 0,
            backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
            borderRadius: 1,
        },
    }))

    const ColorlibStepIconRoot = styled('div')(({theme, ownerState}) => ({
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
        zIndex: 1,
        color: '#fff',
        width: 50,
        height: 50,
        display: 'flex',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        ...(ownerState.active && {
            backgroundImage:
                'linear-gradient(128deg, rgba(0,212,255,1) 0%, rgba(154,102,167,1) 60%, rgba(154,102,167,1) 100%)',
            boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
        }),
        ...(ownerState.completed && {
            backgroundImage:
                'linear-gradient(128deg, rgba(0,212,255,1) 0%, rgba(154,102,167,1) 60%, rgba(154,102,167,1) 100%)',
        }),
    }))

    function ColorlibStepIcon(props) {
        const {active, completed, className} = props;
        let icons
        if (userWriteGroups && getUserWriteGroupsLength() > 1) {
            icons = {
                1: <AttachFileIcon/>,
                2: <VerifiedIcon/>,
                3: <GroupsIcon/>,
                4: <DoneOutlineIcon/>,
            }
        } else {
            icons = {
                1: <AttachFileIcon/>,
                2: <VerifiedIcon/>,
                3: <DoneOutlineIcon/>,
            }
        }

        return (
            <ColorlibStepIconRoot ownerState={{completed, active}} className={className}>
                {icons[String(props.icon)]}
            </ColorlibStepIconRoot>
        );
    }

    useEffect(() => {
        if (userWriteGroups && getUserWriteGroupsLength() > 1) {
            if (isMetadata) {
                setSteps(stepLabels)
            } else {
                let extraSteps = Array.from(stepLabels)
                const lastStep = extraSteps.pop()
                extraSteps.push('Select group')
                extraSteps.push(lastStep)
                setSteps(extraSteps)
            }
        }
        if (userWriteGroups && getUserWriteGroupsLength() === 1) {
            setSelectedGroup(userWriteGroups[0].uuid)
        }
    }, [userWriteGroups])

    const getEntityValidationUrl = () => {
        return `${getIngestEndPoint()}${entityType}s/bulk/validate`
    }

    const getEntityRegistrationUrl = () => {
        return `${getIngestEndPoint()}${entityType}s/bulk/register`
    }

    const getMetadataValidationUrl = () => {
        return `${getIngestEndPoint()}metadata/validate`
    }

    async function metadataValidation() {
        setIsLoading(true)
        const formData = new FormData()
        formData.append('metadata', file)
        formData.append('entity_type', cache.entities[entityType])
        formData.append('sub_type', subType)
        formData.append('validate_uuids', '1')
        formData.append('ui_type', 'gui')
        const requestOptions = {
            method: 'POST',
            headers: get_auth_header(),
            body: formData
        }
        const response = await fetch(getMetadataValidationUrl(), requestOptions)
        const data = await response.json()
        if (!response.ok) {
            setError({1: true})
            const errorList = getErrorList(data)
            setErrorMessage(errorList)
            formatErrorColumnTimer('`')
        } else {
            setTempId(data.description)
            setValidationSuccess(true)
            setIsNextButtonDisabled(false)
        }
        setIsLoading(false)
    }

    // This makes a request to ingest-api, validating the upload
    async function entityValidation() {
        setIsLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        const requestOptions = {
            method: 'POST',
            headers: get_auth_header(),
            body: formData
        }
        const response = await fetch(getEntityValidationUrl(), requestOptions)
        const data = await response.json()
        if (!response.ok) {
            setError({1: true})
            setErrorMessage(data.description)
            formatErrorColumnTimer('`')
        } else {
            setTempId(data.description.temp_id)
            setValidationSuccess(true)
            setIsNextButtonDisabled(false)
        }
        setIsLoading(false)
    }

    async function entityRegistration() {
        setIsLoading(true)
        const body = {temp_id: tempId, group_uuid: selectedGroup}
        const requestOptions = {
            method: 'POST',
            headers: get_headers(),
            body: JSON.stringify(body)
        }
        // const response = await fetch(getEntityRegistrationUrl(), requestOptions)
        // const data = await response.json()
        if (false) { //if (!response.ok) {
            setError(getStepsLength() === 3 ? {2: true} : {3: true})
            setIsNextButtonDisabled(true)
            setErrorMessage(data.description)
        } else {
            let dummyResponse = {"code":200,"description":{"1":{"created_by_user_displayname":"Lisa-Ann Bruney","created_by_user_email":"LIB118@pitt.edu","created_by_user_sub":"cd17bfa7-24fd-49ca-82ec-2d456ba53730","created_timestamp":1680890041829,"data_access_level":"consortium","description":"ww2 whip","entity_type":"Sample","group_name":"University of Michigan TDA","group_uuid":"7fe86fe2-ee72-11ec-b04f-67218ab1b594","lab_tissue_sample_id":"19-002","last_modified_timestamp":1680890041829,"last_modified_user_displayname":"Lisa-Ann Bruney","last_modified_user_email":"LIB118@pitt.edu","last_modified_user_sub":"cd17bfa7-24fd-49ca-82ec-2d456ba53730","organ":"BR","sample_category":"organ","sennet_id":"SNT297.NZPK.294","uuid":"4accfc4d40087f15012621512bfaae24"}},"name":"OK"}
            setBulkSuccess(true)
            setBulkResponse(dummyResponse.description)
            //setBulkResponse(data.description)
            setIsNextButtonDisabled(false)
        }
        setIsLoading(false)
    }

    function getUserWriteGroupsLength() {
        return userWriteGroups.length
    }

    function getStepsLength() {
        return steps.length
    }

    const onChange = (e, fieldId, value) => {
        setSelectedGroup(value)
        setIsNextButtonDisabled(false)
    }

    const onRegisterNext = () => {
        setIsNextButtonDisabled(true)
        if (getStepsLength() === 3) {
            if (activeStep === 0) {
                entityValidation()
            } else if (activeStep === 1) {
                entityRegistration()
            } else if (activeStep === 2) {
                handleReset()
                return
            }
        } else {
            if (activeStep === 0) {
                entityValidation()
            } else if (activeStep === 2) {
                entityRegistration()
            } else if (activeStep === 3) {
                handleReset()
                return
            }
        }
        setActiveStep(prevState => prevState + 1)
    }

    const onMetadataNext = () => {
        setIsNextButtonDisabled(true)
        if (getStepsLength() === 3) {
            if (activeStep === 0) {
                metadataValidation()
            } else if (activeStep === 1) {
                entityRegistration()
            } else if (activeStep === 2) {
                handleReset()
                return
            }
        }
        setActiveStep(prevState => prevState + 1)
    }

    const handleNext = () => {
        if (isMetadata) {
            onMetadataNext()
        } else {
            onRegisterNext()
        }
    }

    const handleBack = () => {
        setIsNextButtonDisabled(true)
        setError(null)
        setErrorMessage(null)
        setFile(null)
        setSelectedGroup(null)
        if (activeStep !== 0) {
            setActiveStep(prevState => prevState - 1)
        }
    }

    const handleReset = () => {
        setActiveStep(0)
        setTempId(null)
        setError(null)
        setFile(null)
        setErrorMessage(null)
        setValidationSuccess(null)
        setBulkSuccess(null)
        setIsNextButtonDisabled(true)
        setSelectedGroup(null)
        setShowModal(true)
    }

    function handleFileChange(event) {
        const fileObj = event.target.files && event.target.files[0]
        if (!fileObj) {
            return
        }
        setFile(fileObj)
        event.target.value = null
        setIsNextButtonDisabled(false)
    }

    function handleBrowseFilesClick() {
        inputFileRef.current.click()
    }

    function isStepFailed(index) {
        return error !== null && error[index] !== null && error[index] === true
    }

    function getModalBody() {
        let body = []
        // body.push(
        //     <p>Your <code>{cache.entities[entityType]}s</code> were {getVerb(true, true)}:</p>
        // )
        body.push(<p>
            <strong>Group Name:</strong>  {bulkResponse[1].group_name}
        </p>)
        let typeCol;
        let labIdCol
        if (equals(entityType, cache.entities.source)) {
            typeCol = 'source_type'
            labIdCol = 'lab_source_id'
        } else if (equals(entityType, cache.entities.sample)) {
            typeCol = 'sample_category'
            labIdCol = 'lab_tissue_sample_id'
        } else {
            typeCol = 'data_types'
            labIdCol = 'lab_dataset_id'
        }
        let columns = [{
                name: 'lab_id',
                selector: row => row[labIdCol],
                sortable: true,
                width: '150px'
            },
            {
                name: 'sennet_id',
                selector: row => row.sennet_id,
                sortable: true,
                width: '170px'
            },
            {
                name: typeCol,
                selector: row => row[typeCol],
                sortable: true,
                width: '160px'
            }
        ]

        if (equals(entityType, cache.entities.sample)) {
            columns.push({
                name: 'organ_type',
                selector: row => row.organ ? row.organ : '',
                sortable: true,
                width: '150px'
            })
        }

        let tableData = Object.values(bulkResponse)
        body.push(
            <DataTable columns={columns} data={tableData} pagination />
        )

        let categories = []
        Object.values(bulkResponse).map(each => {
            categories.push(each[typeCol])
        })

        if (categories.length === 1) {
            body.push(
                <Row className={'mt-4 text-right'}>

                    <Col>
                        <button className={'btn btn-outline-primary rounded-0'}>Download registered data <Download /></button>
                        <button className={'btn btn-primary rounded-0'}>Continue to metadata upload <ArrowRightSquareFill /></button></Col>

                </Row>
            )
        }
        return body;
    }

    // function getModalBodyOld() {
    //     let body = `Your ${cache.entities[entityType]}s were ${getVerb(true, true)}:\n`
    //     if (equals(entityType, cache.entities.source)) {
    //         body += `Source types: \n${Array.from(new Set(Object.values(bulkResponse).map(each =>
    //             '\t' + each.source_type.charAt(0).toUpperCase() + each.source_type.slice(1) + '\n'
    //         )))}`
    //     } else if (equals(entityType, cache.entities.sample)) {
    //         body += `Sample categories: \n${Array.from(new Set(Object.values(bulkResponse).map(each => {
    //                 let organ_type = null
    //                 if (equals(each.sample_category, cache.sampleCategories.Organ)) {
    //                     organ_type = each.organ
    //                 }
    //                 let result = '\t' + each.sample_category.charAt(0).toUpperCase() + each.sample_category.slice(1)
    //                 if (organ_type !== null) {
    //                     result += ` (${organ_type})` + '\n'
    //                 } else {
    //                     result += '\n'
    //                 }
    //                 return result
    //             }
    //         )))}`
    //     } else if (equals(entityType, cache.entities.dataset)) {
    //         body += `Data types: \n${Array.from(new Set(Object.values(bulkResponse).map(each =>
    //             '\t' + each.data_types[0].charAt(0).toUpperCase() + each.data_types[0].slice(1) + '\n'
    //         )))}`
    //     }
    //
    //     body += 'Group Name: ' + bulkResponse[1].group_name + '\n' + 'SenNet IDs: \n' + Object.values(bulkResponse).map(each => '\t' + each.sennet_id + '\n')
    //     return body.replace(/,/g, '')
    // }

    const isAtLastStep = () => {
        return (activeStep === 2 && getStepsLength() === 3 || activeStep === 3 && getStepsLength() === 4)
    }

    const getVerb = (past = false, lowercase = false) => {
        let verb = isMetadata ? 'Upload' : 'Register'
        verb = past ? `${verb}ed` : verb
        return lowercase ? verb.toLowerCase() : verb
    }

    const getTitle = () => {
        const entity = cache.entities[entityType]
        let title = `${getVerb()} ${entity}s`
        if (isMetadata) {
            title = `${getVerb()} ${entity} ${subType}s' Metadata`
        }
        return title
    }

    const getFilename = () => {
        let filename = `example_${entityType}`
        return isMetadata ? `${filename}_${subType}_metadata` : filename
    }

    return (
        <div>
            <Container sx={{mt: 5}}>
                <Box sx={{
                    backgroundColor: 'white',
                    padding: 5,
                    boxShadow: 3,
                }}>
                    <a
                        download
                        className={buttonVariant}
                        href={`/${getFilename().toLowerCase()}.tsv`}
                    >
                        <FileDownloadIcon/> {' '} EXAMPLE.TSV
                    </a>
                    <h1 className={'text-center'}>{getTitle()}</h1>
                    <div className={'p-4 text-center'}>To register multiple items at one time, upload a tsv file in the
                        format specified by the example file.
                    </div>
                    <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector/>}>
                        {
                            steps.map((label, index) => {
                                const labelProps = {}
                                if (isStepFailed(index)) {
                                    labelProps.optional = (
                                        <Typography variant="caption" color="error">
                                            Failed
                                        </Typography>
                                    )
                                    labelProps.error = true
                                }
                                return (<Step key={label}>
                                    <StepLabel StepIconComponent={ColorlibStepIcon} {...labelProps}>{label}</StepLabel>
                                </Step>)
                            })
                        }
                    </Stepper>
                    {isLoading && <Spinner/>}
                    {
                        errorMessage && <div className='c-metadataUpload__table table-responsive has-error'>
                            <DataTable columns={tableColumns} data={isMetadata ? errorMessage.data : errorMessage} pagination />
                        </div>
                    }
                    {activeStep === 1 && !errorMessage && validationSuccess &&
                        <Alert severity="success" sx={{m: 2}}>
                            Validation successful please continue onto the next step
                        </Alert>}
                    {
                        isAtLastStep() && !errorMessage && bulkSuccess &&
                        <AppModal
                            modalTitle={`${cache.entities[entityType]}s ${getVerb(true, true)}`}
                            modalBody={getModalBody()}
                            modalSize='lg'
                            showModal={showModal}
                            handleHome={handleHome}
                            handleClose={() => setShowModal(false)}
                            showCloseButton={true}
                        />
                    }
                    {
                        !isMetadata && activeStep === 2 && userWriteGroups && getUserWriteGroupsLength() > 1 &&
                        <Grid container className={'text-center mt-5'}>
                            <Grid item xs></Grid>
                            <Grid item xs>
                                <GroupSelect
                                    groups={userWriteGroups}
                                    onGroupSelectChange={onChange}
                                    entity_type={entityType}
                                    plural={true}
                                />
                            </Grid>
                            <Grid item xs></Grid>
                        </Grid>
                    }
                    <Grid container spacing={3} className={'text-center mt-3'}>
                        <Grid item xs>
                            <Button
                                variant={'outline-dark rounded-0'}
                                disabled={activeStep === 0 || activeStep === getStepsLength() - 1}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                        </Grid>
                        <Grid item xs>
                            {
                                activeStep === 0 &&
                                <>
                                    <input
                                        style={{display: 'none'}}
                                        type={'file'}
                                        ref={inputFileRef}
                                        onChange={handleFileChange}
                                    />
                                    <Button variant={'outline-success rounded-0'}
                                            onClick={handleBrowseFilesClick}>
                                        Browse files
                                    </Button>{' '}
                                    {file && file.name}
                                </>
                            }
                        </Grid>
                        <Grid item xs>
                            <Button
                                variant={buttonVariant}
                                onClick={handleNext}
                                disabled={isNextButtonDisabled}
                            >
                                {activeStep === getStepsLength() - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
            <AppFooter
                isFixedBottom={!error}
            />
        </div>
    );
}
