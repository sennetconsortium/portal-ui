import React, {useContext, useEffect, useState, useCallback} from 'react'
import PropTypes from 'prop-types'
import { Upload, CheckCircleFill, XCircleFill, Download, ArrowRepeat} from "react-bootstrap-icons";
import {InputGroup, OverlayTrigger, Tooltip, Popover} from 'react-bootstrap';
import {getIngestEndPoint} from "../../../config/config";
import log from 'loglevel'
import DataTable from 'react-data-table-component';
import $ from 'jquery'
import { get_auth_header } from "../../../lib/services";
import SenPopover, {SenPopoverOptions} from "../../SenPopover";


export const formatErrorColumn = (d = '"') => {
    const formatError = (val) => val.replaceAll(' '+d, ' <code>').replaceAll(' "', ' <code>').replaceAll(d, '</code>').replaceAll('"', '</code>')

    $('.rdt_TableBody [data-column-id="2"] div').each((i, el) => {
        const txt = $(el).html()
        $(el).html(formatError(txt))
    })
}

export const tableColumns = [
    {
        name: 'Row',
        selector: row => row.row,
        sortable: true,
        width: '100px',
    },
    {
        name: 'Error',
        selector: row => row.column ? ` "${row.column}" ` + row.error : row.error,
        sortable: true,
    }
]

export const formatErrorColumnTimer = (d = '"') => {
    let st
    // Unfortunately have to format like this with setTimeout as
    // the 3rd party DataTable component doesn't appear allow for html in the row values.
    clearTimeout(st)
    st = setTimeout(()=> {
        let st2
        $('.rdt_TableCol').on('click', (e) => {
            clearTimeout(st2)
            st2 = setTimeout(()=>{
                formatErrorColumn(d)
            }, 100)
        })
        formatErrorColumn(d)
    }, 200)
}

function MetadataUpload({ setMetadata, entity, subType }) {

    useEffect(()=> {
        if (file && rerun !== subType) {
            setRerun(subType)
        } else {
            setRerun(null)
        }


    }, [subType])

    const [file, setFile] = useState('')
    const [fileStatus, setFileStatus] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [validationError, setValidationError] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [table, setTable] = useState({})
    const [rerun, setRerun] = useState(null)

    const isUnacceptable = (code) => code === 406

    const getErrorList = (details) => {
        let data = []
        try {
            let {code, description} = details
            const preflight = description['Preflight']
            let err = preflight ? {error: preflight} : {error: description}
            err = isUnacceptable(code) && !preflight ? null : err
            if (err) {
                data = [err]
            } else {
                if (Array.isArray(description)) {
                    if (typeof description[0] === 'string') {
                        data = description.map(d => {
                            return {error: d}
                        })
                    } else {
                        data = Array.from(description)
                    }
                } else {
                    data = [{error: JSON.stringify(description)}]
                }
            }
            log.debug('Metadata errors', data)

        } catch (e) {
            console.error(e)
        }
        return {data, columns: tableColumns};
    }

    const handleUpload = async (e) => {
        try {
            const upload = e.currentTarget.files ? e.currentTarget.files[0] : file
            if (!upload) return
            log.debug('Metadata', file)
            setRerun(null)
            setIsValidating(true)
            let formData = new FormData()
            setFile(upload)
            setFileStatus(upload.name)
            formData.append('metadata', upload)
            formData.append('entity_type', entity)
            formData.append('sub_type', subType)
            formData.append('ui_type', 'gui')
            const response = await fetch(getIngestEndPoint() + 'validation', { method: 'POST', body: formData, headers: get_auth_header() })
            const details = await response.json()
            $('[type=file]').val(null)
            if (details.code !== 200) {
                setError(details.description)
                setFileStatus(details.name)
                setSuccess(false)
                const result = getErrorList(details)
                if (isUnacceptable(details.code)) {
                    setValidationError(true)
                }
                setTable(result)
                formatErrorColumnTimer()
            } else {
                setError(false)
                setValidationError(false)
                setFileStatus(upload.name)
                setSuccess(true)
                setMetadata(details)
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
        let url = 'https://docs.sennetconsortium.org/libraries/ingest-validation-tools/schemas/'
        url += entity
        url = subType ? `${url}-${subType}` : url
        return url.toLowerCase()
    }

    return (
        <div className={`c-metadataUpload`}>
            <InputGroup className="mb-3">

                <SenPopover placement={SenPopoverOptions.placement.right} trigger={SenPopoverOptions.triggers.hoverOnClickOff}
                            className='c-metadataUpload__popover'
                            text={<span>Click here to upload and validate your <code>{entity}</code> metadata TSV file for submission.<br />
                            <small className='popover-note text-muted'>For example TSV schemas, please see the <a href={getSchemaUrl()}>docs</a>.</small></span>}
                >
                    <label htmlFor='entity_metadata' className='btn btn-outline-primary rounded-0 mt-1 btn--fileUpload'>
                        Upload Metadata
                        <input onInput={handleUpload} type='file' id='entity_metadata' name='entity_metadata' />
                        <Upload size={12} />
                    </label>
                </SenPopover>


                <span className={`c-metadataUpload__meta js-fileInfo ${error ? `has-error  ${validationError ? 'has-hover' : ''}` : ''}`}>
                    {error && <XCircleFill color='#842029' />}
                    {success && <CheckCircleFill color='#0d6efd' />}
                    <small role={validationError ? 'button' : null} onClick={downloadDetails} title={`${validationError ? 'Download error report' : ''}`}>
                        {fileStatus} {validationError && <Download />}
                        {isValidating && <span className="spinner spinner-border ic alert alert-info"></span>}
                    </small>
                    {rerun && <span role='button' onClick={handleUpload} title='Rerun validation' className='ic rerun'> <ArrowRepeat size={12} /></span>}
                </span>
                {error &&  <div className='c-metadataUpload__table table-responsive has-error'>
                    <DataTable
                        columns={table.columns}
                        data={table.data}
                        pagination />
                </div>}

            </InputGroup>
        </div>
    )
}

MetadataUpload.defaultProps = {
    subType: ''
}

MetadataUpload.propTypes = {
    setMetadata: PropTypes.func,
    entity: PropTypes.string.isRequired,
    subType: PropTypes.string
}

export default MetadataUpload