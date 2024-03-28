import React, {useContext, useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {Button, Form} from 'react-bootstrap';
import {InputGroup} from 'react-bootstrap';
import {getDocsRootURL, getIngestEndPoint} from "../../../config/config";
import log from 'loglevel'
import DataTable from 'react-data-table-component';
import $ from 'jquery'
import { get_auth_header } from "../../../lib/services";
import SenNetPopover, {SenPopoverOptions} from "../../SenNetPopover";
import {eq, urlify} from "../js/functions";

const handleErrorRow = (row) => {
    let err = row.error || row.message
    if (typeof row.error === 'object') {
        err = err.msg
        if (row.error.data) {
            const jsonStr = JSON.stringify(row.error.data);
            err += ' http://local/api/json?view='+btoa(jsonStr)
        }
    }
    return err
}
export const tableColumns = (d = '"') => [
    {
        name: 'Row',
        selector: row => row.row,
        sortable: true,
        width: '100px',
    },
    {
        name: 'Error',
        selector: row => {
            let err = handleErrorRow(row)
            return row.column ? ` "${row.column}" ` + err : err
        },
        sortable: true,
        format: (row) => {
            const formatError = (val) => {
                let del = d
                if (!Array.isArray(d)) {
                    del = [d]
                }
                for (let l of del) {
                    val = val.replaceAll(' '+l, ' <code>').replaceAll(' "', ' <code>').replaceAll(l, '</code>').replaceAll('"', '</code>')
                }
                return val
            }
            let err = handleErrorRow(row)
            err = formatError(err)
            return <span dangerouslySetInnerHTML={{__html: urlify(err)}} />
        }
    }
]

const isUnacceptable = (code) => code === 406

export const getErrorList = (details) => {
    let data = []
    try {
        let {code, description} = details
        const keyedErrors = description['Preflight'] || description['Validation Errors'] || description['URL Errors'] || description['Request Errors']

        const errorMessageFormat = (err) => {
            let results = []
            if (typeof err === 'object') {
                for (let key in err) {
                    results.push({error: `${key}: ${err[key]}`})
                }
            } else {
                results.push({error: err})
            }
            return results
        }

        let err = keyedErrors ? keyedErrors : description

        if (Array.isArray(err)) {
            if (err.length) {
                // Is it already formatted?
                if (err[0].error) {
                    data = err
                } else {
                    // No, let's run through the list and format for the table.
                    for (let item of err) {
                        data = data.concat(errorMessageFormat(item))
                    }
                }
            }
        } else {
            data = errorMessageFormat(err)
        }

        log.debug('Metadata errors', data)

    } catch (e) {
        console.error(e)
    }
    return {data, columns: tableColumns()};
}

export const getResponseList = (details, excludeColumns) => {
    let data = details?.description || details
    let columns = []
    for (let column of data?.headers) {
        if (excludeColumns.indexOf(column) === -1) {
            columns.push(
                {
                    name: column.upperCaseFirst(),
                    selector: row => row[column],
                    sortable: true,
                }
            )
        }

    }

    return {data: data?.records, columns}
}

function AttributesUpload({ setAttribute, attribute, ingestEndpoint, entity, subType, showAllInTable, excludeColumns, title, customFileInfo }) {

    const attributeInputRef = useRef()
    const [file, setFile] = useState('')
    const [fileStatus, setFileStatus] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [validationError, setValidationError] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [table, setTable] = useState({})
    const [rerun, setRerun] = useState(null)
    const initialized = useRef(false)

    useEffect(()=> {
        if (!initialized.current){
            initialized.current = true
            setAttribute({})
        }
        if (file && rerun !== subType) {
            setError(true)
            setRerun(subType)
            setSuccess(false)
            setAttribute({})
            handleUpload(null)
        } else {
            setRerun(null)
        }

    }, [subType])


    const handleUpload = async (e) => {
        try {
            const upload = e && e.currentTarget.files ? e.currentTarget.files[0] : file
            if (!upload) return
            log.debug('Metadata', file)
            setRerun(null)
            setIsValidating(true)
            let formData = new FormData()
            setFile(upload)
            setFileStatus(upload.name)
            formData.append(attribute, upload)
            formData.append('attribute', attribute)
            formData.append('entity_type', entity)
            formData.append('sub_type', subType)
            formData.append('ui_type', 'gui')
            const response = await fetch(getIngestEndPoint() + ingestEndpoint, { method: 'POST', body: formData, headers: get_auth_header() })
            const details = await response.json()
            $('[type=file]').val(null)
            if (details.code !== 200) {
                setError(details.description)
                const uploadName = upload.name.length > 12 ? upload.name.substr(0, 12) + '...' : upload.name
                setFileStatus(`${details.name}: ${uploadName}`)
                setSuccess(false)
                const result = getErrorList(details)
                if (isUnacceptable(details.code)) {
                    setValidationError(true)
                }
                setTable(result)
            } else {
                if (showAllInTable) {
                    setTable(getResponseList(details, excludeColumns))
                }
                setError(false)
                setValidationError(false)
                setFileStatus(upload.name)
                setSuccess(true)
                setAttribute(details)
            }
            setIsValidating(false)
        } catch(e) {
            console.error(e)
        }
    }

    const downloadDetails = (e) => {
        try {
            if (!validationError) return
            const a = document.createElement('a')

            const url = window.URL.createObjectURL(new Blob([JSON.stringify(error, null, 2)],
                {type: "application/json"}))
            a.href = url
            a.download = `${file.name}-upload-results.json`
            document.body.append(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (e) {
            console.error(e)
        }
    }

    const getSchemaUrl = () => {
        return `${getDocsRootURL()}libraries/ingest-validation-tools/schemas/`
    }

    const getTooltip = () => {
        if (eq(attribute, 'metadata')) {
            return <span>Click here to upload and validate your <code>{entity}</code> metadata TSV file for submission.<br />
                            <small className='popover-note text-muted'>For example TSV schemas, please see the <a href={getSchemaUrl()}>docs</a>.</small></span>
        } else {
            return <span>Click here to upload and validate your <code>{attribute}</code> TSV file.</span>
        }
    }

    const handleUploadMetadataClick = () => attributeInputRef.current.click()


    return (
        <div className={`c-metadataUpload`}>
            <InputGroup className="mb-3">
                <input style={{display: 'none'}} onInput={handleUpload} type='file' id='entity_metadata'
                       name='entity_metadata' ref={attributeInputRef}/>

                <SenNetPopover placement={SenPopoverOptions.placement.right}
                               trigger={SenPopoverOptions.triggers.hoverOnClickOff}
                               className={`c-metadataUpload__popover--${attribute}`}
                               text={getTooltip()}
                >
                    <Button variant={'outline-primary rounded-0'} onClick={handleUploadMetadataClick}>
                        Upload {attribute.toLowerCase()} file
                        <i className={'bi bi-paperclip ms-2'}/>
                    </Button>
                </SenNetPopover>


                <span className={`c-metadataUpload__meta js-fileInfo ${error ? `has-error  ${validationError ? 'has-hover' : ''}` : ''}`}>
                    {error && <i className="bi bi-x-circle-fill" style={{color:'#842029'}}></i>}
                    {success && <i className="bi bi-check-circle-fill" style={{color:'#0d6efd'}}></i>}
                    <small role={validationError ? 'button' : null} onClick={downloadDetails} title={`${validationError ? 'Download error report' : ''}`}>
                        <span className={'c-metadataUpload__fileStatus'}>{fileStatus}</span> {validationError &&
                        <i className="bi bi-download"></i>}
                        {isValidating && <span className="spinner spinner-border ic alert alert-info"></span>}
                    </small>
                </span>
                {customFileInfo}
                {(error || showAllInTable) && table.data && <div className={`c-metadataUpload__table table-responsive ${error ? 'has-error' : ''}`}>
                    {title}
                    <DataTable
                        columns={table.columns}
                        data={table.data}
                        pagination />
                </div>}

            </InputGroup>
        </div>
    )
}

AttributesUpload.defaultProps = {
    subType: '',
    attribute: 'metadata',
    ingestEndpoint: 'metadata/validate',
    showAllInTable: false,
    excludeColumns: []
}

AttributesUpload.propTypes = {
    setAttribute: PropTypes.func,
    entity: PropTypes.string.isRequired,
    subType: PropTypes.string,
    attribute: PropTypes.string.isRequired,
    ingestEndpoint: PropTypes.string.isRequired,
    showAllInTable: PropTypes.bool.isRequired,
    excludeColumns: PropTypes.array,
    title: PropTypes.node,
    customFileInfo: PropTypes.node,
}

export default AttributesUpload