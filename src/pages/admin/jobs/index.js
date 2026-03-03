import dynamic from "next/dynamic";
import React, {useContext} from "react";
import AppContext from "@/context/AppContext";
import {JobQueueProvider} from "@/context/JobQueueContext";
import AdminContext, {AdminProvider} from "@/context/AdminContext";

const ViewJobs = dynamic(() => import('../../user/jobs'));
const Spinner = dynamic(() => import('../../../components/custom/Spinner'));
const Unauthorized = dynamic(() => import('../../../components/custom/layout/Unauthorized'));

function ViewJobsAdmin() {
    const {adminGroup, authorized} = useContext(AppContext)
    const {uiAdminAuthorized} = useContext(AdminContext)

    if (!authorized || uiAdminAuthorized.loading) {
        return <Spinner/>
    }

    if (!uiAdminAuthorized.authorized) {
        return <Unauthorized/>
    }

    return (
        <>
            {adminGroup && <ViewJobs isAdmin={adminGroup}/>}
        </>
    )
}


export default ViewJobsAdmin

ViewJobsAdmin.withWrapper = function (page) {
    return <AdminProvider><JobQueueProvider>{page}</JobQueueProvider></AdminProvider>
}