import {createContext, useContext, useEffect, useState} from "react";
import {APP_ROUTES} from "@/config/constants";
import AppContext from "./AppContext";
import {get_auth_header} from "@/lib/services";
import {getIngestEndPoint} from "@/config/config";

const AdminContext = createContext()

export const AdminProvider = ({ children }) => {

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)

    const [uiAdminAuthorized, setUIAdminAuthorized] = useState({
        authorized: false,
        loading: true,
    })

    const checkUIAdminStatus = async () => {
        try {
            const headers = get_auth_header()
            let res  = await fetch(`${getIngestEndPoint()}privs/has-data-admin`, {method:'GET', headers})
            let data = res.ok ? await res.json() : {has_data_admin_privs: false}
            return data.has_data_admin_privs
        } catch {
            return false
        }
    }

    useEffect(() => {
        if (isUnauthorized()) {
            router.push(APP_ROUTES.login)
            return
        }
    }, [authorized])

    useEffect(() => {
        checkUIAdminStatus()
            .then((adminUnauthorized) => {
                setUIAdminAuthorized({
                    authorized: adminUnauthorized,
                    loading: false,
                })
            })
    }, [])

    return (
        <AdminContext.Provider
            value={{
                uiAdminAuthorized
            }}
        >
        {children}
    </AdminContext.Provider>
    )
}

export default AdminContext