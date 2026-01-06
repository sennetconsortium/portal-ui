import AppModal from '@/components/AppModal'
import React, {useEffect, useState} from 'react'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import {autoBlobDownloader, goToTransfers} from '../../js/functions';
import LnkIc from '../../layout/LnkIc';
import Button from "react-bootstrap/Button";

function CLTModal({data, showModal, setShowModal}) {

    const closeModal = () => setShowModal(false)
    const [checked, setChecked] = useState([true, false])
    const [downloadBtnProps, setDownloadBtnProps] = useState({})

    const transferManifest = () => {
        let manifest = []
        const buildManifest = (list) => {
            for (let e of list) {
                manifest.push({
                    dataset: e.sennet_id,
                    dataset_type: e.dataset_type,
                    file_path: '/'
                })
            }
        }
        if (checked[0]) {
            buildManifest(data.primary)
        }
        if (checked[1]) {
            buildManifest(data.processed)
        }
        if (manifest.length) {
            goToTransfers(manifest)
        }
    }

    const downloadManifest = () => {
        let manifest = ''
        const buildManifest = (list) => {
            for (let e of list) {
                manifest += `${e.sennet_id} /\n`
            }
        }
        if (checked[0]) {
            buildManifest(data.primary)
        }
        if (checked[1]) {
            buildManifest(data.processed)
        }
        if (manifest.length) {
            const query = new URLSearchParams(window.location.search)
            autoBlobDownloader([manifest], 'text/plain', `manifest-${query.get('uuid')}.txt`)
        }
    }

    useEffect(() => {
        if (checked.some(c => c === true)) {
            setDownloadBtnProps({})
        } else {
            setDownloadBtnProps({disabled: true})
        }
    }, [checked])

    return (
        <AppModal
            modalTitle={<h2 className='fs-3'>Bulk Download Files</h2>}
            modalSize='xl'
            showModal={showModal}
            primaryBtnProps={downloadBtnProps}
            primaryBtnLabel={'Transfer Files'}
            handlePrimaryBtn={transferManifest}
            handleSecondaryBtn={closeModal}>
            <div>

                <Accordion defaultExpanded>
                    <AccordionSummary
                        className='bg--lightGrey'
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        <h3 className='fs-4'>Install the SenNet CLT</h3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>Choose download options to bulk download files from your selected datasets. Your selection of
                            files will generate a manifest file, which can be used with the SenNet Command Line Transfer
                            (CLT) tool for downloading.</p>

                        <p>To download the files included in the manifest file, install the SenNet CLT (if not already
                            installed) and follow instructions for how to use it with the manifest file. See the online
                            Documentation for details.</p>


                        <p><LnkIc href='https://docs.sennetconsortium.org/libraries/clt/'
                                  title='SenNet CLT Documentation'/></p>

                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary
                        className='bg--lightGrey'
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel3-content"
                        id="panel3-header"
                    >
                        <h3 className='fs-4'>Transfer/Download Options</h3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>Select raw and/or processed files to download. Clicking "Transfer Files" will allow you to
                            initiate a transfer via the portal without the need for the SenNet CLT (Globus Connect
                            Personal must still be installed for local file transfer). Clicking "Generate Download
                            Manifest" will output a a file that can be used with the SenNet CLT.</p>
                        <h5>Raw Data</h5>
                        <p>Raw data consists of files as originally submitted by the data submitters and are associated
                            with <code>Primary Datasets</code>.</p>
                        <h5>Processed Data</h5>
                        <p>Processed data includes files associated with data generated by SenNet using uniform
                            processing pipelines or by an external processing approach and are associated with <code>Processed
                                Datasets</code>.</p>

                        <p>If you wish to specify the files downloaded or search for additional datasets to download,
                            you can do so via the <LnkIc href='https://data.sennetconsortium.org/search/files'
                                                         title='Data Portal Files Search'/></p>
                        <hr/>
                        <IndeterminateCheckbox data={data}
                                               checked={checked}
                                               setChecked={setChecked}/>

                    </AccordionDetails>
                </Accordion>
                <div className={'d-flex'}>
                    <Button className={'ms-auto'} variant="outline-primary rounded-0"
                            onClick={downloadManifest}>Generate Download Manifest Files</Button>
                </div>
            </div>
        </AppModal>
    )
}

function IndeterminateCheckbox({data, checked, setChecked}) {


    const handleToggleAll = (event) => {
        setChecked([event.target.checked, event.target.checked])
    };

    const handlePrimary = (event) => {
        setChecked([event.target.checked, checked[1]])
    };

    const handleProcessed = (event) => {
        setChecked([checked[0], event.target.checked])
    };

    const children = (
        <Box sx={{display: 'flex', flexDirection: 'column', ml: 3}}>
            {data.primary?.length > 0 && <FormControlLabel
                label={`Select all raw files. (${data.primary.length} Relevant Dataset(s))`}
                control={<Checkbox checked={checked[0]} onChange={handlePrimary}/>}
            />}
            {data.processed?.length > 0 && <FormControlLabel
                label={`Select all SenNet centrally processed files. (${data.processed.length} Relevant Dataset(s))`}
                control={<Checkbox checked={checked[1]} onChange={handleProcessed}/>}
            />}
        </Box>
    );

    return (
        <div>
            <FormControlLabel
                label="Select all files."
                control={
                    <Checkbox
                        checked={checked[0] && checked[1]}
                        indeterminate={checked[0] !== checked[1]}
                        onChange={handleToggleAll}
                    />
                }
            />
            {children}
        </div>
    );
}

export default CLTModal