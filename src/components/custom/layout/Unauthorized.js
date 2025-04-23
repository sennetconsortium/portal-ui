import React, {useContext} from "react";
import {Col, Container, Row} from 'react-bootstrap'
import {APP_ROUTES} from "../../../config/constants";
import {getCookie} from "cookies-next";
import {getIngestLogin} from "../../../config/config";
import AppContext from "../../../context/AppContext";

const Unauthorized = () => {
    const cookie = getCookie('info')
    const email = cookie ? JSON.parse(atob(cookie))['email'] : null
    const { _t } = useContext(AppContext)
    const pageData = () => {
        let body, btnLink, btnLabel
        if (!email) {
            body = <>
                <p>
                    You are trying to access the Data Portal without being signed in.
                    You must be authorized in order to access this page. Please <a className='lnk--ic'
                                                                                   href={APP_ROUTES.login}>log
                    in <i className="bi bi-box-arrow-in-right"></i></a> then attempt to visit this page again.
                </p>
                <p>
                    If you continue to have issues accessing this site please contact the <a className='lnk--ic'
                                                                                             href={"mailto:help@sennetconsortium.org"}>SenNet Help Desk <i className="bi bi-envelope-fill"></i></a>.
                </p>
            </>
            btnLink = getIngestLogin()
            btnLabel = _t('Log in with your institution credentials')
        } else {
            body = <>
                <p>
                    You are trying to access the Data Portal, logged in as <b>{email}</b>.
                    You are not authorized to log into this portal with that account. Please check that
                    you have registered via the <a className='lnk--ic'
                                                   href={"https://profile.sennetconsortium.org/profile"}>Member
                    Registration Page <i className="bi bi-person"></i></a>, have provided Globus account
                    information and are logging in with that account.
                </p>
                <p>
                    You will receive an email from Globus notifying that you have been invited to join the <b>SenNet -
                    Read</b> group. You must click the link that says "Click here to apply for membership" then click "Accept
                    Invitation" in the browser.
                </p>
                <p>
                    Once you have confirmed your registration information you can <a className='lnk--ic'
                                                                                     href={APP_ROUTES.login}>log
                    in <i className="bi bi-box-arrow-in-right"></i></a> again.
                    Without login you can view the public facing <a href={APP_ROUTES.search}>Data Portal</a>.
                </p>
                <p>
                    If you continue to have issues accessing this site please contact the <a className='lnk--ic'
                                                                                             href={"mailto:help@sennetconsortium.org"}>SenNet Help Desk <i className="bi bi-envelope-fill"></i></a>.
                </p>
            </>
            btnLink = APP_ROUTES.logout
            btnLabel = 'Log out'
        }
        return {
            body,
            btnLink,
            btnLabel
        }
    }
    const details = pageData()
    return (
        <Container className={'mt-5'}>
            <Row>
                <Col md={{span: 8, offset: 2}}>
                    <div className={`alert alert-danger`}>
                        <h1>Unauthorized</h1>
                        <div className='alert-body pb-2'>
                            {details.body}
                        </div>

                        <div className="alert-btn mt-4 mb-3">
                            <a className="btn btn-primary col-4 p-2" href={details.btnLink}>
                                {details.btnLabel}
                            </a>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}

export default Unauthorized