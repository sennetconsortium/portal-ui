import Header from "@/components/custom/layout/Header";
import React from "react";

export default function Custom500() {
    return (
        <>
            <Header title="Internal Server Error | SenNet"></Header>

            <div className={"container"}>
                <div className={"row align-items-center error-row"}>
                    <div className={"col"}>
                        <h1 className={"text-center"}>500</h1>
                        <h2 className={"text-center"}>Oops! We&#39;ve encountered an internal server error</h2>
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
