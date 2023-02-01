import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import { Upload, CheckCircleFill, XCircleFill, Download} from "react-bootstrap-icons";
import InputGroup from 'react-bootstrap/InputGroup';
import {getIngestEndPoint} from "../../../config/config";
import log from 'loglevel'
import DataTable from 'react-data-table-component';
import $ from 'jquery'

function MetadataUpload({ setMetadata, entity }) {
    useEffect(() => {
    }, [])
    const [file, setFile] = useState('')
    const [fileStatus, setFileStatus] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [table, setTable] = useState({})


    const getErrorList = (response) => {
        let data = []

        let columns = [
            {
                name: 'Row',
                selector: row => row.row,
                sortable: true,
                width: '100px',
            },
            {
                name: 'Column',
                selector: row => row.column,
                sortable: true,
                maxWidth: '300px'
            },
            {
                name: 'Error',
                selector: row => row.error,
                sortable: true,
            }
        ]

        try {

            let errors = []
            let split = false;
            for (let key in response) {
                if (key === 'Preflight') {
                    errors.push(response[key])
                } else {
                    split = true;
                    errors.push(...response[key])
                }
            }

            let hasRows;

            const cleanColumn = (val) => val.replace('column "', '').replace('"', '')
            const cleanRow = (val) => val.replace('On row', '')

            for (let row of errors) {
                let r = split ? row.split(',') : [row];
                if (r.length > 1) {
                    hasRows = r.length > 2;
                    data.push({
                        row: cleanRow(r[0]),
                        column: hasRows ? cleanColumn(r[1]) : cleanColumn(r[0]),
                        error: hasRows ? r[2] : r[1]
                    })
                } else {
                    data.push({
                        error: r[0]
                    })
                }
            }

        } catch (e) {
            console.error(e)
        }
        return {data, columns};
    }

    const formatErrorColumn = () => {
        const formatError = (val) => val.replaceAll(' "', ' <code>').replaceAll('"', '</code>')

        $('.rdt_TableBody [data-column-id="3"] div').each((i, el) => {
            const txt = $(el).html()
            $(el).html(formatError(txt))
        })
    }

    const handleUpload = async (e) => {
        try {
            const upload = e.currentTarget.files[0]
            let formData = new FormData()
            setFile(upload.name)
            setFileStatus(upload.name)
            formData.append('metadata', upload)

            let st
            const response = await fetch(getIngestEndPoint() + 'validation', { method: 'POST', body: formData })
            const details = await response.json()
            if (details.code !== 200) {
                setError(details.description)
                setFileStatus(details.name)
                setSuccess(false)
                const result = getErrorList(details.description)
                setTable(result)

                // Unfortunately have to format like this with setTimeout as
                // the 3rd party DataTable component doesn't appear allow for html in the row values.
                clearTimeout(st)
                st = setTimeout(()=> {
                    let st2
                    $('.rdt_TableCol').on('click', (e) => {
                        clearTimeout(st2)
                        st2 = setTimeout(()=>{
                            formatErrorColumn()
                        }, 100)
                    })
                    formatErrorColumn()
                }, 200)
            } else {
                setError(false)
                setFileStatus(upload.name)
                setSuccess(true)
                setMetadata(details.metadata)
            }
        } catch(e) {
            console.error(e)
        }
    }

    const downloadDetails = (e) => {
        try {
            if (!error) return
            const a = document.createElement('a')

            const url = window.URL.createObjectURL(new Blob([JSON.stringify(error, null, 2)],
                {type: "application/json"}))
            a.href = url
            a.download = `${file}-upload-results.json`
            document.body.append(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className={`c-metadataUpload`}>
            <InputGroup className="mb-3">

                <label htmlFor='entity_metadata' className='btn btn-outline-primary rounded-0 mt-1 btn--fileUpload'>
                    Upload Metadata
                    <input onChange={handleUpload} type='file' id='entity_metadata' name='entity_metadata' />
                    <Upload size={12} />
                </label>
                <span className={`c-metadataUpload__meta js-fileInfo ${error ? 'has-error ' : ''}`}>
                    {error && <XCircleFill color='#842029' />}
                    {success && <CheckCircleFill color='#0d6efd' />}
                    <small role={error ? 'button' : null} onClick={downloadDetails} title={`${error ? 'Download error report' : ''}`}>{fileStatus} {error && <Download />}</small>
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

MetadataUpload.defaultProps = {}

MetadataUpload.propTypes = {
    setMetadata: PropTypes.func,
    entity: PropTypes.string.isRequired,
}

export default MetadataUpload