import Header from "@/components/custom/layout/Header";
import React from "react";
import {APP_TITLE} from "@/config/config";

export default function Custom401() {
    return (
        <>
            <Header title={`Unauthorized | ${APP_TITLE}`}></Header>

            <div className={"container"}>
                <div className={"row align-items-center error-row"}>
                    <div className={"col"}>
                        <h1 className={"text-center"}>401</h1>
                        <h2 className={"text-center"}>Your globus token has expired</h2>
                        <p className={"text-center"}>Please logout and login again</p>
                        <div className={"row"}>
                            <div className={"col text-center"}>
                                <a className="btn btn-outline-primary" role={"button"} href={"/logout"}>Logout</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
