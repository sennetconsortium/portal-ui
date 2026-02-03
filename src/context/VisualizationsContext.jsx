import {createContext, useContext, useEffect, useState} from "react";
import AppContext from "./AppContext";

const VisualizationsContext = createContext()

export const VisualizationsProvider = ({ children }) => {

    const { _t, authorized, isUnauthorized, router} = useContext(AppContext)

   
    return (
        <VisualizationsContext.Provider
            value={{
            }}
        >
        {children}
    </VisualizationsContext.Provider>
    )
}

export default VisualizationsContext