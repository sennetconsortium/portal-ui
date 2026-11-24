import {useRouter} from 'next/router'
import {Container, Nav, Navbar} from 'react-bootstrap'
import {getDataIngestBoardEndpoint, NAVBAR_TITLE} from '@/config/config'
import {APP_ROUTES, SWAL_DEL_CONFIG} from '@/config/constants'
import React, {useContext, useEffect, useState} from 'react'
import AppContext from '../../../context/AppContext'
import {eq} from "../js/functions";
import {getCookie} from "cookies-next";
import Swal from 'sweetalert2'
import {Alert} from "@mui/material";
import Box from "@mui/material/Box";
import NavbarDrawer from "@/components/custom/layout/NavbarDrawer";
import {toast} from "react-toastify";
import log from "xac-loglevel";

const AppNavbar = ({hidden, signoutHidden, innerRef}) => {
    const {
        _t,
        isLoggedIn,
        logout,
        cache,
        supportedMetadata,
        adminGroup,
        tutorialTrigger,
        deleteTutorialCookies
    } = useContext(AppContext)
    const [dataDrawerOpen, setDataDrawerOpen] = useState(false)
    const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false)
    const [documentationDrawerOpen, setDocumentationDrawerOpen] = useState(false)
    const [registatrationDrawerOpen, setRegistatrationDrawerOpen] = useState(false)
    const [userDrawerOpen, setUserDrawerOpen] = useState(false)
    const userEmail = (isLoggedIn() ? JSON.parse(atob(getCookie('info')))['email'] : "")
    const tutorialCookieKey = 'tutorialCompleted_'
    const router = useRouter()

    useEffect(() => {
    }, [tutorialTrigger])

    const handleSession = () => {
        let url = APP_ROUTES.login
        if (isLoggedIn()) {
            logout()
            url = APP_ROUTES.logout //getLogoutURL()
        }
        window.location.replace(url)
    }

    const clearBrowsing = () => {
        SWAL_DEL_CONFIG.confirmButtonText = 'Clear'
        SWAL_DEL_CONFIG.html = '<span class="fs-6">This will clear cookies and local storage data for this website only. If you are experiencing issues or inconsistencies while searching on the Portal, this may help resolve the problem.</span>'
        Swal.fire(SWAL_DEL_CONFIG).then(result => {
            if (result.isConfirmed) {
                localStorage.clear()
                window.location.reload()
            }
        }).catch(error => {
            log.error(error)
        })

    }

    const copyToken = () => {
        const token = getCookie('groups_token')
        navigator.clipboard.writeText(token)
        toast.info(
            `Token copied!`,
            {
                position: 'top-right',
            }
        )

    }

    const supportedSingleRegister = () => {
        let entities = Object.keys(cache?.entities || {})
        let notSupported = ['upload', 'organ', 'dataset']
        return entities.filter(entity => !notSupported.includes(entity))
    }

    const adminSupportedSingleRegister = () => {
        let entities = Object.keys(cache?.entities || {})
        let adminOnly = []
        return entities.filter(entity => adminOnly.includes(entity))
    }

    const supportedBulkRegister = () => {
        let entities = Object.keys(cache?.entities || {})
        let notSupported = ['publication', 'organ', 'collection', 'epicollection', 'dataset']
        entities = entities.filter(entity => !notSupported.includes(entity))

        const elem = entities.shift()
        // Insert upload before dataset
        entities.splice(3, 0, elem)
        return entities
    }

    const formatRegisterUrl = (entity, range) => {
        if (eq(entity, 'upload') || eq(range, 'single')) {
            return `/edit/${entity}?uuid=register`
        } else {
            return `/edit/bulk/register?entityType=${entity}`
        }
    }

    const getShowTutorialLink = () => {
        return eq(getCookie(`${tutorialCookieKey}app_${isLoggedIn()}`), 'true')
    }

    return (
        <>
            <Box sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1050,
            }}
            >
                <Alert severity={'info'}
                       sx={{
                           borderRadius: 0,
                           py: 0,
                           display: 'flex',
                           justifyContent: 'center',
                       }}>
                    This repository is under review for potential modification in compliance with Administration
                    directives.
                </Alert>
                <Navbar
                    id='basic-navbar-nav'
                    ref={innerRef}
                    variant={'dark'}
                    expand="lg"
                    className={`bg--navBarGrey`}
                >
                    <Container fluid={true}>
                        <Navbar.Brand href={APP_ROUTES.home}>
                            <img
                                alt={_t("SenNet logo")}
                                src={'/static/sennet-logo.png'}
                                width="30"
                                height="30"
                                className="d-inline-block align-top"
                            />{' '}
                            {NAVBAR_TITLE}
                        </Navbar.Brand>

                        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                        <Navbar.Collapse>
                            <Nav className={'me-auto'}>
                                <Nav.Link key={`dd-sennet-home`}
                                          href='https://sennetconsortium.org'>
                                    <span>{_t('SenNet Home')}</span>
                                </Nav.Link>
                                <Nav.Link
                                    onClick={() =>
                                        setDataDrawerOpen(true)
                                    }
                                >
                                    Data
                                </Nav.Link>
                                <Nav.Link
                                    onClick={() =>
                                        setResourceDrawerOpen(true)
                                    }
                                >
                                    Resources
                                </Nav.Link>

                                <Nav.Link
                                    onClick={() =>
                                        setDocumentationDrawerOpen(true)
                                    }
                                >
                                    Documentation
                                </Nav.Link>
                            </Nav>
                            <Nav>
                                {cache && (
                                    <Nav.Link
                                        hidden={hidden || !isLoggedIn()}
                                        onClick={() =>
                                            setRegistatrationDrawerOpen(true)
                                        }
                                        style={{cursor: 'pointer'}}
                                    >
                                        Register Entity
                                    </Nav.Link>
                                )}
                                <Nav.Link hidden={hidden || !isLoggedIn()} key={`submenuItem-md-all`}
                                          href={`/edit/bulk/metadata`}
                                          id={'nav-dropdown--upload-metadata'}
                                          className={'is-subItem'}>
                                    <span>Upload metadata</span>
                                </Nav.Link>


                                {isLoggedIn() ?
                                    (
                                        <Nav.Link
                                            onClick={() =>
                                                setUserDrawerOpen(true)
                                            }
                                        >
                                            <i className={`bi bi-person-circle`}></i>
                                        </Nav.Link>
                                    ) : (
                                        <Nav.Link
                                            className={'justify-content-end'}
                                            hidden={signoutHidden}
                                            href='#'
                                            onClick={(e) => handleSession(e)}
                                        >{_t('Log in')}
                                        </Nav.Link>
                                    )
                                }
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </Box>

            {/*Data drawer*/}
            <NavbarDrawer
                open={dataDrawerOpen}
                onClose={() =>
                    setDataDrawerOpen(false)
                }
                anchor="left"
                title="Data"
                sections={[
                    {
                        title: 'Search',
                        items: [
                            {
                                label: 'Entities',
                                href: `${APP_ROUTES.search}`
                            },
                            {
                                label: 'Files',
                                href: `${APP_ROUTES.search}/files`
                            }
                        ]
                    },
                    {
                        title: 'Discover',
                        items: [
                            {
                                label: 'Cell Types',
                                href: `${APP_ROUTES.discover}/cell-types`
                            },
                            {
                                label: 'Metadata',
                                href: `${APP_ROUTES.discover}/metadata`
                            }
                        ]
                    }
                ]}
            />

            {/*Resources drawer*/}
            <NavbarDrawer
                open={resourceDrawerOpen}
                onClose={() =>
                    setResourceDrawerOpen(false)
                }
                anchor="left"
                title="Resources"
                sections={[
                    {
                        title: '',
                        items: [
                            {
                                label:
                                    'Exploration User Interface (EUI)',
                                href: '/ccf-eui'
                            },

                            ...(isLoggedIn()
                                ? [
                                    {
                                        label:
                                            'Data Ingest Board',
                                        href:
                                            getDataIngestBoardEndpoint()
                                    }
                                ]
                                : []),

                            {
                                label: 'Organs',
                                href: APP_ROUTES.organs
                            },

                            {
                                label: 'Integrated Maps',
                                href:
                                    '/discover/integrated-maps'
                            }
                        ]
                    }
                ]}
            />

            {/*Documentation drawer*/}
            <NavbarDrawer
                open={documentationDrawerOpen}
                onClose={() =>
                    setDocumentationDrawerOpen(false)
                }
                anchor="left"
                title="Documentation"
                sections={[
                    {
                        title: '',
                        items: [
                            {
                                label: 'Getting Started',
                                href: 'https://docs.sennetconsortium.org/libraries/ingest-validation-tools/upload-guidelines/getting-started/'
                            },
                            {
                                label: 'Entity Registration & Metadata Schemas',
                                href: 'https://docs.sennetconsortium.org/registration/'
                            },
                            {
                                label: 'Provenance Graph',
                                href: 'https://docs.sennetconsortium.org/provenance/'
                            },
                            {
                                label: 'APIs',
                                href: 'https://docs.sennetconsortium.org/apis/'
                            }
                        ]
                    }
                ]}
            />

            {/*Registration drawer*/}
            <NavbarDrawer
                open={registatrationDrawerOpen}
                onClose={() =>
                    setRegistatrationDrawerOpen(false)
                }
                anchor="right"
                title="Register Entity"
                sections={[
                    {
                        title: 'Single',
                        items: [
                            ...supportedSingleRegister().map(
                                entity => ({
                                    label:
                                        entity ===
                                        cache.entities.upload
                                            ? 'Data Upload'
                                            : _t(entity),

                                    href: formatRegisterUrl(
                                        entity,
                                        'single'
                                    )
                                })
                            ),

                            ...(adminGroup
                                ? adminSupportedSingleRegister().map(
                                    entity => ({
                                        label: _t(entity),

                                        href: formatRegisterUrl(
                                            entity,
                                            'single'
                                        )
                                    })
                                )
                                : [])
                        ]
                    },

                    {
                        title: 'Bulk',
                        items:
                            supportedBulkRegister().map(
                                entity => ({
                                    label:
                                        entity ===
                                        'upload'
                                            ? 'Data (IDs and Data Files)'
                                            : entity ===
                                            'dataset'
                                                ? 'Data (IDs Only)'
                                                : `${entity}s`,

                                    href: formatRegisterUrl(
                                        entity,
                                        'bulk'
                                    )
                                })
                            )
                    }
                ]}
            />

            {/*User drawer*/}
            <NavbarDrawer
                open={userDrawerOpen}
                onClose={() =>
                    setUserDrawerOpen(false)
                }
                anchor="right"
                title={userEmail}
                sections={[
                    {
                        title: 'Account',
                        items: () => [
                            ...(router.pathname.includes('/search') &&
                            getShowTutorialLink()
                                ? [{
                                    label: 'Show Tutorial',
                                    onClick: deleteTutorialCookies
                                }]
                                : []),

                            {
                                label: 'Job Dashboard',
                                href: '/user/jobs'
                            },

                            {
                                label:
                                    'Clear Browsing Data',
                                onClick: clearBrowsing
                            },

                            {
                                label:
                                    'Copy Globus Token',
                                onClick: copyToken
                            },

                            {
                                label: 'Log out',
                                onClick: handleSession
                            }
                        ]
                    }
                ]}
            />
        </>
    )
}

export default AppNavbar
