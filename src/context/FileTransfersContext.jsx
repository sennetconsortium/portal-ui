import {createContext, useContext, useEffect, useState} from "react";
import AppContext from "@/context/AppContext";
import { getAuthJsonHeaders, getAuthHeader } from "@/lib/services";
import { getIngestEndPoint } from "@/config/config";

const FileTransfersContext = createContext()

export const FileTransfersProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(null)
    const [formData, setFormData] = useState({})
    const [globusCollections, setGlobusCollections] = useState(null)

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)

    const getTransferEndpointsUrl = () => {
        return `${getIngestEndPoint()}transfers/endpoints`
    }

    const getTransfersUrl = () => {
        return `${getIngestEndPoint()}transfers/`
    }


    async function transferFiles() {
        setIsLoading(true)
        const body = {  }
        const requestOptions = {
        method: 'POST',
        headers: getAuthJsonHeaders(),
        body: JSON.stringify(body)
        }
        response.current = await fetch(getTransfersUrl(), requestOptions)
        const data = await response.current.json()
    }

    useEffect(() => {
    
      }, [])

    return (
        <FileTransfersContext.Provider
            value={{
              isLoading, setIsLoading, transferFiles,
              globusCollections, setGlobusCollections,
              formData, setFormData
            }}
        >
        {children}
    </FileTransfersContext.Provider>
    )
}

export default FileTransfersContext