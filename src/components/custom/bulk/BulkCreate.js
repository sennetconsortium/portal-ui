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
import {Row, Col, Stack} from "react-bootstrap";
import {getDocsRootURL, getEntityEndPoint, getIngestEndPoint, getRootURL} from "../../../config/config";
import Spinner from "../Spinner";
import GroupsIcon from '@mui/icons-material/Groups';
import GroupSelect from "../edit/GroupSelect";
import AppModal from "../../AppModal";
import {tableColumns, getErrorList} from "../edit/AttributesUpload";
import DataTable from 'react-data-table-component';
import {createDownloadUrl, eq, getHeaders, getStatusColor} from "../js/functions";
import AppContext from "../../../context/AppContext";
import {get_headers, get_auth_header, update_create_entity} from "../../../lib/services";
import SenNetAlert from "../../SenNetAlert";


export default function BulkCreate({
                                       entityType,
                                       subType,
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
    const {cache, supportedMetadata} = useContext(AppContext)
    const [jobData, setJobData] = useState(null)
    const intervalTimer = useRef(null);

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

    const getMetadataRegistrationUrl = () => {
        return `${getIngestEndPoint()}metadata/register`
    }

    const jobHasFailed = (job) => ['error', 'failed'].contains(job.status)

    const mimicSocket = (data, cb) => {
        clearInterval(intervalTimer.current)
        intervalTimer.current = setInterval(async () => {
            let res = await fetch(getIngestEndPoint() + `jobs/${data.job_id}`, {method: 'GET', headers: getHeaders()})
            let job = await res.json()
            setJobData(job)
            if (eq(job.status, 'Complete')) {
                setIsLoading(false)
                if (!cb) {
                    setValidationSuccess(true)
                } else {
                    cb(job)
                }
                setIsNextButtonDisabled(false)
            }
            if (jobHasFailed(job)) {
                clearInterval(intervalTimer.current)
                setIsLoading(false)
            }
        }, 1000)
    }

    async function metadataCommitComplete(data) {
        let passes = []
        let fails = []
        clearInterval(intervalTimer.current)
        for (let item of data.results) {
            const requestOptions = {
                method: 'GET',
                headers: get_auth_header(),
            }
            let {typeCol, labIdCol} = getColNames()
            const response = await fetch(`${getEntityEndPoint()}entities/${item.uuid}`, requestOptions)
            let entity = await response.json()
            let result = {uuid: item.uuid, sennet_id: entity.sennet_id, [labIdCol]: entity[labIdCol], [typeCol]: entity[typeCol]}
            if (item.success){
                passes.push(result)
            } else {
                fails.push(result)
            }
        }
        setIsLoading(false)
        setBulkSuccess({fails, passes})
    }

    async function metadataValidation() {
        setIsLoading(true)
        const formData = new FormData()
        formData.append('metadata', file)
        formData.append('entity_type', cache.entities[entityType])
        formData.append('sub_type', subType)
        formData.append('validate_uuids', '1')
        formData.append('referrer', JSON.stringify({
            type: 'validate',
            path: window.location.pathname + window.location.search
        }))
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
        } else {
            setBulkResponse(data)
            mimicSocket(data)
        }
    }

    async function metadataCommit() {
        clearInterval(intervalTimer.current)
        setIsLoading(true)
        const requestOptions = {
            method: 'POST',
            headers: get_headers(),
            body: JSON.stringify({
                job_id: jobData.job_id,
                referrer: {
                    type: 'register',
                    path: jobData.referrer.path + `&job_id=${jobData.job_id}`
                }
            })
        }
        let response = await fetch(getMetadataRegistrationUrl(), requestOptions)
        const data = await response.json()
        mimicSocket(data, metadataCommitComplete)
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
        const response = await fetch(getEntityRegistrationUrl(), requestOptions)
        const data = await response.json()
        if (!response.ok) {
            setError(getStepsLength() === 3 ? {2: true} : {3: true})
            setIsNextButtonDisabled(true)
            setErrorMessage(Object.values(data.description))
        } else {
            setBulkSuccess(true)
            setBulkResponse(data.description)
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
            }
            else if (activeStep === 1) {
                metadataCommit()
            }
            else if (activeStep === 2) {
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
        clearInterval(intervalTimer.current)
        setJobData(null)
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

    function generateTSVData(columns, labIdCol, data) {
        let tableDataTSV = ''
        let _colName
        for (let col of columns) {
            tableDataTSV += `${col.name}\t`
        }
        tableDataTSV += "\n"
        let colVal;
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }

            for (let row of data) {
                for (let col of columns) {
                    _colName = eq(col.name, 'lab_id') ? labIdCol : col.name
                    _colName = eq(col.name, 'organ_type') ? 'organ' : _colName
                    colVal = row[_colName] ? row[_colName] : ''
                    tableDataTSV += `${colVal}\t`
                }
                tableDataTSV += "\n"
            }
        } catch (e) {
            console.error(e);
        }

        return createDownloadUrl(tableDataTSV, 'text/tab-separated-values')
    }

    function getColNames() {
        let typeCol;
        let labIdCol
        if (eq(entityType, cache.entities.source)) {
            typeCol = 'source_type'
            labIdCol = 'lab_source_id'
        } else if (eq(entityType, cache.entities.sample)) {
            typeCol = 'sample_category'
            labIdCol = 'lab_tissue_sample_id'
        } else {
            typeCol = 'dataset_type'
            labIdCol = 'lab_dataset_id'
        }
        return {typeCol, labIdCol}
    }

    function getDefaultModalTableCols() {
        let {typeCol, labIdCol} = getColNames()
        return [{
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
    }


    function getEntityModalBody() {
        let body = []
        body.push(<p key={'modal-subtitle'}><strong>Group Name:</strong>  {bulkResponse[1].group_name}</p>)
        let {typeCol, labIdCol} = getColNames()

        let columns = getDefaultModalTableCols()

        if (eq(entityType, cache.entities.sample)) {
            columns.push({
                name: 'organ_type',
                selector: row => row.organ ? row.organ : '',
                sortable: true,
                width: '150px'
            })
        }

        let tableData = Object.values(bulkResponse)
        const downloadURL = generateTSVData(columns, labIdCol, bulkResponse)

        body.push(
            <DataTable key={'success-table'} columns={columns} data={tableData} pagination />
        )

        const isBulkMetadataSupported = (cat) => {
            let supported = supportedMetadata()[cache.entities[entityType]]
            return supported ? supported.categories.includes(cat) : false
        }

        let categoriesSet = new Set()
        Object.values(bulkResponse).map(each => {
            if (isBulkMetadataSupported(each[typeCol])) {
                categoriesSet.add(each[typeCol])
            }
        })

        const categories = Array.from(categoriesSet)

        body.push(
            <Row key='modal-download-area' className={'mt-4 pull-right'}>
                <Stack direction='horizontal' gap={3}>
                    <a role={'button'} className={'btn btn-outline-success rounded-0'}
                       href={downloadURL} download={`${file.name}`}>Download registered data <i
                        className="bi bi-download"></i></a>
                    {(categories.length === 1) &&
                        <a className={'btn btn-primary rounded-0'}
                           href={`/edit/bulk/${entityType}?action=metadata&category=${categories[0]}`}>
                            Continue to metadata upload <i className="bi bi-arrow-right-square-fill"></i>
                        </a>
                    }
                </Stack>
            </Row>
        )
        return body;
    }

    function getMetadataModalBody() {
        let body = []

        let prefix = bulkSuccess.fails.length && !bulkSuccess.passes.length ? 'None' : 'Some';
        let sentencePre = bulkSuccess.fails.length ? `${prefix} of your ` : 'Your ';

        body.push(
            <p key={'modal-subtitle'}>{sentencePre} <code>{cache.entities[entityType]}s'</code> metadata were {getVerb(true, true)}.</p>
        )

        let {typeCol, labIdCol} = getColNames()
        let columns = getDefaultModalTableCols()

        if (bulkSuccess.passes.length) {
            body.push(
                <DataTable key={'success-table'} columns={columns} data={bulkSuccess.passes} pagination/>
            )
        }
        if (bulkSuccess.fails.length) {
            body.push(
                <div className='c-metadataUpload__table table-responsive has-error'>
                    <DataTable key={'fail-table'} columns={columns} data={bulkSuccess.fails} pagination />
                </div>
            )
        }

        const downloadURLPasses = generateTSVData(columns, labIdCol, bulkSuccess.passes)
        const downloadURLFails = generateTSVData(columns, labIdCol, bulkSuccess.fails)
        body.push(
            <Row key="modal-download-area" className={'mt-4 pull-right'}>
                <Stack direction="horizontal" gap={3}>
                    { bulkSuccess.passes.length > 0 &&
                        <a role={'button'} title={'Download successfully uploaded metadata details'}
                           className={'btn btn-outline-success rounded-0'}
                           href={downloadURLPasses} download={`${file.name.replace('.tsv', '-success.tsv')}`}>Download
                            upload data <i className="bi bi-download"></i></a>
                    }
                    { bulkSuccess.fails.length > 0 &&
                        <a role={'button'} title={'Download unsuccessfully uploaded metadata details'}
                           className={'btn btn-outline-danger rounded-0'}
                           href={downloadURLFails} download={`${file.name.replace('.tsv', '-fails.tsv')}`}>Download
                            failed uploads data <i className="bi bi-download"></i></a>
                    }
                </Stack>
            </Row>
        )

        return body
    }

    function getModalTitle() {
        const inner = isMetadata ? "' Metadata" : ""
        return `${cache.entities[entityType]}s${inner} ${getVerb(true, true)}`
    }

    function getModalBody() {
        return isMetadata ? getMetadataModalBody() : getEntityModalBody()
    }

    const isAtLastStep = () => {
        return (activeStep === 2 && getStepsLength() === 3 || activeStep === 3 && getStepsLength() === 4)
    }

    const getVerb = (past = false, lowercase = false) => {
        let verb = isMetadata ? 'Upload' : 'Register'
        verb = past ? `${verb}ed` : verb
        return lowercase ? verb.toLowerCase() : verb
    }

    const isMouse = () => eq(subType, cache.sourceTypes.Mouse)

    const getTitle = () => {
        const entity = cache.entities[entityType]
        let title = `${getVerb()} ${entity}s`
        if (isMetadata) {
            const subTypeText = isMouse() ? "Murines'" : `${subType}s'`
            title = `${getVerb()} ${entity} ${subTypeText} Metadata`
        }
        return title
    }

    const getFilename = (variant = '') => {
        let filename = `example${variant}_${entityType}`
        return isMetadata ? `metadata/${filename}_${subType}_metadata` : `entities/${filename}`
    }

    const isCedarSupported = () => {
        return isMetadata && !subType.includes([cache.sourceTypes.Mouse])
    }

    const getDocsUrl = () => {
        const url = new URL(getDocsRootURL());
        url.pathname = isMetadata ? 'libraries/ingest-validation-tools/schemas' : 'registration/bulk-registration'
        const _subType = isMouse() ? 'murine' : subType
        url.pathname += isMetadata ? `/` : `/${entityType}`
        return url.href
    }

    const getDocsText  = () => {
        const type = isMetadata ? subType : cache.entities[entityType]
        const action = isMetadata ? 'Upload' : 'Registration'
        const docsUrl = getDocsUrl()

        return <>
            See the <a className='link' href={docsUrl}>{type} Bulk {action}</a> page for further details.
        </>
    }

    const getSocketStatusDetails = () => {
        const hasFailed = jobHasFailed(jobData)
        return (<div>
            <div>Request sent to job queue with a current status of <span className={`${getStatusColor(jobData.status)} badge`}>{jobData.status}</span>.</div>

            {!hasFailed && <div>You may remain on this page until the job has a <span className={`${getStatusColor('complete')} badge`}>Complete</span> status.</div>}
            <div>You {!hasFailed ? 'can also' : 'must'} further handle this job (and other jobs) by viewing the <a href={`/user/jobs?q=${bulkResponse?.job_id}`}>current jobs</a> page.</div>
        </div>)
    }

    return (
        <div className='main-wrapper' data-js-ada='modal'>
            <Container sx={{mt: 5}}>
                <Box sx={{
                    backgroundColor: 'white',
                    padding: 5,
                    boxShadow: 3,
                }}>
                    <div>
                        <a
                            download
                            className={buttonVariant}
                            href={isCedarSupported() ? `https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/${entityType}-${subType.toLowerCase()}/latest/${entityType}-${subType.toLowerCase()}.tsv` : `/bulk/${getFilename().toLowerCase()}.tsv`}
                        >
                            <FileDownloadIcon/> {' '} <span>EXAMPLE.TSV {isCedarSupported() && <span>(CEDAR)</span>}</span>
                        </a>

                    </div>
                    <h1 className={'text-center'}>{getTitle()}</h1>
                     <SenNetAlert variant={'warning'}
                                  text={<>Please limit the number of rows (excluding headers) containing data to 30 for
                                      processing purposes. If necessary, you may need to register entities via multiple
                                      submissions.</>}
                                     icon={<i className="bi bi-exclamation-triangle-fill"></i>}/>

                    {eq(entityType, cache.entities.dataset) &&
                        <SenNetAlert variant={'warning'}
                                     text={<>This page is intended for registering datasets in bulk. This process will
                                         yield individual SenNet IDs and Globus locations per dataset. Data providers
                                         will need to transfer their data files to each dataset individually.
                                         <br></br><br></br>
                                         If a data provider would prefer to transfer their data files in bulk, CODCC Curation
                                         recommends creating an upload through <a
                                             href={getRootURL() + 'edit/upload?uuid=register'}>this page</a>.</>}
                                     icon={<i className="bi bi-exclamation-triangle-fill"></i>}/>
                    }
                    <div className={'p-4 text-center'}>
                        To register multiple items at one time, upload a <code>TSV</code> file in the format specified by the example file.<br/>
                        {getDocsText()}
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
                            <DataTable columns={tableColumns('`')} data={errorMessage.data ? errorMessage.data : errorMessage} pagination />
                        </div>
                    }

                    {activeStep === 1 && !errorMessage && validationSuccess &&
                        <Alert severity="success" sx={{m: 2}}>
                         <div>Validation successful please continue onto the next step</div>
                        </Alert>}

                    {activeStep === 1 && !errorMessage && jobData && !validationSuccess &&
                        <Alert severity="info" sx={{m: 2}}>
                            {getSocketStatusDetails()}
                        </Alert>}
                    {
                        isAtLastStep() && !errorMessage && bulkSuccess &&
                        <AppModal
                            modalTitle={getModalTitle()}
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
                                        accept={".tsv"}
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
        </div>
    );
}
