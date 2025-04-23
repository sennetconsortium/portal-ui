import React, {useEffect, useContext, useState} from 'react'
import {APP_TITLE, getIngestLogin} from '@/config/config'
import { Row, Col, Container } from 'react-bootstrap'
import AppNavbar from './layout/AppNavbar'
import AppFooter from './layout/AppFooter'
import Header from './layout/Header'
import AppContext from "@/context/AppContext";
import { goToSearch } from './js/functions'
import SenNetBanner from "@/components/SenNetBanner";

function Login() {
    const loginUrl = getIngestLogin()
    const { _t, isLoggedIn, banners } = useContext(AppContext)

    useEffect(() => {
        if (isLoggedIn()) {
            goToSearch()
        }
    })

    return (
        <div>
            <Header title={APP_TITLE} />
            <AppNavbar hidden={true} />
            <Container>
                <SenNetBanner />
                <Row className={(banners?.login || banners?.default) ? '' : 'mt-resp'} style={{minHeight: '530px'}}>
                    <Col></Col>
                    <Col xs={10} lg={6}>
                        <div className={`card alert alert-info mt-4`}>
                            <div className="card-body">
                                <h3 className="card-title">{APP_TITLE}</h3>
                                <div className="card-text">
                                    User authentication is required to search
                                    the dataset catalog. Please click the button
                                    below and you will be redirected to a Globus
                                    page to select your institution. After
                                    selecting your institution, you will be
                                    redirected to your institutional login page
                                    to enter your credentials.
                                </div>
                                <hr />
                                <div
                                    className={'d-flex justify-content-center'}
                                >
                                    <a
                                        className="btn btn-outline-success rounded-0 btn-lg js-btn--login"
                                        href={loginUrl}
                                    >
                                        {_t('Log in with your institution credentials')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col></Col>
                </Row>
            </Container>
            <AppFooter  />
        </div>
    )
}

export default Login
