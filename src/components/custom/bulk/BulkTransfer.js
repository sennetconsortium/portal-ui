import React, { useEffect, useRef, useState, useContext } from 'react';
import { styled } from '@mui/material/styles';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import VerifiedIcon from '@mui/icons-material/Verified';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "react-bootstrap";
import { Alert, Container, Grid } from "@mui/material";
import Spinner, { SpinnerEl } from "../Spinner";
import AppModal from "../../AppModal";
import { eq, getHeaders, } from "../js/functions";
import AppContext from "@/context/AppContext";
import { getAuthJsonHeaders, getAuthHeader } from "@/lib/services";
import SenNetAlert from "@/components/SenNetAlert";
import FileTransfersContext from "@/context/FileTransfersContext";
import OptionsSelect from "../layout/entity/OptionsSelect";
import log from 'loglevel'

export default function BulkTransfer({
  userWriteGroups,
  handlePrimaryBtn,
}) {
  const buttonVariant = "btn btn-outline-primary rounded-0"

  const [activeStep, setActiveStep] = useState(0)
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true)
  const [error, setError] = useState(null)

  const stepLabels = ['Verify Dataset Files', 'Specify Filepath', 'Complete']
  const [steps, setSteps] = useState(stepLabels)
  const [showModal, setShowModal] = useState(true)
  const { cache, supportedMetadata: getUserGlobusCollection } = useContext(AppContext)
  const [jobData, setJobData] = useState(null)

  const response = useRef(null)
  const { isLoading, setIsLoading, transferFiles } = useContext(FileTransfersContext)

  const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
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

  const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
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
    const { active, completed, className } = props;
    let icons = {
      1: <AttachFileIcon />,
      2: <DriveFileMoveIcon />,
      3: <DoneOutlineIcon />,
    }
    return (
      <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
        {icons[String(props.icon)]}
      </ColorlibStepIconRoot>
    );
  }

  useEffect(() => {

  }, [userWriteGroups])


  function getStepsLength() {
    return steps.length
  }


  const onNextStep = () => {
    setIsNextButtonDisabled(true)

    if (activeStep === 1) {
    
    } else if (activeStep === 2) {
      handleReset()
      return
    }
    setActiveStep(prevState => prevState + 1)
  }


  const handleNext = () => {
    onNextStep()
  }

  const handleBack = () => {
 
    setJobData(null)
    setIsNextButtonDisabled(true)
    setError(null)


    if (activeStep !== 0) {
      setActiveStep(prevState => prevState - 1)
    }
  }

  const handleReset = () => {
  
    setActiveStep(0)
    setError(null)
    setIsNextButtonDisabled(true)
    setShowModal(true)
    setJobData(null)
  }


  function isStepFailed(index) {
    return error !== null && error[index] !== null && error[index] === true
  }

  function getModalTitle() {
    return `Files Transfer In Process`
  }

  function getModalBody() {
    return ''
  }

  const isAtLastStep = () => {
    return (activeStep === 2 && getStepsLength() === 3 || activeStep === 3 && getStepsLength() === 4)
  }


  const getTitle = () => {
     return 'Transfer Files'
  }

  const onChangeGlobusCollection = (e, id, value) => {
    
    if (value && value.length) {
      setIsNextButtonDisabled(false)
    } else {
      setIsNextButtonDisabled(true)
    }
  }

  return (
    <div className='main-wrapper' data-js-ada='modal'>
      <Container sx={{ mt: 5 }}>
        <Box sx={{
          backgroundColor: 'white',
          padding: 5,
          boxShadow: 3,
        }}>
          <div>
            <SenNetAlert variant={'warning'} className="clt-alert"
              text={<> For transferring data to the local
                machine, the <a
                  href={'https://www.globus.org/globus-connect-personal'} target='_blank'
                  className={'lnk--ic'}>Globus
                  Connect Personal (GCP)<i
                    className="bi bi-box-arrow-up-right"></i></a> endpoint must also be
                up and
                running.
              </>} />

          </div>
          <h1 className={'text-center'}>{getTitle()}</h1>

          
          <Grid container className={'text-center mt-4 mb-2'}>
            
            <Grid item xs>
              {activeStep === 0 &&
                <>
                  <p>The following files for the associated Datasets will be downloaded:</p>
                  <>Do table</>
                </>
              }

              {activeStep === 1 &&
                <>
                  <p>Please provide the file path to which you would like to transfer the Dataset files.</p>
                </>
              }
            </Grid>
           
          </Grid>
          

       
          <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
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
          {isLoading && <Spinner />}


          {error &&
            <Alert severity="error" sx={{ m: 2 }}>
              <div>An unexpected error occurred. Please try again, or contact the <a
                href={"mailto:help@sennetconsortium.org"} className='lnk--ic'>SenNet Help Desk<i
                  className="bi bi-envelope-fill"></i></a> if the issue persists.</div>
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
            <Grid container className={'text-center mt-5'}>
              <Grid item xs></Grid>
              <Grid item xs>
                <OptionsSelect
                  propVal={'categories'}
                  popover={<>Select type of metadata being uploaded.</>} controlId={'transferPath'}
                  isRequired={true} label={'Globus Collection'} onChange={onChangeGlobusCollection} data={getUserGlobusCollection()} />
               
              </Grid>
              <Grid item xs></Grid>
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
                {activeStep === getStepsLength() - 1 ? 'Finish' : 'Next'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}
