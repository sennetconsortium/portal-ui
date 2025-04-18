import React, {useContext} from 'react';
import {Row, Col} from 'react-bootstrap'
import AppContext from "../../../context/AppContext";
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const AppFooter = () => {
    const {_t} = useContext(AppContext)

    return (
        <div className={`footer-wrapper sui-layout-body__inner bg--entityWhite border-top`}>
            <ToastContainer />

            <footer className={`py-3`}>
                <Row>
                    <Col sm={2} className='col--placeholder'>
                        <p></p>
                    </Col>
                    <Col sm={10} className='col--main'>
                        <Row>
                            <Col sm={4} className='col--logos'>
                                <ul className="pb-3 mb-3 nav--org" aria-label='Organization name'>
                                    <li className="nav-item">
                                        <a className="navbar-brand" href="https://sennetconsortium.org/">
                                            <img
                                                title='Senescence Network (SenNet)'
                                                className="d-inline-block align-text-top sennet-logo"
                                                src={'/static/sennet-txt-horizontal-logo.png'}
                                                width="150"
                                                alt={_t("SenNet logo")}
                                            />
                                        </a>
                                    </li>
                                </ul>
                            </Col>
                            <Col sm={2}>
                                <ul className="pb-3 mb-3 nav--menu" aria-label='About Menu'>
                                    <li className="nav-item"><span className='nav-item-h'>About</span></li>
                                    <li className="nav-item"><a href="https://sennetconsortium.org/about-2/">Web Portal</a></li>
                                    <li className="nav-item"><a href="https://sennetconsortium.org/involvement/">Funded Research</a></li>
                                    <li className="nav-item"><a href="https://docs.sennetconsortium.org/">Documentation</a></li>
                                    <li className="nav-item"><a href="mailto:help@sennetconsortium.org">Contact</a></li>
                                </ul>
                            </Col>
                            <Col sm={2}>
                                <ul className="pb-3 mb-3 nav--menu" aria-label='Policies Menu'>
                                    <li className="nav-item"><span className='nav-item-h'>Policies</span></li>
                                    <li className="nav-item"><a href="https://sennetconsortium.org/policies/">Overview</a></li>
                                    <li className="nav-item"><a href="https://sennetconsortium.org/external-data-use/">Data Sharing</a></li>
                                </ul>
                            </Col>
                            <Col sm={2}>
                                <ul className="pb-3 mb-3 nav--menu" aria-label='Funding Menu'>
                                    <li className="nav-item"><span className='nav-item-h'>Funding</span></li>
                                    <li className="nav-item"><a className='lnk--ic'
                                                                href="https://commonfund.nih.gov/senescence">NIH Common
                                        Fund <i
                                            className="bi bi-box-arrow-up-right"/></a></li>
                                </ul>
                            </Col>
                        </Row>

                    </Col>
                </Row>
                <Row>
                    <div
                        className={'text-center text-muted nav--copyright'}>Copyright {(new Date().getFullYear())}</div>
                </Row>

            </footer>
        </div>
    );
};

export default AppFooter;