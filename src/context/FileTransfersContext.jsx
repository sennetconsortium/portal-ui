import {createContext, useContext, useEffect, useState, useRef} from "react";
import AppContext from "@/context/AppContext";
import { getTransferAuthJsonHeaders } from "@/lib/services";
import { getIngestEndPoint } from "@/config/config";

const FileTransfersContext = createContext()

export const FileTransfersProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(null)
    const [error, setError] = useState(null)

    const [globusCollections, setGlobusCollections] = useState(null)

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)
    const tableData = useRef([])

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
            manifest: tableData.current
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
        tableData.current = sessionStorage.getItem('transferFiles')
        getGlobusCollections().then(()=> {
            setIsLoading(false)
        })
      }, [])

    return (
        <FileTransfersContext.Provider
            value={{
              isLoading, setIsLoading, transferFiles,
              globusCollections, setGlobusCollections,
              error, setError
 
            }}
        >
        {children}
    </FileTransfersContext.Provider>
    )
}

export default FileTransfersContext