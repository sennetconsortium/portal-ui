import dynamic from "next/dynamic";
import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import {getAuthHeader, getJsonHeader} from "@/lib/services";
import {getEntityEndPoint} from "@/config/config";
import {createDownloadUrl, eq} from "@/components/custom/js/functions";
import AppContext from "./AppContext";

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

import {Row, Stack} from "react-bootstrap";

const JobQueueContext = createContext()

export const JobQueueProvider = ({ children }) => {
    const intervalTimer = useRef(null)
    const [isLoading, setIsLoading] = useState(null)
    const {cache, supportedMetadata} = useContext(AppContext)
    const [file, setFile] = useState(null)
    const [isMetadata, setIsMetadata] = useState(false)
    const [bulkData, setBulkData] = useState(null)


    useEffect(() => {

    }, [])

    const jobHasFailed = (job) => ['error', 'failed'].contains(job.status)

    const getEntitiesFetchUrl = (entityType) => {
        return `${getEntityEndPoint()}entities/dashboard/${entityType?.upperCaseFirst()}`
    }

    function getColNames(entityType) {
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

    function getDefaultModalTableCols(entityType) {
        let {typeCol, labIdCol} = getColNames(entityType)
        return [
            {
                name: 'uuid',
                selector: row => row.uuid,
                omit: true
            }
            ,{
                name: 'lab_id',
                selector: row => row[labIdCol],
                sortable: true,
            },
            {
                name: 'sennet_id',
                selector: row => row.sennet_id,
                sortable: true,
            },
            {
                name: typeCol,
                selector: row => row[typeCol],
                sortable: true,
            }
        ]
    }

    const getVerb = (past = false, lowercase = false) => {
        let verb = isMetadata ? 'Upload' : 'Register'
        verb = past ? `${verb}ed` : verb
        return lowercase ? verb.toLowerCase() : verb
    }

    const fetchEntities = async (data, {clearFetch = true, entityType}) => {
        let passes = []
        let fails = []

        if (clearFetch) {
            clearInterval(intervalTimer.current)
        }

        const succeededUuids = (data.results.filter((r) => r.success)).map((r) => r.uuid)
        const failedUuids = (data.results.filter((r) => !r.success)).map((r) => r.uuid)

        let requestOptions = {
            method: 'PUT',
            headers:  getJsonHeader(getAuthHeader()),
            body: JSON.stringify({entity_uuids: succeededUuids})
        }

        if (succeededUuids.length) {
            let response = await fetch(getEntitiesFetchUrl(entityType), requestOptions)
            passes = await response.json()
        }

        if (failedUuids.length) {
            requestOptions.body = JSON.stringify({entity_uuids: failedUuids})
            let response = await fetch(getEntitiesFetchUrl(entityType), requestOptions)
            fails = await response.json()
        }

        setIsLoading(false)
        return {fails, passes}
    }

    const generateTSVData = (columns, labIdCol, data) => {
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

    const getEntityModalBody = (data, {_file, entityType}) => {
        _file = _file || file
        data = data || bulkData
        let body = []
        body.push(<p key={'modal-subtitle'}><strong>Group Name:</strong>  {data.passes[0]?.group_name}</p>)
        let {typeCol, labIdCol} = getColNames(entityType)

        let columns = getDefaultModalTableCols(entityType)

        console.log('ENT', entityType, eq(entityType, cache.entities.sample))
        if (eq(entityType, cache.entities.sample)) {
            columns.push({
                name: 'organ_type',
                selector: row => row.organ_type ? row.organ_type : '',
                sortable: true,
            })
        }

        const downloadURL = generateTSVData(columns, labIdCol, data.passes)

        body.push(
            <DataTable key={'success-table'} columns={columns} data={data.passes} pagination />
        )

        const isBulkMetadataSupported = (cat) => {
            let supported = supportedMetadata()[cache.entities[entityType]]
            return supported ? supported.categories.includes(cat) : false
        }

        let categoriesSet = new Set()
        data.passes.map(each => {
            if (isBulkMetadataSupported(each[typeCol])) {
                categoriesSet.add(each[typeCol])
            }
        })

        const categories = Array.from(categoriesSet)

        body.push(
            <Row key='modal-download-area' className={'mt-4 pull-right'}>
                <Stack direction='horizontal' gap={3}>
                    <a role={'button'} className={'btn btn-outline-success rounded-0'}
                       href={downloadURL} download={`${_file.name}`}>Download registered data <i
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

    const getMetadataModalBody = (data, {_file, entityType}) => {
        _file = _file || file
        data = data || bulkData
        let body = []

        let prefix = data.fails.length && !data.passes.length ? 'None' : 'Some';
        let sentencePre = data.fails.length ? `${prefix} of your ` : 'Your ';

        body.push(
            <p key={'modal-subtitle'}>{sentencePre} <code>{entityType}s'</code> metadata were {getVerb(true, true)}.</p>
        )

        let {typeCol, labIdCol} = getColNames(entityType)
        let columns = getDefaultModalTableCols(entityType)

        if (data.passes.length) {
            body.push(
                <DataTable key={'success-table'} columns={columns} data={data.passes} pagination/>
            )
        }
        if (data.fails.length) {
            body.push(
                <div className='c-metadataUpload__table table-responsive has-error'>
                    <DataTable key={'fail-table'} columns={columns} data={data.fails} pagination />
                </div>
            )
        }

        const downloadURLPasses = generateTSVData(columns, labIdCol, data.passes)
        const downloadURLFails = generateTSVData(columns, labIdCol, data.fails)
        body.push(
            <Row key="modal-download-area" className={'mt-4 pull-right'}>
                <Stack direction="horizontal" gap={3}>
                    { data.passes.length > 0 &&
                        <a role={'button'} title={'Download successfully uploaded metadata details'}
                           className={'btn btn-outline-success rounded-0'}
                           href={downloadURLPasses} download={`${_file.name.replace('.tsv', '-success.tsv')}`}>Download
                            upload data <i className="bi bi-download"></i></a>
                    }
                    { data.fails.length > 0 &&
                        <a role={'button'} title={'Download unsuccessfully uploaded metadata details'}
                           className={'btn btn-outline-danger rounded-0'}
                           href={downloadURLFails} download={`${_file.name.replace('.tsv', '-fails.tsv')}`}>Download
                            failed uploads data <i className="bi bi-download"></i></a>
                    }
                </Stack>
            </Row>
        )

        return body
    }

    return (
        <JobQueueContext.Provider
            value={{
                intervalTimer,
                isLoading, setIsLoading,
                fetchEntities,
                getDefaultModalTableCols,
                file, setFile,
                bulkData, setBulkData,
                isMetadata, setIsMetadata,
                getEntityModalBody,
                getMetadataModalBody,
                jobHasFailed,
                getVerb,
            }}
        >
            {children}
        </JobQueueContext.Provider>
    )
}

export default JobQueueContext