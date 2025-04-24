import React, {Fragment, useContext, useEffect, useState} from 'react';
import {fetchGlobusFilepath} from "../../../../lib/services";
import SenNetAccordion from "../../layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';
import DataTable from "react-data-table-component";
import {formatByteSize} from "../../js/functions";
import SenNetPopover from "../../../SenNetPopover";
import {getAssetsEndpoint, getAuth, RESULTS_PER_PAGE} from "../../../../config/config";
import DerivedContext from "../../../../context/DerivedContext";
import Link from "next/link";

export const Files = ({data}) => {
    const [status, setStatus] = useState(null)
    const [filepath, setFilepath] = useState(null)
    const [tableColumns, setTableColumns] = useState([])
    const [tableData, setTableData] = useState([])
    const {
        isPrimaryDataset,
        derivedDataset
    } = useContext(DerivedContext)

    const setTableDataConfig = (uuid, filesToIterate) => {
        setTableColumns([
            {
                name: 'File Name',
                selector: row => row.rel_path,
                sortable: true,
                width: "50%",
                format: (row, index) =>
                    <span>
                            <a target="_blank"
                               className={"icon-inline"}
                               href={`${getAssetsEndpoint()}${uuid}/${row.rel_path}?token=${getAuth()}`}><span
                                className="me-1">{row.rel_path}</span>
                            </a>
                            <SenNetPopover className={`file-${index}`}
                                           text={`${row.description}`}><i className="bi bi-question-circle-fill"></i>
                            </SenNetPopover>

                        </span>
            },
            {
                name: 'QA',
                selector: row => row.is_qa_qc,
                sortable: true,
                format: (row) => row.is_qa_qc === true ? (<span className="badge bg-secondary mx-2">
                            QA
                        </span>) : (<></>)
            },
            {
                name: 'Size',
                selector: row => row.size,
                sortable: true,
                format: (row) => formatByteSize(row.size)
            }
        ]);

        let rows = []
        filesToIterate.map(file => {
            rows.push({
                rel_path: file.rel_path,
                description: file.description,
                is_qa_qc: file.is_qa_qc,
                size: file.size
            })
        });
        setTableData(rows);
    }

    useEffect(async () => {
        await fetchGlobusFilepath(data.uuid).then((globusData) => {
            setStatus(globusData.status);
            setFilepath(globusData.filepath);
        });

        //Default to use files, otherwise wait until derivedDataset is populated
        if (data.files && Object.keys(data.files).length) {
            setTableDataConfig(data.uuid, data.files)
        }
    }, [])

    useEffect(() => {
        if (isPrimaryDataset && derivedDataset.files && Object.keys(derivedDataset.files).length) {
            setTableDataConfig(derivedDataset.uuid, derivedDataset.files)
        }
    }, [derivedDataset])

    return <Fragment>
        <SenNetAccordion title={'Files'}>
            {!!((data.files && Object.keys(data.files).length) || (isPrimaryDataset && derivedDataset?.files && Object.keys(derivedDataset?.files).length)) &&
                <Card border={'0'}>
                    {derivedDataset &&
                        <span className={'fw-light fs-6 m-2 p-2'}>
                                From descendant
                                <Link target="_blank" href={{pathname: '/dataset', query: {uuid: derivedDataset.uuid}}}>
                                    <span className={'ms-2 me-2'}>{derivedDataset.sennet_id}</span>
                                </Link>
                            </span>
                    }
                    <DataTable columns={tableColumns}
                               data={tableData}
                               fixedHeader={true}
                               paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                               pagination/>
                </Card>
            }
            <Card border={'0'}>
                <Card.Body>
                    {status === 200 && filepath &&
                        <p>Files are available through the Globus Research Data Management System. Access
                            dataset <a
                                target="_blank"
                                href={filepath}
                                className="icon-inline"><span
                                className="me-1">{data.sennet_id}</span> <i className="bi bi-box-arrow-up-right"></i></a></p>}

                    {status > 200 &&
                        <p>Access to the files on the Globus Research Management system is restricted. You may
                            not have
                            access to these files because the Consortium
                            is still curating data and/or the data is protected data that requires you to be a
                            member of the
                            Consortium "Protected Data Group".
                            Such protected data will be available via dbGaP in the future.
                            If you believe this to be an error, please contact <a className={'lnk--ic'}
                                                                                  href={'mailto:help@sennetconsortium.org'}>help@sennetconsortium.org <i
                                className="bi bi-envelope-fill"></i></a>
                        </p>}
                </Card.Body>
            </Card>
        </SenNetAccordion>
    </Fragment>
}

export default Files