import dynamic from "next/dynamic";
import React, {useContext, useState} from 'react'
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import AppContext from "../../context/AppContext";
import {APP_TITLE} from "@/config/config";
import {toast} from "react-toastify";
import Grid from "@mui/material/Grid"
import AdminContext, {AdminProvider} from "../../context/AdminContext";

const AppFooter = dynamic(() => import("../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))
const SpinnerEl = dynamic(() => import( "../../components/custom/Spinner"))
const Unauthorized = dynamic(() => import("../../components/custom/layout/Unauthorized"))


function AdminIndex() {
    const {_t, authorized} = useContext(AppContext)

    const [busy, setBusy] = useState(false)
    const {uiAdminAuthorized} = useContext(AdminContext)

    const clearCache = async () => {
        const url = '/api/ontology'
        try {
            setBusy(true)
            await toast.promise(
                fetch(url, {method: 'DELETE'}),
                {
                    pending: 'Attempting to clear cache...',
                    success: 'Cache cleared 👌',
                    error: 'Something went wrong with clearing the cache. 🤯'
                }
            )
        } catch (error) {
            console.error(`ONTOLOGY: cache could not be cleared`)
        }
        setBusy(false)
    }

    if (!authorized || uiAdminAuthorized.loading) {
        return <Spinner/>
    }

    if (!uiAdminAuthorized.authorized) {
        return <Unauthorized/>
    }

    const goToLink = (item) => window.location = item.btn.href

    const adminItems = [
        {
            title: 'Clear Cache',
            desc: 'Quickly refresh ontology cache.',
            btn: {
                text: 'Clear Cache',
                handler: clearCache
            },
            img: 'static/clear-cache.jpg'
        },
        {
            title: 'Jobs',
            desc: 'View user related jobs',
            btn: {
                text: 'View Jobs Dashboard',
                handler: goToLink,
                href: '/admin/jobs'
            },
            img: 'static/jobs.jpg'
        }
    ]

    const getCards = () => {
        let results = []
        for (let item of adminItems) {
            results.push(
                <Grid item size={4} key={item.title}>
                    <Card className={'px-2 py-2 tooly'} style={{width: '18rem'}}>
                        <Card.Img variant="top" src={item.img}/>
                        <Card.Body className={'mt-2 mb-2'}>
                            <Card.Title>{item.title}</Card.Title>
                            <Card.Text>
                                {item.desc}
                            </Card.Text>
                            <Row>
                                <Col sm={10}><Button variant="primary"
                                                     onClick={() => item.btn.handler(item)}>{item.btn.text}</Button></Col>
                                <Col sm={2}>{busy && <SpinnerEl/>}</Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Grid>
            )
        }
        return results
    }

    return (
        <div>
            <Header title={APP_TITLE}/>
            <AppNavbar hidden={false}/>
            <Container>
                <Row md={12} className={'mt-3 mb-3'}>
                    <h4>{_t(`Administrative`)}</h4>
                </Row>

                <Row>
                    <Grid container spacing={2}>
                        {getCards()}
                    </Grid>
                </Row>
            </Container>
            <AppFooter/>
        </div>
    )
}

export default AdminIndex


AdminIndex.withWrapper = function (page) {
    return <AdminProvider>{page}</AdminProvider>
}
