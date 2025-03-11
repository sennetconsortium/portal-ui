import React from 'react'
import dynamic from "next/dynamic";

function NotFound({ includeHeader = true}) {
    const Header = includeHeader ? dynamic(() => import("./layout/Header")) : null
    return (
        <>
        {includeHeader && <Header title="Page Not Found | SenNet"></Header>}

            <div className={"container"}>
                <div className={"row align-items-center error-row"}>
                    <div className={"col"}>
                        <h1 className={"text-center"}>404</h1>
                        <h2 className={"text-center"}>Oops! This page could not be found</h2>
                        <p className={"text-center"}>Sorry but the page you are looking for does not exist, has been removed, or is
                            temporarily unavailable</p>
                        <div className={"row"}>
                            <div className={"col text-center"}>
                                <a className="btn btn-outline-primary" role={"button"} href={"/search"}>Home</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NotFound