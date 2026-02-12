import React, {useContext, useEffect} from 'react'
import Image from 'next/image'
import PropTypes from 'prop-types'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import AppContext from "@/context/AppContext";
import dynamic from "next/dynamic";
import {Button, Card, Col, Container, Row} from 'react-bootstrap';
import AppFooter from "@/components/custom/layout/AppFooter";
import LnkIc from "@/components/custom/layout/LnkIc";
import {goIntent, goToSearch} from "@/components/custom/js/functions";
import SenNetStats from "@/components/SenNetStats";
import Sankey from "@/components/custom/Sankey";
import SenNetBanner from "@/components/SenNetBanner";

const Header = dynamic(() => import("@/components/custom/layout/Header"))

function ViewHome({children}) {

    const {isRegisterHidden, deleteTutorialCookies, cache} = useContext(AppContext)

    useEffect(() => {
        setTimeout(() => {
            $('.highlighted').addClass('is-paused')
        }, 5000)
    }, [])

    const SiteMapCard = ({title, body, children, onClick, hover}) => {
        return (
            <>
                <Card className={`mt-4 p-3 ${hover ? 'card-hover smcHolder--hasHover' : ''}`} onClick={onClick}>
                    <Card.Title>{title}</Card.Title>
                    <Card.Body>
                        {body}
                    </Card.Body>
                    {children}
                </Card>
            </>
        )
    }

    return (
        <>
            <Header title={`Homepage | SenNet`}></Header>
            <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>
            <div role='main' className='sui-layout snLanding'>
                <div className='sui-layout-body'>
                    <SenNetBanner name={'homepage'}/>

                    <section aria-label='About SenNet' className='sui-layout-body__inner'>
                        <Card className='mt-4 p-3'>
                            <Card.Title><h1>The Cellular Senescence Network (SenNet) Data Portal</h1></Card.Title>
                            <Card.Body>
                                <p>The Cellular Senescence Network (SenNet) Program, supported by the NIH Common Fund,
                                    was
                                    established to comprehensively identify and characterize the differences in
                                    senescent
                                    cells across the body, across various states of human health, and across the
                                    lifespan.
                                    SenNet is providing publicly accessible atlases of senescent cells, the differences
                                    among them, and the molecules they secrete, using data collected from multiple human
                                    and
                                    model organism tissues. To identify and characterize these rare cells, SenNet is
                                    developing innovative tools and technologies that build upon previous advances in
                                    single
                                    cell analysis, such as those from the Common Fund’s Human Biomolecular Atlas
                                    Program.
                                    Lastly, SenNet is uniting cellular senescence researchers by developing common terms
                                    and
                                    classifications for senescent cells.</p>
                            </Card.Body>
                        </Card>
                    </section>

                    <section aria-label={'Search By Cell Types'} className='sui-layout-body__inner'>
                        <Card className='mt-4 highlighted'>
                            <div className='p-3 card-content bg-white'>
                                <Card.Title><div className='d-flex d-flex-row justify-space-between'>
                                 <img src='/static/cell-type.svg' width='50' alt /> &nbsp;<h2>Search By Cell Types</h2>
                            </div>
                            
                            </Card.Title>
                            <Card.Body>
                                <p> Explore annotated cell types across SenNet datasets, with insights into their anatomical distribution and associated biomarkers. 
                                    Visualize and compare cell type distribution across organs using interactive plots, and find datasets relevant to the cell type..
                                </p>
                                    <Row className="smcHolder__footer w-lg-50">
                                        <Col>
                                            <Button variant="outline-primary fs-7" className={'w-100'}
                                                href={'/discover/cell-types'}>Overview</Button></Col>
                                        <Col>
                                            <Button variant="outline-primary fs-7" className={'w-100'}
                                                href={'/search/cell-types'}>Search Cell Types</Button></Col>
                                    </Row>
                                
                            </Card.Body>
                            </div>
                        </Card>
                    </section>

                    <section aria-label='Site Map' className='sui-layout-body__inner'>
                        <Container fluid>
                            <Row className={'smcFlex'}>
                                <Col lg={3} className='smcHolder smcHolder--left smcHolder--hasSib smcHolder--w-sm-50'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Discover</h4>
                                        <i className="icon-inline bi bi-binoculars" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 body={<p>Investigate SenNet data by entity type or through its metadata
                                                     library.</p>}>
                                        <Row className="smcHolder__footer text-center mb-xl-2">
                                            <Col><Button variant="outline-primary fs-7" className={'w-100'}
                                                         href={'/search'}>Search Data</Button>
                                            </Col>
                                        </Row>
                                        <Row className="smcHolder__footer text-center">
                                            <Col>
                                                <Button variant="outline-primary fs-7" className={'w-100'}
                                                        href={'/discover/metadata'}>Discover Metadata</Button></Col>
                                            <Col>
                                                <Button variant="outline-primary fs-7" className={'w-100'}
                                                        href={'/search/files'}>Search Files</Button></Col>
                                        </Row>
                                    </SiteMapCard>
                                </Col>

                                <Col lg={3} className='smcHolder smcHolder--innerLeft smcHolder--w-sm-50'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Quick Start</h4>
                                        <i className="icon-inline bi bi-stopwatch" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 body={<p>Learn how to navigate the SenNet Consortium data portal with
                                                     this
                                                     step-by-step guide.</p>}>
                                        <div className='text-sm-center'>
                                            <Button variant="outline-primary" className={'w-50 w-75-sm fs-7'}
                                                    onClick={() => {
                                                        deleteTutorialCookies()
                                                        goIntent('/search?tutorial=1')
                                                    }}>Guide Me</Button>
                                        </div>
                                    </SiteMapCard>
                                </Col>

                                <Col lg={3} className='smcHolder smcHolder--innerRight smcHolder--w-sm-50'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>SenNet Consortium News</h4>
                                        <i className="icon-inline bi bi-newspaper" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 body={<p>Stay up to date on the latest news regarding SenNet.</p>}>
                                        <div className={'text-center'}>
                                            <Button variant="primary" className={'w-75 fs-7 mx-auto'}
                                                    href={'https://sennetconsortium.org/sennet-sentinel/'}>Visit</Button>
                                        </div>
                                    </SiteMapCard>
                                </Col>

                                <Col lg={3} className='smcHolder smcHolder--right smcHolder--hasSib smcHolder--w-sm-50'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Members</h4>
                                        <i className="icon-inline bi bi-people" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 body={<p>Explore resources available to SenNet members.</p>}>
                                        <div className={'text-center'}>
                                            <Button variant="primary" className={'w-75 fs-7 mx-auto'}
                                                    href={'https://sennetconsortium.org/members/'}>Members
                                                Portal</Button>
                                        </div>
                                    </SiteMapCard>
                                </Col>
                            </Row>
                        </Container>
                    </section>

                    <section aria-label='Data Sankey' className='sui-layout-body__inner'>
                        <Sankey maxHeight={600} showExpandButton={true}/>
                    </section>

                    <SenNetStats/>

                    <section aria-label={'Data Use Guidelines'} className='sui-layout-body__inner'>
                        <Card className='mt-4 p-3'>
                            <Card.Title><h2>Data Use Guidelines</h2></Card.Title>
                            <Card.Body>
                                <p> The SenNet Consortium has established comprehensive data use guidelines to ensure
                                    ethical, effective, and <LnkIc href={'https://www.go-fair.org/fair-principles/'}
                                                                   title='FAIR'/> utilization of its data by both
                                    internal
                                    members and external researchers. For more information, read our <LnkIc
                                        title={'Data Use Policy'}
                                        href={'https://sennetconsortium.org/external-data-use/'}/>.
                                </p>
                            </Card.Body>
                        </Card>
                    </section>

                    <section aria-label='Additional Site Areas' className='sui-layout-body__inner'>
                        <Container fluid>
                            <Row className='smcFlex'>
                                <Col lg={3} className='smcHolder smcHolder--left'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Search Data</h4>
                                        <i className="icon-inline bi bi-binoculars" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 hover={true}
                                                 body={<p>Refine your results with faceted search that support flexible
                                                     query refinement.</p>}
                                                 onClick={() => goToSearch()}/>
                                </Col>
                                <Col lg={3} className='smcHolder'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Explore Organs</h4>
                                        <Image className="icon-inline"
                                               src="https://cdn.humanatlas.io/hra-design-system/icons/tools/icon-vccf.svg"
                                               width='50'
                                               height='50'
                                               alt={'Organs'}/>
                                    </div>}
                                                 hover={true}
                                                 body={<p>Tour senescent cell biomarkers organized by organ type.</p>}
                                                 onClick={() => goIntent('organs')}/>
                                </Col>
                                <Col lg={3} className='smcHolder'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Exploration User Interface</h4>
                                        <Image className="icon-inline"
                                               src="https://cdn.humanatlas.io/hra-design-system/icons/tools/icon-eui.svg"
                                               width='50'
                                               height='50'
                                               alt={'Organs'}/>
                                    </div>}
                                                 hover={true}
                                                 body={<p>Run visual searches of SenNet data by organ, donor, biomarker,
                                                     or
                                                     cell type.</p>}
                                                 onClick={() => goIntent('/ccf-eui')}/>
                                </Col>
                                <Col lg={3} className='smcHolder smcHolder--right'>
                                    <SiteMapCard title={<div className={"d-flex d-flex-row justify-content-between"}>
                                        <h4>Take a Deeper Dive</h4>
                                        <i className="icon-inline bi bi-book" style={{fontSize: '2.1em'}}/>
                                    </div>}
                                                 body={<p>Read on to learn more about&nbsp;
                                                     <LnkIc title='entity registration'
                                                            href={'https://docs.sennetconsortium.org/registration'}/>,
                                                     <LnkIc title='APIs'
                                                            href={'https://docs.sennetconsortium.org/apis'}/>,&nbsp;
                                                     <LnkIc title='libraries'
                                                            href={'https://docs.sennetconsortium.org/libraries'}/>,&nbsp;
                                                     <LnkIc title='tools'
                                                            href={'https://docs.sennetconsortium.org/libraries/ingest-validation-tools/'}/>,
                                                     and a&nbsp;
                                                     <LnkIc title='data submission guide'
                                                            href={'https://docs.sennetconsortium.org/data-submission'}/>.
                                                 </p>}>
                                    </SiteMapCard>
                                </Col>
                            </Row>
                        </Container>
                    </section>

                    {/*// End main */}
                </div>
            </div>
            <AppFooter/>
        </>
    )
}

ViewHome.propTypes = {
    children: PropTypes.node
}

export default ViewHome