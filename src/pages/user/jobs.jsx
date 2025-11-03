import dynamic from "next/dynamic";
import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import AppContext from "../../context/AppContext";
import LinearProgress from '@mui/material/LinearProgress';
import log from 'loglevel'
import {
    eq,
    getHeaders,
    getJobStatusDefinition,
    getJobTypeColor,
    getStatusColor,
    THEME
} from "@/components/custom/js/functions";
import DataTable from "react-data-table-component";
import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import {getIngestEndPoint, RESULTS_PER_PAGE} from "@/config/config";
import {getOptions, opsDict, ResultsPerPage} from "@/components/custom/search/ResultsPerPage";
import AppModal from "../../components/AppModal";
import {tableColumns} from "@/components/custom/edit/AttributesUpload";
import Swal from 'sweetalert2'
import useDataTableSearch from "../../hooks/useDataTableSearch";
import {getAuthJsonHeaders} from "@/lib/services";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Stack from '@mui/material/Stack';
import JobQueueContext, {JobQueueProvider} from "../../context/JobQueueContext";
import {driver} from "driver.js";
import "driver.js/dist/driver.css";
import {SWAL_DEL_CONFIG, TUTORIAL_THEME} from "@/config/constants";
import JobDashboardTutorialSteps from "../../components/custom/layout/JobDashboardTutorialSteps";
import Spinner, {SpinnerEl} from "../../components/custom/Spinner";

