import ViewJobs from "../../user/jobs";
import {useContext} from "react";
import AppContext from "../../../context/AppContext";
import Spinner from "../../../components/custom/Spinner";


function ViewJobsAdmin() {
    const {adminGroup} = useContext(AppContext)

    return (
        <>
            {adminGroup && <ViewJobs isAdmin={adminGroup} />}
            {!adminGroup && <Spinner/>}
        </>
    )
}


export default ViewJobsAdmin