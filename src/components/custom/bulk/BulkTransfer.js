import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from 'react';
import {styled} from '@mui/material/styles';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import DescriptionIcon from '@mui/icons-material/Description';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import StepConnector, {stepConnectorClasses} from '@mui/material/StepConnector';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {Button, Form} from "react-bootstrap";
import {Alert, Container, Grid} from "@mui/material";
import Spinner from "../Spinner";
import AppModal from "../../AppModal";
import SenNetAlert from "@/components/SenNetAlert";
import FileTransfersContext from "@/context/FileTransfersContext";
import OptionsSelect from "../layout/entity/OptionsSelect";
import SenNetPopover from "@/components/SenNetPopover";
import DataTable from "react-data-table-component";
import LnkIc from "../layout/LnkIc";
import AncestorsModal, { FilesBodyContent } from "../edit/dataset/AncestorsModal";
import { SEARCH_FILES } from "@/config/search/files";
import { cloneDeep } from 'lodash';
import { APP_ROUTES } from "@/config/constants";

const EntityFormGroup = dynamic(() => import('@/components/custom/layout/entity/FormGroup'))

export default function BulkTransfer({
                                         userWriteGroups,
                                         handlePrimaryBtn,
                                     }) {
    const buttonVariant = "btn btn-outline-primary rounded-0"

    const [activeStep, setActiveStep] = useState(0)
    const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(false)
    const [validated, setValidated] = useState(false)
    const [showHideModal, setShowHideModal] = useState(false)


    const stepLabels = ['Verify Dataset Files', 'Specify Filepath', 'Complete']
    const [steps, setSteps] = useState(stepLabels)
    const [showModal, setShowModal] = useState(true)


    const _formData = useRef({})
    const {
        isLoading,
        error,
        setError,
        transferFiles,
        globusCollections,
        globusRunURLs,
        tableData,
        setTableData
    } = useContext(FileTransfersContext)

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
        let icons = {
            1: <DescriptionIcon/>,
            2: <DriveFileMoveIcon/>,
            3: <DoneOutlineIcon/>,
        }
        return (
            <ColorlibStepIconRoot ownerState={{completed, active}} className={className}>
                {icons[String(props.icon)]}
            </ColorlibStepIconRoot>
        );
    }

    useEffect(() => {
        setIsNextButtonDisabled(error != null)
    }, [error])


    function getStepsLength() {
        return steps.length
    }


    const onNextStep = () => {
        if (activeStep === 1) {
            transferFiles(_formData.current)
        } else if (activeStep === 2) {
            window.location = APP_ROUTES.search
        }
        setActiveStep(prevState => prevState + 1)
    }


    const handleNext = () => {
        if (activeStep === 1) {
            setIsNextButtonDisabled(false)
            const form = document.getElementById("transfers-form")
            if (form.checkValidity() === true) {
                onNextStep()
            }
            setValidated(true)

        } else {
            onNextStep()
        }

    }

    const handleBack = () => {
       
        setError(null)

        if (activeStep !== 0 || activeStep !== isAtLastStep()) {
            setActiveStep(prevState => prevState - 1)
        }
    }

    function isStepFailed(index) {
        return error !== null && error[index] !== null && error[index] === true
    }

    function getModalTitle() {
        return `Files Transfer In Process`
    }

    function getModalBody() {
        if (!isLoading) {
            return error || (
                <>
                    <span>You can monitor the process of the file transfer via the following link(s):</span>
                    <ul>
                        {globusRunURLs.map((url, index) => (
                            <li key={index}><a href={url} target='_blank'>{url} <i
                                className="bi bi-box-arrow-up-right"></i></a></li>
                        ))}
                    </ul>
                </>)
        } else {
            return (
                <Spinner/>
            )
        }
    }

    const isAtLastStep = () => {
        return (activeStep === getStepsLength() - 1)
    }

    const getTitle = () => {
        return 'Initiate Globus File Transfer'
    }

    const updateSessionProp = (list) => {
      sessionStorage.setItem('transferFiles', JSON.stringify(list))
    }

    const deleteFileRow = (e, row) => {
      let filtered = tableData.filter((d) => d.dataset !== row.dataset)
      updateSessionProp(filtered)
      setTableData(filtered)
    }

    const handleAncestorsModalSearchSumit = (event, onSubmit) => {
        onSubmit(event)
    }

    const addDataset = async (e, _, more) => {
      let _list = Array.from(tableData)
      if (!_list.length) {
        setError(null)
      }
      let _dict = {}
      // Avoid duplicates
      for (let i of _list) {
        _dict[i.dataset + i.file_path] = true
      }
      for (let i of more) {
        if (!_dict[i.dataset + i.file_path]) {
          _list.push(i)
        }
      }
      updateSessionProp(_list)
      setTableData(_list)
      hideModal()
    }

    const hideModal = () => {
        setShowHideModal(false)
    }

    const addFileRow = () => {
      setShowHideModal(true)
    }

    const getColumns = () => {
        return ([
            {
                name: 'SenNet ID',
                id: 'dataset',
                selector: row => row.dataset,
                format: row =>  {
                  return (<SenNetPopover text={row.dataset_type} trigger={'hover'}
                                                className={`popover-${row.dataset}`}><span>{row.dataset}</span></SenNetPopover>)
                }

            },
            {
                name: 'File',
                id: 'file_path',
                selector: row => row.file_path,
                format: row => row.file_path === '/' ? 'All files' : (<span title={row.file_path}>{row.file_path}</span>),
            },
            {
                name: 'Delete',
                id: 'delete',
                width: '100px',
                selector: row => '',
                format: row =>  {
                    return (
                        <Button className="pt-0 pb-0 btn-delete-file-transfer-row"
                                variant="link"
                                onClick={(e) => deleteFileRow(e, row)}
                              >
                            <i className={'bi bi-trash-fill'} style={{color:"red"}}/>
                        </Button>
                    )
                },
            },
        ])
    }

    const onChangeGlobusCollection = (e, id, value) => {
        _onChange({value}, 'destination_collection_id')
    }

    const onCheckedChange = (e) => {
        _onChange({value: e.target.checked}, e.target.name)
    }

    const onPathChange = (e, field) => {
        _onChange({value: e.target.value}, field)
    }

    const _onChange = (e, field) => {
        _formData.current = {..._formData.current, [field]: e.value}
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
                        <SenNetAlert variant={'warning'} className="clt-alert"
                                     text={<> For transferring data to the local
                                         machine, the <LnkIc text={'Globus Connect Personal (GCP)'} href='https://www.globus.org/globus-connect-personal' /> endpoint must also be
                                         up and
                                         running. <br/><br/> To monitor the status of ongoing transfers, please visit <LnkIc text={'Globus Activity'} href="https://app.globus.org/activity" />
                                     </>}/>

                    </div>
                    <h1 className={'text-center'}>{getTitle()}</h1>


                    <Grid container className={'text-center mt-4 mb-2'}>

                        <Grid item xs>
                            {activeStep === 0 &&
                                <>
                                    <p>Verify the following files for the associated <code>Dataset(s)</code> that you
                                        would like to transfer.</p>
                                    <div className="w-75 mx-auto mt-5 mb-5">
                                      <DataTable columns={getColumns()} data={tableData} pagination/>
                                      <div className="text-right"><SenNetPopover text={<span>Add more files</span>} className="popover-add-files"><button aria-label="Add" className="btn" onClick={addFileRow}><i className="bi bi-plus-square"></i></button></SenNetPopover></div>
                                      <AncestorsModal data={[]} hideModal={hideModal}
                                        changeAncestor={addDataset} showHideModal={showHideModal}
                                        searchConfig={cloneDeep(SEARCH_FILES)}
                                        resultsBodyContent={<FilesBodyContent handleChangeAncestor={addDataset} />}
                                        handleSearchFormSubmit={handleAncestorsModalSearchSumit} />
                                    </div>
                                </>
                            }

                            {activeStep === 1 &&
                                <>
                                    <p>Select the destination Globus collection and specify the file path you would like
                                        to transfer files to. If you would like to transfer protected access files then
                                        select the checkbox. </p>
                                </>
                            }
                        </Grid>

                    </Grid>


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


                    {error &&
                        <Alert severity="error" sx={{m: 2}}>
                            {error}
                        </Alert>}


                    {
                        isAtLastStep() &&
                        <AppModal
                            modalTitle={getModalTitle()}
                            modalBody={getModalBody()}
                            modalSize='lg'
                            showModal={showModal}
                            handlePrimaryBtn={handlePrimaryBtn}
                            handleSecondaryBtn={
                                () => setShowModal(false)}
                        />
                    }

                    {
                        activeStep === 1 &&
                        <Grid container className={'form--transfer w-75 mx-auto mt-5'}>
                            <Form className={"w-100"} noValidate validated={validated} id={"transfers-form"}>
                                <Grid item xs>
                                    <OptionsSelect
                                        propLabel='display_name'
                                        propVal={'id'}
                                        className={'form__flexGroup'}
                                        popover={<>Select the Globus collection you wish to transfer files to. </>}
                                        controlId={'destination_collection_id'}
                                        isRequired={true} label={'Destination Globus Collection'}
                                        onChange={onChangeGlobusCollection}
                                        data={globusCollections}/>

                                    <EntityFormGroup label='Destination File Path' controlId='destination_file_path'
                                                     className={'form__flexGroup'}
                                                     onChange={onPathChange}
                                                     isRequired={true}
                                                     otherInputProps={{pattern: '^(\\/)?([^\\/\\0]+(\\/)?)+$'}}
                                                     popoverHelpText="Specify the file path you wish to transfer files to. The path is relative to the selected collection's home directory (~)."/>

                                    <div className={"form__flexGroup"}>
                                        <label htmlFor='from_protected_space' className="form__labelWithCheck">
                                            <span>Transfer protected access files? </span>
                                            <SenNetPopover
                                                text={<span>To transfer protected files, you must be a member of the group that owns those files. If you are transferring files from a published <code>Dataset</code> this process will default to transfer files that do not contain Protected Health Information (PHI).  If you wish to transfer those files as well then select this checkbox.</span>}
                                                trigger={'hover'}
                                                className={`popover-from_protected_space`}>
                                                <i className="bi bi-question-circle-fill"></i>
                                            </SenNetPopover>

                                        </label>
                                        <input
                                            name="from_protected_space"
                                            id='from_protected_space'
                                            className={"form-check-input"}
                                            type='checkbox'
                                            onChange={onCheckedChange}
                                        />
                                    </div>

                                </Grid>
                            </Form>
                        </Grid>
                    }
                    <Grid container spacing={3} className={'text-center mt-3'}>
                        <Grid item xs>
                            <Button
                                variant={'outline-dark rounded-0'}
                                disabled={activeStep === 0}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                        </Grid>

                        <Grid item xs>
                            <Button
                                variant={buttonVariant}
                                onClick={handleNext}
                                disabled={isNextButtonDisabled}
                            >
                                {isAtLastStep() ? 'Finish' : 'Next'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </div>
    );
}
