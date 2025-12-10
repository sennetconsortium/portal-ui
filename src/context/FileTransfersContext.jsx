import {createContext, useContext, useEffect, useState, useRef} from "react";
import AppContext from "@/context/AppContext";
import { getTransferAuthJsonHeaders, parseJson } from "@/lib/services";
import { getIngestEndPoint } from "@/config/config";
import {APP_ROUTES} from "@/config/constants";

const FileTransfersContext = createContext()

export const FileTransfersProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(null)
    const [error, setError] = useState(null)

    const [globusCollections, setGlobusCollections] = useState(null)

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)
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
        if (!response.ok) {
            setError(await response.json())
        }
        setIsLoading(false)
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
            getGlobusCollections().then(()=> {
                setIsLoading(false)
            })
        } else {
            setIsLoading(false)
            setError(<span>Please first select files for transfer from the <a href={APP_ROUTES.search + '/files'}>Files</a> search page.</span>)
        }
        
        
      }, [])

    return (
        <FileTransfersContext.Provider
            value={{
              isLoading, setIsLoading, transferFiles,
              globusCollections, setGlobusCollections,
              error, setError,
              tableData,
            }}
        >
        {children}
    </FileTransfersContext.Provider>
    )
}

export default FileTransfersContext