const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const ColumnsDropdown = dynamic(() => import("../../components/custom/search/ColumnsDropdown"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const SenNetPopover = dynamic(() => import("../../components/SenNetPopover"))
const Unauthorized = dynamic(() => import("../../components/custom/layout/Unauthorized"))

function ViewJobs({isAdmin = false}) {

    const searchContext = () => `${isAdmin ? 'admin' : 'user'}.jobs-queue`
    const rowSettingKey = searchContext() + '.rowSetting'
    const {
        intervalTimer, jobHasFailed, getEntityModalBody, getMetadataModalBody,
        fetchEntities
    } = useContext(JobQueueContext)

    const [data, setData] = useState([])
    const [timestamp, setTimestamp] = useState(null)
    const {router, isRegisterHidden, isUnauthorized} = useContext(AppContext)
    const [errorModal, setErrorModal] = useState(false)
    const currentColumns = useRef([])
    const [hiddenColumns, setHiddenColumns] = useState(null)
    const [rowColoring, setRowColoring] = useState(eq(localStorage.getItem(rowSettingKey), 'true'))
    const [resultsPerPage, setResultsPerPage] = useState(RESULTS_PER_PAGE[1])
    const [showModal, setShowModal] = useState(false)
    const [modalBody, setModalBody] = useState(null)
    const [modalTitle, setModalTitle] = useState(null)
    const [modalSize, setModalSize] = useState('lg')
    const [steps, setSteps] = useState([])
    const [driverObj, setDriverObj] = useState(null)


    const currentRow = useRef(null)
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

    const successIcon = () => <TaskAltIcon color={'success'}/>

    const errIcon = () => <WarningAmberIcon sx={{color: '#842029'}}/>

    const getEntityType = (row) => {
        const params = new URLSearchParams(row.referrer?.path)
        return params.get('entityType')
    }

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

        // check the validation job for a register_job_id prob
        const registerJobId = row.register_job_id
        const createColorMap = (item) => {
            let color = randomColor()
            colorMap.current[row.job_id] = color
            colorMap.current[item.job_id] = color
            return true
        }

        if (registerJobId) {
            for (let item of data) {
                if (eq(item.job_id, registerJobId)) {
                    return createColorMap(item)
                }
            }
        }

        // For backwards compatibility only, since old jobs prior to feature change may not have a register_job_id attached
        for (let item of data) {
            if (item.referrer.path.includes(row.job_id) && eq(item.referrer.type, 'register')) {
                return createColorMap(item)
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
        } else if (jobHasFailed(row) && row.errors && isValidate) {
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

    const urlPrefix = () => {
        const pre = isAdmin ? 'admin/jobs' : 'jobs'
        return getIngestEndPoint() + pre
    }

    const flushAllData = () => {
        Swal.fire(SWAL_DEL_CONFIG).then(result => {
            if (result.isConfirmed && isAdmin) {
                fetch(urlPrefix() + `/flush`, {method: 'DELETE', headers: getHeaders()}).then(async (res) => {
                    setErrorModal(false)
                    setShowModal(true)
                    setModalTitle(<h3>{successIcon()} Jobs flushed</h3>)
                    setModalBody(<div>All jobs have been flushed.</div>)
                }).catch((err) => {
                    setErrorModal(true)
                    setShowModal(true)
                    setModalTitle(<h3>{errIcon()} Jobs failed to be deleted.</h3>)

                    setModalBody(
                        <div>The jobs could not be flushed. REASON:
                            <div>
                                <code>{err.message}</code>
                            </div>
                        </div>)
                })
            }
        }).catch(error => {
            // when promise rejected...
            log.info(`flushAllData ${error}`)
        });
    }

    const handleSingleJobCancellation = (e, row, action) => {
        let cancelConfig = JSON.parse(JSON.stringify(SWAL_DEL_CONFIG))
        cancelConfig.text = 'This cannot be undone once cancelled.'
        cancelConfig.confirmButtonText = 'Cancel'
        cancelConfig.customClass = {
            confirmButton: 'btn btn-warning',
        }
        Swal.fire(cancelConfig).then(result => {
            if (result.isConfirmed) {
                handleResponseModal(e, row, urlPrefix() + `/${row.job_id}/cancel`, 'PUT', action, 'cancelled')
            }
        }).catch(error => {
            log.info(`handleSingleJobCancellation ${error}`)
        });
    }

    const handleSingleJobDeletion = (e, row, action) => {
        Swal.fire(SWAL_DEL_CONFIG).then(result => {
            if (result.isConfirmed) {
                handleResponseModal(e, row, urlPrefix() + `/${row.job_id}`, 'DELETE', action, 'deleted')
            }
        }).catch(error => {
            log.info(`handleSingleJobDeletion ${error}`)
        });
    }

    const updateTableData = async (row, res, action) => {
        let job = await res.json()
        if (eq(action, 'delete')) {
            let _data = data.filter((item) => item.job_id !== row.job_id)
            setData(_data)
        }

        if (eq(action, 'register')) {
            let registerRes = await fetch(urlPrefix() + `/${row.job_id}`, {headers: getAuthJsonHeaders()})
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
            headers: getAuthJsonHeaders(),
            body: JSON.stringify(body)
        }).then((res) => {

            if (!eq(action, 'register')) {
                setErrorModal(false)
                setShowModal(true)
                setModalTitle(<h3>{successIcon()} Job {verb}</h3>)
                setModalBody(<div>The job has been {verb}.</div>)
            }

            updateTableData(row, res, action)

        }).catch((err) => {
            e.target.disabled = false
            setErrorModal(true)
            setShowModal(true)
            setModalTitle(<h3>{errIcon()} Job failed to be {verb}</h3>)
            setModalBody(
                <div>The job could not be {verb}. REASON:
                    <div>
                        <code>{err.message}</code>
                    </div>
                </div>)
        })
    }

    const getEntityRegisterPath = (row) => {
        return `${getEntityType(row).toLowerCase()}s/bulk/register`
    }

    const handleAction = (e, action, row) => {

        if (eq(action, 'Delete')) {
            handleSingleJobDeletion(e, row, action)
        } else if (eq(action, 'Register')) {
            e.target.disabled = true
            const pathName = row.referrer?.path.includes('metadata') ? `metadata/register` : getEntityRegisterPath(row)
            handleResponseModal(e, row, getIngestEndPoint() + pathName, 'POST', action, 'registered',
                {
                    job_id: row.job_id, referrer: {
                        type: 'register', path: row.referrer?.path + `&job_id=${row.job_id}`
                    }
                })
        } else if (eq(action, 'Cancel')) {
            handleSingleJobCancellation(e, row, action)
        } else {
            window.location = row.referrer?.path
        }
    }

    const getActionUI = (row) => {
        const actions = getAction(row)
        let ui = [];
        for (let action of actions) {
            ui.push(<Button key={action} variant={getVariant(action)} className={'mx-1'} size="sm"
                            onClick={(e) => handleAction(e, action, row)}>{action}</Button>)
        }

        return ui
    }

    const flatten = (array) => {
        const getErrorVal = (r) => r.message || r.description || (eq(typeof r, 'object') ? JSON.stringify(r) : r + "")

        if (!Array.isArray(array)) {
            if (!array.error) {
                return [{error: getErrorVal(array)}]
            } else {
                return [array]
            }
        }
        if (Array.isArray(array) && array.length && array[0].row !== undefined) return array

        if (Array.isArray(array) && array.length && array[0].error === undefined) {
            if (array[0].description && array[0].description.error) {
                let errors = []
                for (let item of array) {
                    errors.push(item.description)
                }
                return errors;
            } else {
                array.forEach((item) => {
                    item.id = item.index
                    item.row = item.index
                    item.error = getErrorVal(item)
                })
                array = array.filter((item) => !item.success)
                return array
            }

        }

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
        const columns = tableColumns()
        setErrorModal(false)
        let errors = flatten(row.errors)
        log.debug('JOB ERRORS', errors)
        setShowModal(true)
        setModalTitle(<h3>Job Error Details</h3>)
        setModalSize('xl')
        setModalBody(<div className={'table-responsive has-error'}><DataTable defaultSortFieldId={'row'} columns={columns} data={errors}
                                                                              pagination/></div>)
    }

    const isMetadata = (row) => row.referrer?.path?.includes('metadata')

    const getJobType = (row) => {
        let type = row.referrer.type
        if (eq(type, 'cache')) {
            return 'Cache'
        }
        type = eq(type, 'validate') ? 'validation' : 'registration'
        return isMetadata(row) ? `Metadata ${type}` : `Entity ${type}`
    }

    const isRegisterJob = (row) => eq(row.referrer.type, 'register')

    const jobCompleted = (row) => eq(row.status, 'complete')

    const getDescriptionModal = (row) => {
        setModalSize('lg')
        setModalTitle(<h4>Job Description</h4>)
        setModalBody(<div>{row.description}
            <div className={'mt-3'}><small>Job ID: <code>{row.job_id}</code></small></div>
        </div>)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
    }

    const handleViewRegisterDetailsModal = async (row) => {
        currentRow.current = row
        const entityType = getEntityType(row)
        const _file = {name: row.job_id + '.tsv'}
        setErrorModal(false)
        setModalTitle(<h3>{getJobType(row)} job completion details</h3>)
        setShowModal(true)
        setModalBody(<div><Spinner/></div>)
        setModalSize('xl')
        const data = await fetchEntities(currentRow.current, {clearFetch: false, entityType})

        if ((data.passes && data.passes.length) || (data.fails && data.fails.length)) {
            if (isMetadata(currentRow.current)) {
                setModalBody(getMetadataModalBody(data, {_file, entityType}))
            } else {
                setModalBody(getEntityModalBody(data, {_file, entityType}))
            }
        } else {
            setErrorModal(true)
            setModalBody(<div>The requested entities no longer exist.</div>)
        }
    }

    const getViewDetailsModal = async (e, row) => {
        e.preventDefault()
        if (jobHasFailed(row)) {
            handleViewErrorDetailsModal(row)
        } else {
            await handleViewRegisterDetailsModal(row)
        }
    }

    const getTableColumns = (hiddenColumns) => {
        let cols = [
            {
                name: 'Job ID',
                selector: row => row.job_id,
                sortable: true,
                reorder: true,
                maxWidth: '350px',
                format: row => <span data-field='job_id'>{row.job_id}</span>,
            },
            {
                name: 'Description',
                selector: row => row.description,
                sortable: true,
                reorder: true,
                format: row => <div style={{cursor: 'pointer'}} data-field='job_id' title={row.description}
                                    onClick={() => getDescriptionModal(row)}>
                    <SenNetPopover text={<>Click to view full description.</>} className={`desc-info-${row.job_id}`}>
                        {row.description}
                    </SenNetPopover>
                </div>,
            },
            {
                name: 'Status',
                selector: row => row.status,
                width: '190px',
                format: (row) => {
                    const hasStarted = eq(row.status, 'started')
                    return (<div className={'p-2'}>
                        <span className={`${getStatusColor(row.status)} badge`}>
                         <SenNetPopover text={getJobStatusDefinition(row.status)}
                                        className={`status-info-${row.job_id}`}>
                            {row.status}
                        </SenNetPopover>
                        </span>
                            {hasStarted && !isRegisterJob(row) && <span
                                style={{position: 'absolute', marginLeft: '5px', marginTop: '2px'}}><SpinnerEl/></span>}
                            {(jobHasFailed(row) || (jobCompleted(row) && isRegisterJob(row))) &&
                                <a className={'mx-2'} href={'#'} onClick={(e) => getViewDetailsModal(e, row)}><small>View
                                    details</small></a>}
                            {hasStarted && isRegisterJob(row) &&
                                <span className={'mt-2'} style={{display: 'block'}}><LinearProgress
                                    variant="determinate" value={row.progress}/> <small>{row.progress}%</small></span>}
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
                width: '170px',
                format: row => {
                    return <span data-field='type' className={`badge badge-block`}
                                 style={{backgroundColor: getJobTypeColor(getJobType(row))}}>{getJobType(row)}</span>
                },
            },
            {
                name: 'Start Date',
                id: 'started_timestamp',
                selector: row => row.started_timestamp,
                width: '180px',
                sortable: true,
                reorder: true,
                omit: true,
                format: row => {
                    const date = new Date(row.started_timestamp)
                    return (
                        <span data-field='start-date'>
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </span>
                    )
                },
            },
            {
                name: 'End Date',
                selector: row => row.ended_timestamp,
                width: '180px',
                sortable: true,
                reorder: true,
                omit: true,
                format: row => {
                    const date = new Date(row.ended_timestamp)
                    return (
                        <span data-field='end-date'>
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </span>
                    )
                },
            },
            {
                name: <span><i className={'color-wheel'}></i></span>,
                id: 'rowColoring',
                sortable: true,
                width: '100px',
                omit: rowColoring,
                selector: row => colorMap.current[row.job_id]?.color || '0',
                format: row => <></>
            },
            {
                name: 'Action',
                selector: row => getAction(row),
                sortable: true,
                reorder: true,
                format: row => <span data-field='action'>{getActionUI(row)}</span>,
            },
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

            cols.splice(-1, 0,
                {
                    name: 'Enqueued Date',
                    id: 'enqueued_timestamp',
                    selector: row => row.enqueued_timestamp || '',
                    width: '180px',
                    sortable: true,
                    reorder: true,
                    omit: true,
                    format: row => {
                        let timestring = ''
                        if (row.enqueued_timestamp) {
                            const date = new Date(row.enqueued_timestamp)
                            timestring = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                        }
                        return <span data-field='enqueued-date'>{timestring}</span>
                    },
                }
            )

            cols.splice(-1, 0,
                {
                    name: 'Scheduled For Date',
                    id: 'scheduled_for_timestamp',
                    selector: row => row.scheduled_for_timestamp || '',
                    width: '180px',
                    sortable: true,
                    reorder: true,
                    omit: true,
                    format: row => {
                        let timestring = ''
                        if (row.scheduled_for_timestamp) {
                            const date = new Date(row.scheduled_for_timestamp)
                            timestring = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                        }
                        return <span data-field='scheduled-for-timestamp'>{timestring}</span>
                    },
                }
            )
        }

        if (hiddenColumns) {
            for (let col of cols) {
                if (eq(col.id, 'rowColoring')) {
                    col.omit = rowColoring === false ? true : hiddenColumns[col.name]
                } else {
                    col.omit = hiddenColumns[col.name] || false
                }
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
        intervalTimer.current = setInterval(() => {
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
            if (eq(document.visibilityState, 'visible')) {
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

    useEffect(() => {
        setSteps(JobDashboardTutorialSteps({getVariant, data: filteredItems}))
    }, [data])

    useEffect(() => {
        if (steps.length > 0) {
            console.log('steps', steps)
            setDriverObj(driver({
                popoverClass: 'driverjs-theme',
                animate: false,
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                steps: steps
            }))
        }
    }, [steps])

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
                return ({backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`, color: 'black'})
            },
        },
    ];

    const handleTutorial = () => {
        driverObj.drive();
    }

    const handleFinishTutorial = (data) => {
        const {status, type} = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setTutorial({...tutorial, run: false})
        }
    }

    if (isUnauthorized() || !hasLoaded.current) {
        return (
            hasLoaded.current === false ? <Spinner/> : <Unauthorized/>
        )
    } else {
        return (
            <>
                {data && <Header title={`${isAdmin ? 'Admin' : 'User'} | Job Dashboard | SenNet`}></Header>}

                <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>


                {data && <Container fluid className="mb-5 d-block sui-jobs-dashboard">
                    <Row>
                        <div className="py-4 bd-highlight">
                            <h2 className="m-0 flex-grow-1 bd-highlight">Job Dashboard</h2>
                        </div>
                    </Row>

                    <Row>

                        <div className='container'>
                            <Alert variant={'info'}>
                                <div>
                                    <p>This dashboard provides an overview of the job queue and is used to track queued,
                                        completed, and
                                        jobs in progress. Users can initiate new jobs via the wizard by visiting any
                                        link under "Register entity -&gt; Bulk" or "Upload metadata" at the top of the
                                        page.</p>

                                    <p>Once validation of the submitted TSV is complete, users can click on the
                                        "Register" button
                                        located under the Action column to finalize entity registration or metadata
                                        upload.</p>

                                    <p>Validation and registration jobs of the same file are linked and this
                                        relationship can be shown and grouped in the table by enabling "Color code
                                        linked jobs"</p>

                                    <button className='btn btn-primary' onClick={() => handleTutorial()}>Begin Tutorial
                                        Tour
                                    </button>
                                </div>
                            </Alert>
                        </div>

                        <DataTable
                            key={`results-${timestamp}`} //unique key on ResultsPerPage change is required for DataTable update on paginationPerPage value
                            columns={getTableColumns(hiddenColumns)}
                            data={filteredItems}
                            fixedHeader={true}
                            defaultSortFieldId={'started_timestamp'}
                            defaultSortAsc={false}
                            subHeader
                            subHeaderComponent={
                                <>
                                    {searchBarComponent}
                                    <div className='sui-layout-main-header mt-4 mb-4'>
                                        <div className='sui-layout-main-header__inner'>
                                            <div><Button variant={'outline-primary'} onClick={fetchData}><i
                                                className={'bi bi-arrow-clockwise mx-1 refresh-jobs'}
                                                role={'presentation'}></i>Refresh</Button>
                                                {isAdmin && filteredItems.length > 0 &&
                                                    <Button variant={'outline-danger'} className='mx-2'
                                                            onClick={flushAllData}><i className={'bi bi-trash mx-1'}
                                                                                      role={'presentation'}></i>Flush
                                                        All</Button>}
                                            </div>

                                            {filteredItems.length > 0 &&
                                                <Stack className={'sui-stack'} direction="row" spacing={2}>
                                        <span className='mx-1 btn-illusion-secondary'><Form.Check
                                            style={{display: 'inline-block'}}
                                            onChange={updateRowColoring}
                                            defaultChecked={rowColoring}
                                            type="switch"
                                            id="custom-switch"
                                            label="Color code linked jobs"
                                        /></span>
                                                    <ColumnsDropdown searchContext={searchContext}
                                                                     defaultHiddenColumns={['Start Date', 'End Date', 'Type']}
                                                                     getTableColumns={getTableColumns}
                                                                     setHiddenColumns={setHiddenColumns}
                                                                     currentColumns={currentColumns}
                                                                     deleteFirst={false}/>
                                                    <ResultsPerPage resultsPerPage={resultsPerPage}
                                                                    setResultsPerPage={handleResultsPerPage}
                                                                    totalRows={filteredItems.length}/>
                                                </Stack>}
                                        </div>
                                    </div>
                                </>
                            }
                            onChangeRowsPerPage={handleRowsPerPageChange}
                            paginationPerPage={resultsPerPage}
                            paginationRowsPerPageOptions={Object.keys(opsDict)}
                            conditionalRowStyles={condStyles}
                            pagination/>
                        <AppModal modalSize={modalSize} className={`modal--ctaConfirm ${errorModal ? 'is-error' : ''}`}
                                  showPrimaryBtn={false} handleSecondaryBtn={
() => closeModal()}
                                  showModal={showModal} modalTitle={modalTitle} modalBody={modalBody}/>
                    </Row>
                </Container>}
                <AppFooter/>
            </>
        )
    }
}

ViewJobs.propTypes = {
    children: PropTypes.node
}

export default ViewJobs

ViewJobs.withWrapper = function (page) {
    return <JobQueueProvider>{page}</JobQueueProvider>
}