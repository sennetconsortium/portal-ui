import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import Spinner from "../../components/custom/Spinner";
import Unauthorized from "../../components/custom/layout/Unauthorized";
import Header from "../../components/custom/layout/Header";
import AppNavbar from "../../components/custom/layout/AppNavbar";
import AppContext from "../../context/AppContext";
import {
    eq,
    getHeaders,
    getJobStatusDefinition,
    getStatusColor,
    THEME,
    getJobTypeColor
} from "../../components/custom/js/functions";
import SenNetPopover from "../../components/SenNetPopover";
import DataTable from "react-data-table-component";
import ColumnsDropdown from "../../components/custom/search/ColumnsDropdown";
import {Container, Row, Button, Form} from "react-bootstrap";
import {getIngestEndPoint, RESULTS_PER_PAGE} from "../../config/config";
import {getOptions, handlePagingInfo, opsDict, ResultsPerPage} from "../../components/custom/search/ResultsPerPage";
import AppModal from "../../components/AppModal";
import {tableColumns} from "../../components/custom/edit/AttributesUpload";
import Swal from 'sweetalert2'
import useDataTableSearch from "../../hooks/useDataTableSearch";
import {get_headers, parseJson} from "../../lib/services";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Stack from '@mui/material/Stack';

function ViewJobs({isAdmin = false}) {

    const searchContext = () => `${isAdmin ? 'admin' : 'user'}.jobs-queue`
    const rowSettingKey = searchContext() + '.rowSetting'

    const [data, setData] = useState([])
    const [timestamp, setTimestamp] = useState(null)
    const {router, isRegisterHidden, isUnauthorized, isAuthorizing, _t, cache, adminGroup} = useContext(AppContext)
    const [errorModal, setErrorModal] = useState(false)
    const currentColumns = useRef([])
    const [hiddenColumns, setHiddenColumns] = useState(null)
    const [rowColoring, setRowColoring] = useState(eq(localStorage.getItem(rowSettingKey), 'true'))
    const [resultsPerPage, setResultsPerPage] = useState(RESULTS_PER_PAGE[1])
    const [showModal, setShowModal] = useState(false)
    const [modalBody, setModalBody] = useState(null)
    const [modalTitle, setModalTitle] = useState(null)
    const [modalSize, setModalSize] = useState('lg')
    const intervalTimer = useRef(null)
    const hasLoaded = useRef(false)
    const colorMap = useRef({})
    let usedColors = {}

    const onKeydown = (e) => {
        if (eq(e.key, 'enter')) {
            const params = new URLSearchParams(window.location.search)
            params.set('q', e.target.value);
            const query = params.toString()
            window.history.pushState(null, null, `?${query}`)
        }
    }

    const {filteredItems, setFilterText, searchBarComponent} = useDataTableSearch(
        {data, fieldsToSearch: ['job_id', 'description', 'status'], className: 'has-extraPadding', onKeydown})

    const successIcon = () => <TaskAltIcon color={'success'} />

    const errIcon = () => <WarningAmberIcon sx={{color: '#842029'}} />

    const randomColor = () => {
        let col;
        do {
            col = THEME.randomColor()
            if (!usedColors[col.color]) {
                usedColors[col.color] = true;
            }
        } while (!usedColors[col.color])
        return col;
    }

    const hasRegistered = (row) => {
        if (colorMap.current[row.job_id]) return true
        for (let item of data) {
           if (item.referrer.path.includes(row.job_id) && eq(item.referrer.type, 'register')) {
               let color = randomColor()
               colorMap.current[row.job_id] = color
               colorMap.current[item.job_id] = color
               return true
           }
        }
        return null
    }

    const getAction = (row) => {
        const status = row.status
        let actions = []
        const isValidate = eq(row.referrer.type, 'validate')
        if (eq(status, 'Complete')) {
            if (!row.errors?.length && isValidate && !hasRegistered(row)) {
                actions.push('Register')
            }
            actions.push('Delete')
        } else if (eq(status, 'Error') && row.errors && isValidate) {
            actions.push('Resubmit')
            actions.push('Delete')
        } else if (eq(status, 'Started')) {
            actions.push('Cancel')
        }
        return actions
    }

    const getVariant = (action) => {
        switch (action) {
            case 'Delete':
                return 'danger'
            case 'Register':
                return 'success'
            case 'Cancel':
                return 'warning'
            default:
                return 'primary'
        }
    }

    const deleteConfig = {
        title: 'Are you sure?',
        text: 'This cannot be undone once deleted.',
        dangerMode: true,
        buttons: true,
        showCancelButton: true,
        confirmButtonText: 'Delete',
        customClass: {
            cancelButton: 'btn btn-secondary',
            confirmButton: 'btn btn-danger',
        }
    }

    const urlPrefix = () => {
        const pre = isAdmin ? 'admin/jobs' : 'jobs'
        return getIngestEndPoint() + pre
    }

    const flushAllData = () => {
        Swal.fire(deleteConfig).then(result => {
            if (result.isConfirmed && isAdmin) {
                fetch(urlPrefix() + `/flush`, {method: 'DELETE', headers: getHeaders()}).then(async (res)=>{
                    setErrorModal(false)
                    setShowModal(true)
                    setModalTitle(<h3>{successIcon()} Jobs flushed</h3>)
                    setModalBody(<div>All jobs have been flushed.</div>)
                }).catch((err)=>{
                    setErrorModal(true)
                    setShowModal(true)
                    setModalTitle(<h3>{errIcon()} Jobs failed to be deleted.</h3>)

                    setModalBody(
                        <div>The jobs could not be flushed. REASON:
                            <div>
                                <code>{err.message}</code>
                            </div>
                        </div> )
                })
            }
        }).catch(error => {
            // when promise rejected...
        });
    }

    const handleSingleJobDeletion = (e, row, action) => {
        Swal.fire(deleteConfig).then(result => {
            if (result.isConfirmed) {
                handleResponseModal(e, row, urlPrefix() + `/${row.job_id}`, 'DELETE', action, 'deleted')
                // Delete
            }
        }).catch(error => {
            // when promise rejected...
        });
    }

    const updateTableData = async (row, res, action) => {
        let job = await res.json()
        if (eq(action, 'delete')) {
            let _data = data.filter((item) => item.job_id !== row.job_id)
            setData(_data)
        }

        if (eq(action, 'register')) {
            let registerRes = await fetch(urlPrefix() + `/${row.job_id}`)
            if (registerRes.ok) {
                let jobInfo = await registerRes.json()
                setData([...data, jobInfo])
            }
        }

        if (eq(action, 'cancel')) {
            data.forEach((item) => {
                if (item.job_id === row.job_id) {
                    item.status = 'Canceled'
                }
            })
            setData([...data])
        }
    }

    const handleResponseModal = (e, row, url, method, action, verb, body = {}) => {
        setModalSize('lg')
        fetch(url, {
            method: method,
            headers: get_headers(),
            body: JSON.stringify(body)
        }).then((res) =>{
            setErrorModal(false)
            setShowModal(true)
            setModalTitle(<h3>{successIcon()} Job {verb}</h3>)
            setModalBody(<div>The job has been {verb}.</div>)

            updateTableData(row, res, action)

        }).catch((err)=>{
            e.target.disabled = false
            setErrorModal(true)
            setShowModal(true)
            setModalTitle(<h3>{errIcon()} Job failed to be {verb}</h3>)
            setModalBody(
                <div>The job could not be {verb}. REASON:
                    <div>
                        <code>{err.message}</code>
                    </div>
            </div> )
        })
    }

    const handleAction = (e, action, row) => {

        if (eq(action, 'Delete')) {
            handleSingleJobDeletion(e, row, action)
        } else if (eq(action, 'Register')) {
            e.target.disabled = true
            const pathName = row.referrer?.path.includes('action=metadata') ? `metadata/register` : `entities/register`
            handleResponseModal(e, row, getIngestEndPoint() + pathName, 'POST', action, 'registered',
                {job_id: row.job_id, referrer: {type: 'register', path: row.referrer?.path + `&job_id=${row.job_id}`
                }})
        } else if (eq(action, 'Cancel')) {
            e.target.disabled = true
            handleResponseModal(e, row, urlPrefix() + `/${row.job_id}/cancel`, 'PUT', action, 'cancelled')
        } else {
           window.location = row.referrer?.path
        }
    }

    const getActionUI = (row) => {
        const actions = getAction(row)
        let ui = [];
        for (let action of actions) {
            ui.push(<Button key={action} variant={getVariant(action)} className={'mx-1'} size="sm" onClick={(e) => handleAction(e, action, row)}>{action}</Button>)
        }

        return ui
    }

    const flatten = (array) => {
        if (!Array.isArray(array)) {
            if (!array.error) {
                return [{error: array.message  || array}]
            } else {
                return [array]
            }
        }
        if (Array.isArray(array) && array.length && array[0].row !== undefined) return array
        let result = []
        for (let item of array) {
            if (item.description && item.description.error) {
                result.push(item.description)
            } else {
                for (let k in item) {
                    if (Array.isArray(item[k]) && item[k].length && item[k][0].row === undefined) {
                        result = flatten(item[k])
                    } else {
                        result = result.concat(item[k])
                    }
                }
            }

        }
        return result
    }

    const handleViewErrorDetailsModal = (row) => {
        const columns = tableColumns(['`', '"', "'"])
        setErrorModal(false)
        let errors = flatten(row.errors)
        setShowModal(true)
        setModalTitle(<h3>Job Error Details</h3>)
        setModalSize('xl')
        setModalBody(<div className={'table-responsive has-error'}><DataTable columns={columns} data={errors} pagination /></div> )
    }

    const getJobType = (row) => {
        let type = row.referrer.type
        type = eq(type, 'validate') ? 'validation' : 'registration'
        return row.referrer?.path?.includes('action=metadata') ? `Metadata ${type}` : `Entity ${type}`
    }

    const getTableColumns = (hiddenColumns) => {
        let cols = [
            {
                name: 'Job ID',
                selector: row => row.job_id,
                sortable: true,
                reorder: true,
                format: row => <span data-field='job_id'>{row.job_id}</span>,
            },
            {
                name: 'Description',
                selector: row => row.description,
                sortable: true,
                reorder: true,
                format: row => <span data-field='job_id' title={row.description}>{row.description}</span>,
            },
            {
                name: 'Status',
                selector: row => row.status,
                width: '150px',
                format: (row) => {
                    return (<div>
                        <span className={`${getStatusColor(row.status)} badge`}>
                        <SenNetPopover text={getJobStatusDefinition(row.status)} className={`status-info-${row.job_id}`}>
                            {row.status}
                        </SenNetPopover>
                        </span>
                            {['error', 'failed'].contains(row.status) && <a className={'mx-2'} href={'#'} onClick={() => handleViewErrorDetailsModal(row)}><small>View details</small></a>}
                    </div>

                    )
                },
                sortable: true,
                reorder: true,
            },
            {
                name: 'Type',
                selector: row => getJobType(row),
                sortable: true,
                reorder: true,
                omit: true,
                format: row => {
                    return <span data-field='type' className={`badge`}
                                 style={{backgroundColor: getJobTypeColor(getJobType(row)),
                                     color: 'black',
                                     padding: '6px', borderRadius: '2px',
                                     minWidth: '122px'}}>{getJobType(row)}</span>
                },
            },
            {
                name: 'Start Date',
                selector: row => row.started_timestamp,
                width: '150px',
                sortable: true,
                reorder: true,
                omit: true,
                format: row => <span data-field='start-date'>{new Date(row.started_timestamp).toLocaleDateString()}</span>,
            },
            {
                name: 'End Date',
                selector: row => row.ended_timestamp,
                width: '150px',
                sortable: true,
                reorder: true,
                omit: true,
                format: row => <span data-field='action'>{new Date(row.ended_timestamp).toLocaleDateString()}</span>,
            },
            {
                name: 'Action',
                selector: row => getAction(row),
                sortable: true,
                reorder: true,
                format: row => <span data-field='action'>{getActionUI(row)}</span>,
            }
        ]

        if (isAdmin) {
            cols.splice(1, 0,
                {
                    name: 'User Id',
                    selector: row => row.user?.email || '',
                    sortable: true,
                    reorder: true,
                    format: row => <span data-field='user_email'>{row.user?.email}</span>,
                }
            )
        }

        if (hiddenColumns) {
            for (let col of cols) {
                col.omit = hiddenColumns[col.name] || false
            }
        }
        currentColumns.current = cols;
        return cols;
    }
    const fetchData = async () => {
        const response = await fetch(urlPrefix(), {method: 'GET', headers: getHeaders()})
        const _data = await response.json()
        setData(_data)
    }

    const mimicSocket = () => {
        clearInterval(intervalTimer.current)
        intervalTimer.current = setInterval(()=>{
            fetchData()
        }, 3000)
    }

    useEffect(() => {
        mimicSocket()

        if (!hasLoaded.current) {
            fetchData()
            hasLoaded.current = true
        }

        document.addEventListener('visibilitychange', () => {
            if (eq(document.visibilityState,'visible')) {
                mimicSocket()
            } else {
                clearInterval(intervalTimer.current)
            }
        })

        const q = router.query.q
        if (q) {
            setFilterText(q)
        }

    }, [])

    getOptions(filteredItems.length)

    const handleResultsPerPage = (val) => {
        setResultsPerPage(val)
        setTimestamp(new Date().getTime())
    }

    const handleRowsPerPageChange = (currentRowsPerPage, currentPage) => {
        setResultsPerPage(currentRowsPerPage)
    }

    const updateRowColoring = () => {
        localStorage.setItem(rowSettingKey, (!rowColoring).toString())
        setRowColoring(!rowColoring)
    }

    const condStyles = [
        {
            when: row => {

                return (colorMap.current[row.job_id] !== undefined) && rowColoring
            },
            style: row => {
                const {r, g, b, light} = colorMap.current[row.job_id]
                return ({ backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`, color: 'black' })
            },
        },
    ];

    if (isUnauthorized() || !hasLoaded.current) {
        return (
            hasLoaded.current === false ? <Spinner/> : <Unauthorized/>
        )
    } else {
        return (
            <>
                {data && <Header title={`${isAdmin ? 'Admin' : 'User'} | Jobs | SenNet`}></Header>}

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>


                {data && <Container fluid className="mb-5 d-block">
                    <Row>
                        <div className="py-4 bd-highlight">
                            <h2 className="m-0 flex-grow-1 bd-highlight">Current Jobs</h2>
                        </div>
                    </Row>

                    <Row>

                    <DataTable
                        key={`results-${timestamp}`} //unique key on ResultsPerPage change is required for DataTable update on paginationPerPage value
                        columns={getTableColumns(hiddenColumns)}
                        data={filteredItems}
                        fixedHeader={true}
                        subHeader
                        subHeaderComponent={
                        <>
                        {searchBarComponent}
                            <div className='sui-layout-main-header mt-4 mb-4'>
                                <div className='sui-layout-main-header__inner'>
                                    <div><Button variant={'outline-primary'} onClick={fetchData}><i className={'bi bi-arrow-clockwise mx-1'} role={'presentation'}></i>Refresh</Button>
                                        {isAdmin && filteredItems.length > 0 && <Button variant={'outline-danger'} className='mx-2' onClick={flushAllData}><i className={'bi bi-trash mx-1'} role={'presentation'}></i>Flush All</Button>}
                                    </div>

                                    {filteredItems.length > 0 && <Stack className={'sui-stack'} direction="row" spacing={2}>
                                        <span className='mx-1 btn-illusion-secondary'><Form.Check
                                            style={{display: 'inline-block'}}
                                            onChange={updateRowColoring}
                                            defaultChecked={rowColoring}
                                            type="switch"
                                            id="custom-switch"
                                            label="Color code linked jobs"
                                        /></span>
                                        <ColumnsDropdown searchContext={searchContext} defaultHiddenColumns={['Start Date', 'End Date', 'Type']} getTableColumns={getTableColumns} setHiddenColumns={setHiddenColumns}
                                                                                      currentColumns={currentColumns} />
                                        <ResultsPerPage resultsPerPage={resultsPerPage} setResultsPerPage={handleResultsPerPage} totalRows={filteredItems.length}  />
                                    </Stack>}
                                </div>
                            </div>
                        </>
                        }
                        onChangeRowsPerPage={handleRowsPerPageChange}
                        paginationPerPage={resultsPerPage}
                        paginationRowsPerPageOptions={Object.keys(opsDict)}
                        conditionalRowStyles={condStyles}
                        pagination />
                        <AppModal modalSize={modalSize} className={`modal--ctaConfirm ${errorModal ? 'is-error' : ''}`} showHomeButton={false} showCloseButton={true} handleClose={() => setShowModal(false)} showModal={showModal} modalTitle={modalTitle} modalBody={modalBody} />
                    </Row>
                </Container>}
                </>
        )
    }
}

ViewJobs.defaultProps = {}

ViewJobs.propTypes = {
    children: PropTypes.node
}

export default ViewJobs