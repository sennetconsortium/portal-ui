import React, {useEffect, useContext, useState} from 'react'
import { Row, Col, Container, Card, Button } from 'react-bootstrap'
import AppNavbar from "../../components/custom/layout/AppNavbar";
import AppFooter from "../../components/custom/layout/AppFooter";
import Header from "../../components/custom/layout/Header";
import AppContext from "../../context/AppContext";
import {APP_TITLE} from "../../config/config";
import {APP_ROUTES} from "../../config/constants";
import Spinner, {SpinnerEl} from "../../components/custom/Spinner";
import {toast} from "react-toastify";
import Unauthorized from '../../components/custom/layout/Unauthorized';
import {Grid} from "@mui/material";

function Login() {
    const { _t, authorized, isUnauthorized, checkUIAdminStatus, router} = useContext(AppContext)

    const [busy, setBusy] = useState(false)
    const [uiAdminAuthorized, setUIAdminAuthorized] = useState({
        authorized: false,
        loading: true,
    })

    useEffect(() => {
        checkUIAdminStatus()
        .then((adminUnauthorized) => {
            setUIAdminAuthorized({
                authorized: adminUnauthorized,
                loading: false,
            })
        })
    }, [])

    useEffect(() => {
        if (isUnauthorized()) {
            router.push(APP_ROUTES.login)
            return
        }
    }, [authorized])

    const clearCache = async () => {
        const url = '/api/ontology'
        try {
            setBusy(true)
            await toast.promise(
                fetch(url, { method: 'DELETE' }),
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
        return <Spinner />
    }

    if (!uiAdminAuthorized.authorized) {
        return <Unauthorized />
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
                <Grid item xs={2} sm={4} md={3} key={item.title}>
                    <Card className={'px-2 py-2 tooly'} style={{width: '18rem'}}>
                        <Card.Img variant="top" src={item.img} />
                        <Card.Body className={'mt-2 mb-2'}>
                            <Card.Title>{item.title}</Card.Title>
                            <Card.Text>
                                {item.desc}
                            </Card.Text>
                            <Row>
                                <Col sm={10}><Button variant="primary" onClick={() => item.btn.handler(item)}>{item.btn.text}</Button></Col>
                                <Col sm={2}>{busy && <SpinnerEl />}</Col>
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
            <AppNavbar hidden={true}/>
            <Container>
                <Row md={12} className={'mt-3 mb-3'}>
                    <h4>{_t(`Administrative`)}</h4>
                </Row>

                <Row>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                        {getCards()}
                    </Grid>
                </Row>
            </Container>
            <AppFooter />
        </div>
    )
}

export default Login
