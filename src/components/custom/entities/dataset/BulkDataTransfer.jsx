import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {fetchGlobusFilepath} from "@/lib/services";
import Spinner from "@/components/custom/Spinner";
import AppContext from "@/context/AppContext";
import LnkIc from "@/components/custom/layout/LnkIc";
import {eq, getCreationActionRelationName, getDatasetTypeDisplay} from '@/components/custom/js/functions'
import BlockIcon from '@mui/icons-material/Block';
import GppGoodIcon from '@mui/icons-material/GppGood';
import SenNetPopover from "@/components/SenNetPopover";
import DataUsageModal from "@/components/custom/entities/dataset/DataUsageModal";


function BulkDataTransfer({data, entityType}) {
    const {isLoggedIn} = useContext(AppContext)

    const [tabData, setTabData] = useState([])
    const [isBusy, setIsBusy] = useState(true)

    const getData = async () => {
        let list = []
        let keys = ['primary', 'component', 'processed']
        const icons = {
            primary: 'circle',
            component: 'triangle',
            processed: 'blob'
        }
        console.log(entityType)
        if (eq(entityType, "Upload") || eq(entityType, "Publication")) {
            data['shape'] = icons['primary']
            list.push(data)
        } else {
            for (let k of keys) {
                if (data[k].length) {
                    data[k][0].shape = icons[k]
                    list.push(data[k][0])

                    if (k === 'component' && data[k].length > 1) {
                        data[k][1].shape = icons[k]
                        list.push(data[k][1])
                    }
                }

            }
        }
        for (let d of list) {
            const gData = await fetchGlobusFilepath(d.uuid);
            if (gData.status && gData.status === 200) {
                d.globusPath = gData.filepath
            }
        }
        setTabData(list)
        setIsBusy(false)
    }

    useEffect(() => {
        getData()
    }, [])

    const contactUs = <LnkIc title={'contact us'} href={'mailto:help@sennetconsortium.org'}
                             icClassName={'bi bi-envelope-fill'}/>

    const toolTopDbGap = 'The database of Genotypes and Phenotypes archives and distributes data and results from studies that have investigated the interaction of genotype and phenotype in humans.'

    const tooltip = (id = '0', def = true) => (
        <SenNetPopover text={<span>{def ? 'Global research data management system.' : toolTopDbGap}</span>}
                       className={`popover-${id}`}>
            <i className="bi bi-question-circle-fill"></i>
        </SenNetPopover>
    )

    const notLoggedIn = (entity) => {
        return (
            <>
                <h6>SenNet Consortium Members: Globus Access {tooltip(entity.uuid)} <BlockIcon color={'error'}/></h6>
                <p>Please <a href={'/login'}>log in</a> for Globus access or {contactUs} with
                    the <code>{entityType ? entityType : 'Dataset'}</code> ID about the files you are trying to access.</p>
                <hr/>
                <h6>Non-Consortium Members: Database of Genotypes and Phenotypes
                    (dbGaP){tooltip(entity.uuid + '1', false)}</h6>
                <p>This <code>{entityType ? entityType : 'Dataset'}</code> contains protected-access human sequence data. Data is not yet available
                    through dbGap , but will be available soon.
                    Please {contactUs} with any questions regarding this data.</p>
            </>
        )
    }

    const loggedInNoAccess = (entity) => {
        return (<>
            <h6>No Globus Access {tooltip(entity.uuid)} <BlockIcon color={'error'}/></h6>
            <p>This <code>{entityType ? entityType : 'Dataset'}</code> contains protected-access human sequence data. Please ask the PI of your SenNet
                award to&nbsp;
                {contactUs} and submit a ticket to get you access to protected SenNet data through Globus.</p>
        </>)
    }

    const loggedInAccess = (entity) => {
        return (<>
            <h6>Globus Access {tooltip(entity.uuid)} <GppGoodIcon color={'success'}/></h6>
            <p>Files are available through the Globus Research Data Management System. If you require additional
                help, {contactUs} with the <code>{entityType ? entityType : 'Dataset'}</code> ID and information about the files you are trying to
                access.</p>
            <DataUsageModal data={entity} filepath={entity.globusPath}/>
        </>)
    }

    const getTabs = () => {
        let res = []

        let c
        for (let d of tabData) {
            if (isLoggedIn() || d.globusPath) {
                if (!d.globusPath) {
                    c = loggedInNoAccess(d)
                } else {
                    c = loggedInAccess(d)
                }

            } else {
                c = notLoggedIn(d)
            }

            if (eq(entityType, "Upload") || eq(entityType, "Publication")) {
                res.push(<Tab key={d.sennet_id} eventKey={d.sennet_id} title={<span className={'c-help'}><span
                    title={entityType}>{data.sennet_id}</span></span>}>
                    <div className={'my-3'}>{c}</div>
                </Tab>)
            } else {
                res.push(<Tab key={d.sennet_id} eventKey={d.sennet_id} title={<span className={'c-help'}><span
                    title={getCreationActionRelationName(d.creation_action)}
                    className={`shape shape--${d.shape} ${eq(d.shape, 'circle') ? 'green' : ''}`}>{getDatasetTypeDisplay(d)}</span></span>}>
                    <div className={'my-3'}>{c}</div>
                </Tab>)
            }
        }

        return res

    }

    return (
        <>
            <SenNetAccordion title={'Bulk Data Transfer'} id={'bulk-data-transfer'}>
                {!entityType &&
                <p>This section explains how to bulk download the raw and processed data for
                    this <code>{entityType ? entityType : 'Dataset'}</code>. Files for individual raw or processed data
                    can be downloaded via Globus or dbGaP from the respective tabs. To download files from multiple
                    Globus directories simultaneously, use the <LnkIc title={'SenNet Command Line Transfer (CLT) Tool'}
                                                                      href={' https://docs.sennetconsortium.org/libraries/clt/'}/>.
                    Note that processed data has separate download directories in Globus or dbGaP, distinct from the raw
                    data directory.</p>
                }

                {!isBusy && <Tabs
                    defaultActiveKey={tabData[0].sennet_id}
                    className="mb-3"
                    variant="pills"
                >
                    {getTabs()}
                </Tabs>}
                {isBusy && <Spinner/>}
            </SenNetAccordion>
        </>
    )
}


BulkDataTransfer.propTypes = {
    children: PropTypes.node
}

export default BulkDataTransfer