import {createContext, useContext, useEffect, useState} from "react";
import AppContext from "./AppContext";

const ChartContext = createContext()

export const ChartProvider = ({ children }) => {

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)

   
    return (
        <ChartContext.Provider
            value={{
                uiAdminAuthorized
            }}
        >
        {children}
    </ChartContext.Provider>
    )
}

export default ChartContext