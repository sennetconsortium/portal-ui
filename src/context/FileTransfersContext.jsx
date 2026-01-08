import {createContext, useContext, useEffect, useState} from "react";
import {getDatasetsByIds, getTransferAuthJsonHeaders, parseJson} from "@/lib/services";
import {getIngestEndPoint} from "@/config/config";
import {APP_ROUTES} from "@/config/constants";
import LnkIc from "@/components/custom/layout/LnkIc";
import {getStatusColor, getStatusDefinition,} from "@/components/custom/js/functions"
import DataTable from "react-data-table-component";
import SenNetPopover from "@/components/SenNetPopover";
import AppContext from "@/context/AppContext";

const FileTransfersContext = createContext()

export const FileTransfersProvider = ({children}) => {
    const {logout} = useContext(AppContext)
    const [isLoading, setIsLoading] = useState(null)
    const [error, setError] = useState(null)

    const [globusCollections, setGlobusCollections] = useState([])
    const [globusRunURLs, setGlobusRunURLs] = useState(null)

    const [tableData, setTableData] = useState([])

    const getTransferEndpointsUrl = () => {
        return `${getIngestEndPoint()}transfers/endpoints`
    }

    const getTransfersUrl = () => {
        return `${getIngestEndPoint()}transfers`
    }

    const tokenExpired = () => {
        logout()
        location.reload()
    }

    async function getGlobusCollections() {
        setIsLoading(true)
        let data
        const requestOptions = {
            method: 'GET',
            headers: getTransferAuthJsonHeaders(),
        }
        const response = await fetch(getTransferEndpointsUrl(), requestOptions)
        // Upon load of /transfers, check the token response
        if (response.status == 498) {
            tokenExpired()
        }
        if (response.ok) {
            data = await response.json()
            setGlobusCollections(data)
        }
        return data
    }

    const referenceColumns = [
        {
            name: 'SenNet ID',
            id: 'sennetId',
            selector: row => row.sennetId,
            format: (row) => <span title={row.uuid}>{row.sennetId}</span>
        },
        {
            name: 'Status',
            id: 'status',
            selector: row => row.status,
            format: (row) => <span className={`${getStatusColor(row.status)} badge`}><SenNetPopover
                        text={getStatusDefinition(row.status)}
                        className={`status-info-${row.uuid}`}>{row.status}</SenNetPopover></span>,
        },
        {
            name: 'Group',
            id: 'groupName',
            selector: row => row.groupName,
        }
    ]


    async function transferFiles(formData) {
        setIsLoading(true)
        let manifest = JSON.parse(JSON.stringify(tableData))
        manifest.forEach(obj => {
            delete obj.id; // Removes the DataTable required id field
        })
        const body = {
            ...formData,
            manifest
        }
        const requestOptions = {
            method: 'POST',
            headers: getTransferAuthJsonHeaders(),
            body: JSON.stringify(body)
        }
        const response = await fetch(getTransfersUrl(), requestOptions)
        if (response.ok) {
            //     We expect a list of Globus run IDs in a valid response
            let jsonResponse = await response.json()
            let globusRunURLs = []
            jsonResponse['task_ids'].forEach((runId) => {
                globusRunURLs.push("https://app.globus.org/activity?taskId=" + runId)
            })
            setGlobusRunURLs(globusRunURLs)
            setIsLoading(false)
        } else {
           
            let ids = manifest.map((g) => g.dataset)
            let datasets = await getDatasetsByIds(ids)
            
            let jsonResponse = await response.json()
            setError(<>
            <p>Transfering files from the <code>Datasets</code> listed below failed. If these <code>Datasets</code> are not <span className={`${getStatusColor('Published')} badge`}>Published</span>, you must belong to the 
                corresponding group to transfer files. </p>
            <p>Additionally, please make sure there are no duplicate transfers at <LnkIc text={'Globus Activity'} href="https://app.globus.org/activity" /> before continuing.</p>
            <DataTable columns={referenceColumns} data={datasets} pagination/>
            <br />
            <h5>Globus error message:</h5>
            <pre><code>{jsonResponse.error}</code></pre>
            </>)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const _entities = parseJson(sessionStorage.getItem('transferFiles'))
        if (Array.isArray(_entities)) {
            let list = []
            let id = 1
            for (let e of _entities) {
                list.push({
                    id,
                    dataset: e.dataset,
                    dataset_type: e.dataset_type,
                    file_path: e.file_path || '/'
                })
                id++
            }
            setTableData(list)
            getGlobusCollections().then(() => {

                setIsLoading(false)
            })
        } else {
            setIsLoading(false)
            setError(<span>Please first select files for transfer from the <a
                href={APP_ROUTES.search + '/files'}>Files</a> search page.</span>)
        }

        setTimeout(()=>{
            tokenExpired()
        }, (1000 * 60 * 60)) // logout the user after 1 hour since the token would now be expired

    }, [])

    return (
        <FileTransfersContext.Provider
            value={{
                isLoading, setIsLoading, transferFiles,
                globusCollections, setGlobusCollections,
                globusRunURLs,
                error, setError,
                tableData, setTableData
            }}
        >
            {children}
        </FileTransfersContext.Provider>
    )
}

export default FileTransfersContext