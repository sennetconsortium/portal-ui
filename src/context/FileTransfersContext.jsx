import {createContext,  useEffect, useState} from "react";
import {getTransferAuthJsonHeaders, parseJson} from "@/lib/services";
import {getIngestEndPoint} from "@/config/config";
import {APP_ROUTES} from "@/config/constants";

const FileTransfersContext = createContext()

export const FileTransfersProvider = ({children}) => {
    const [isLoading, setIsLoading] = useState(null)
    const [error, setError] = useState(null)

    const [globusCollections, setGlobusCollections] = useState(null)
    const [globusRunURLs, setGlobusRunURLs] = useState(null)


    const [tableData, setTableData] = useState([])

    const getTransferEndpointsUrl = () => {
        return `${getIngestEndPoint()}transfers/endpoints`
    }

    const getTransfersUrl = () => {
        return `${getIngestEndPoint()}transfers`
    }

    async function getGlobusCollections() {
        setIsLoading(true)
        let data
        const requestOptions = {
            method: 'GET',
            headers: getTransferAuthJsonHeaders(),
        }
        const response = await fetch(getTransferEndpointsUrl(), requestOptions)
        if (response.ok) {
            data = await response.json()
            setGlobusCollections(data)
        }
        return data
    }


    async function transferFiles(formData) {
        setIsLoading(true)
        const body = {
            ...formData,
            manifest: tableData
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
            let jsonResponse = await response.json()
            setError(jsonResponse.error)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const _entities = parseJson(sessionStorage.getItem('transferFiles'))
        if (Array.isArray(_entities)) {
            let list = []
            for (let e of _entities) {
                list.push({
                    dataset: e.dataset,
                    dataset_type: e.dataset_type,
                    file_path: e.file_path || '/'
                })
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