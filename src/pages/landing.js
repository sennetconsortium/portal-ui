import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import AppNavbar from "@/components/custom/layout/AppNavbar";
import AppContext from "@/context/AppContext";
import dynamic from "next/dynamic";
import {Card, Container, Row, Col, Button} from 'react-bootstrap';
import AppFooter from "@/components/custom/layout/AppFooter";

const Header = dynamic(() => import("@/components/custom/layout/Header"))

function ViewLanding({children}) {

    const {isRegisterHidden, _t, cache} = useContext(AppContext)

    useEffect(() => {
    }, [])

    const SiteMapCard = ({title, body, children}) => {
        return (
            <>
                <Card className='mt-4 p-3'>
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
           <div role='main' className='sui-layout'>
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
                       <Row>
                           <Col lg={3} className='smcHolder smcHolder--left smcHolder--hasSib'>
                               <SiteMapCard title={<h4>Discover</h4>}
                                            body={<p>Investigate SenNet data by entity type or through its metadata library.</p>}>
                                   <Row className="justify-content-md-center text-center">
                                       <Col lg={6}><Button variant="outline-primary" className={'w-100'}>Search Data</Button>
                                          </Col>
                                       <Col lg={6}>
                                           <Button variant="outline-primary" className={'w-100'}>Discover Metadata</Button></Col>
                                   </Row>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder--innerLeft'>
                               <SiteMapCard title={<h4>Quick Start</h4>}
                                            body={<p>Learn how to navigate the SenNet Consortium data portal with this step-by-step guide.</p>}>
                                   <div>
                                       <Button variant="primary" className={'w-50'}>Guide Me</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder--innerRight'>
                               <SiteMapCard title={<h4>SenNet Consortium</h4>}
                                            body={<p>Stay up to date on the latest news regarding the SenNet project.</p>}>
                                   <div className={'text-center'}>
                                       <Button variant="outline-primary" className={'w-75 mx-auto'} href={'https://sennetconsortium.org/'}>Visit</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>

                           <Col lg={3} className='smcHolder smcHolder--right smcHolder--hasSib'>
                               <SiteMapCard title={<h4>Members</h4>}
                                            body={<p>Explore resources available to SenNet members. <br/> <br/></p>}>
                                   <div className={'text-center'}>
                                       <Button variant="primary" className={'w-75 mx-auto'}>Members Portal</Button>
                                   </div>
                               </SiteMapCard>
                           </Col>
                       </Row>
                   </Container>
               </section>

               <section aria-label={'Data Use Guidelines'} className='sui-layout-body__inner'>
                   <Card className='mt-4 p-3'>
                       <Card.Title><h2>Data Use Guidelines</h2></Card.Title>
                       <Card.Body>
                           <p> The SenNet Consortium has established comprehensive data use guidelines to ensure ethical, effective, and&nbsp;
                               <a href='#'>FAIR</a> utilization of its data by both internal members and external researchers. For more information,
                               read our <a href='#'>Data Use Policy</a>.
                            </p>
                       </Card.Body>
                   </Card>
               </section>

               <section aria-label='Additional Site Areas' className='sui-layout-body__inner'>
                   <Container fluid>
                       <Row>
                           <Col lg={3} className='smcHolder smcHolder--left'>
                               <SiteMapCard title={<h4>Search Data</h4>}
                                            body={<p>Refine your results with faceted search that support flexible query refinement.</p>}>
                               </SiteMapCard>
                           </Col>
                           <Col lg={3} className='smcHolder'>
                               <SiteMapCard title={<h4>Explore Organs</h4>}
                                            body={<p>Tour senescent cell biomarkers organized by organ type.</p>}>
                               </SiteMapCard>
                           </Col>
                           <Col lg={3} className='smcHolder'>
                               <SiteMapCard title={<h4>Exploration User Interface (EUI)</h4>}
                                            body={<p>Run visual searches of SenNet data by organ, donor, biomarker, or cell type.</p>}>
                               </SiteMapCard>
                           </Col>
                           <Col lg={3} className='smcHolder smcHolder--right'>
                               <SiteMapCard title={<h4>Take a deeper dive to</h4>}
                                            body={<p>Read on to learn more about entity registration, APIs, libraries, tools, and a data submission guide.</p>}>
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