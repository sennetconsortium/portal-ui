import React from "react";
import {Col, Container, Row} from 'react-bootstrap'
import {APP_ROUTES} from "@/config/constants";

const InvalidToken = () => {
    return (
        <Container className={'mt-5'}>
            <Row>
                <Col md={{span: 8, offset:2}}>
                    <div className={'alert alert-danger'}>
                        <h1>Invalid Token</h1>
                        <div className='alert-body'>
                            <p>
                                The token you are using is either expired or invalid. Please <a href={APP_ROUTES.logout}
                                                                                                className='lnk--ic'>log
                                out <i className="bi bi-box-arrow-in-left"></i></a> then try to log in again.
                            </p>
                            <p>
                                If you continue to have issues accessing this site, please contact the <a
                                href={"mailto:help@sennetconsortium.org"} className='lnk--ic'>SenNet Help Desk<i
                                className="bi bi-envelope-fill"></i></a>.
                            </p>
                        </div>
                        <div className="alert-btn mt-4 mb-3">
                            <a className="btn btn-primary col-4 p-2" href={APP_ROUTES.logout}>
                                Log out
                            </a>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}

export default InvalidToken