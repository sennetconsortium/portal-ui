import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import AppContext from "@/context/AppContext";
import dynamic from "next/dynamic";
import {Card, Container, Row, Col, Button} from 'react-bootstrap';
import AppFooter from "@/components/custom/layout/AppFooter";
import LnkIc from "@/components/custom/layout/LnkIc";
import {goIntent, goToSearch} from "@/components/custom/js/functions";
import SenNetStats from "@/components/SenNetStats";
import Sankey from "@/components/custom/Sankey";

const Header = dynamic(() => import("@/components/custom/layout/Header"))

function ViewLanding({children}) {

    const {isRegisterHidden, deleteTutorialCookies, cache} = useContext(AppContext)

    useEffect(() => {
    }, [])

    const SiteMapCard = ({title, body, children, onClick}) => {
        return (
            <>
                <Card className='mt-4 p-3' onClick={onClick}>
                    <Card.Title>{title}</Card.Title>
                    <Card.Body>
                        {body}
                        {children}
                    </Card.Body>
                </Card>
            </>
        )
    }

    return (
       <>
           <Header title={`Homepage | SenNet`}></Header>
           <AppNavbar hidden={isRegisterHidden} signoutHidden={false}/>
           <div role='main' className='sui-layout snLanding'>
               <section aria-label='About SenNet' className='sui-layout-body__inner'>
                   <Card className='mt-4 p-3'>
                       <Card.Title><h1>The Cellular Senescence Network (SenNet) Data Portal</h1></Card.Title>
                       <Card.Body>
                           <p>The Cellular Senescence Network (SenNet) Program, supported by the NIH Common Fund, was established to comprehensively identify and characterize the differences in senescent cells across the body, across various states of human health, and across the lifespan. SenNet is providing publicly accessible atlases of senescent cells, the differences among them, and the molecules they secrete, using data collected from multiple human and model organism tissues. To identify and characterize these rare cells, SenNet is developing innovative tools and technologies that build upon previous advances in single cell analysis, such as those from the Common Fund’s Human Biomolecular Atlas Program. Lastly, SenNet is uniting cellular senescence researchers by developing common terms and classifications for senescent cells.</p>
                       </Card.Body>
                   </Card>
               </section>

               <section aria-label='Site Map' className='sui-layout-body__inner'>
                   <Container fluid>
                       <Row className={'smcFlex'}>
                           <Col lg={3} className='smcHolder smcHolder--left smcHolder--hasSib smcHolder--w-md-50'>
                               <SiteMapCard title={<h4>Discover</h4>}
                                            body={<p>Investigate SenNet data by entity type or through its metadata library.</p>}>
                                   <Row className="justify-content-md-center text-center">
                                       <Col lg={6}><Button variant="outline-primary" className={'w-100'} href={'/search'}>Search Data</Button>
                                          </Col>
                                       <Col lg={6} className={'mt-2-sm'}>
                                           <Button variant="outline-primary" className={'w-100'} href={'/discover/metadata'}>Discover Metadata</Button></Col>
                                   </Row>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder smcHolder--innerLeft smcHolder--w-md-50'>
                               <SiteMapCard title={<h4>Quick Start</h4>}
                                            body={<p>Learn how to navigate the SenNet Consortium data portal with this step-by-step guide.</p>}>
                                   <div className='text-sm-center'>
                                       <Button variant="primary" className={'w-50 w-75-sm'} onClick={() => {
                                           deleteTutorialCookies()
                                           goIntent('/search?tutorial=1')
                                       }}>Guide Me</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder smcHolder--innerRight smcHolder--w-md-50'>
                               <SiteMapCard title={<h4>SenNet Consortium</h4>}
                                            body={<p>Stay up to date on the latest news regarding the SenNet project.</p>}>
                                   <div className={'text-center'}>
                                       <Button variant="outline-primary" className={'w-75 mx-auto'} href={'https://sennetconsortium.org/'}>Visit</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder smcHolder--right smcHolder--hasSib smcHolder--w-md-50'>
                               <SiteMapCard title={<h4>Members</h4>}
                                            body={<p>Explore resources available to SenNet members. <br/> <br/></p>}>
                                   <div className={'text-center'}>
                                       <Button variant="primary" className={'w-75 mx-auto'} href={'https://sennetconsortium.org/members/'}>Members Portal</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>
                       </Row>
                   </Container>
               </section>

               <section aria-label='Data Sankey' className='sui-layout-body__inner'>
                   <Sankey />
               </section>

               <SenNetStats />

               <section aria-label={'Data Use Guidelines'} className='sui-layout-body__inner'>
                   <Card className='mt-4 p-3'>
                       <Card.Title><h2>Data Use Guidelines</h2></Card.Title>
                       <Card.Body>
                           <p> The SenNet Consortium has established comprehensive data use guidelines to ensure ethical, effective, and <a href='#'>FAIR</a> utilization of its data by both internal members and external researchers. For more information, read our <LnkIc title={'Data Use Policy'} href={'https://sennetconsortium.org/external-data-use/'} />.
                           </p>
                       </Card.Body>
                   </Card>
               </section>

               <section aria-label='Additional Site Areas' className='sui-layout-body__inner'>
                   <Container fluid>
                       <Row className='smcFlex'>
                           <Col lg={3} className='smcHolder smcHolder--hasHover smcHolder--left'>
                               <SiteMapCard title={<h4>Search Data</h4>}
                                            body={<p>Refine your results with faceted search that support flexible query refinement.</p>}
                                            onClick={() => goToSearch()} />
                           </Col>
                           <Col lg={3} className='smcHolder smcHolder--hasHover'>
                               <SiteMapCard title={<h4>Explore Organs</h4>}
                                            body={<p>Tour senescent cell biomarkers organized by organ type.</p>}
                                            onClick={() => goIntent('organs')} />
                           </Col>
                           <Col lg={3} className='smcHolder smcHolder--hasHover'>
                               <SiteMapCard title={<h4>Exploration User Interface (EUI)</h4>}
                                            body={<p>Run visual searches of SenNet data by organ, donor, biomarker, or cell type.</p>}
                                            onClick={() => goIntent('/ccf-eui') } />
                           </Col>
                           <Col lg={3} className='smcHolder smcHolder--right'>
                               <SiteMapCard title={<h4>Take a deeper dive to</h4>}
                                            body={<p>Read on to learn more about&nbsp;
                                                <LnkIc title='entity registration' href={'https://docs.sennetconsortium.org/registration'} />,
                                                <LnkIc title='APIs' href={'https://docs.sennetconsortium.org/apis'} />,&nbsp;
                                                <LnkIc title='libraries' href={'https://docs.sennetconsortium.org/libraries'} />,&nbsp;
                                                <LnkIc title='tools' href={'https://docs.sennetconsortium.org/libraries/ingest-validation-tools/'} />, and a&nbsp;
                                                <LnkIc title='data submission guide' href={'https://docs.sennetconsortium.org/data-submission'} />.</p>}>
                               </SiteMapCard>
                           </Col>
                       </Row>
                   </Container>
               </section>

           {/*// End main */}
           </div>
           <AppFooter/>
       </>
    )
}

ViewLanding.propTypes = {
    children: PropTypes.node
}

export default ViewLanding