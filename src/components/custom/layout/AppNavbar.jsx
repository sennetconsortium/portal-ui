import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap'
import {getDataIngestBoardEndpoint, NAVBAR_TITLE} from '../../../config/config'
import {APP_ROUTES} from '../../../config/constants'
import {useContext, useEffect} from 'react'
import AppContext from '../../../context/AppContext'
import {eq} from "../js/functions";
import {deleteCookie, getCookie} from "cookies-next";

const AppNavbar = ({hidden, signoutHidden, innerRef}) => {
    const {_t, isLoggedIn, logout, cache, supportedMetadata, adminGroup, tutorialTrigger, setTutorialTrigger} = useContext(AppContext)
    const userEmail = (isLoggedIn() ? JSON.parse(atob(getCookie('info')))['email'] : "")
    const tutorialCookieKey = 'tutorialCompleted_'

    useEffect(() => {
    }, [tutorialTrigger])

    const handleSession = (e) => {
        e.preventDefault()
        let url = APP_ROUTES.login
        if (isLoggedIn()) {
            logout()
            url = APP_ROUTES.logout //getLogoutURL()
        }
        window.location.replace(url)
    }

    const supportedSingleRegister = () => {
        let entities = Object.keys(cache.entities)
        let notSupported = ['upload', 'organ', 'dataset']
        return entities.filter(entity => !notSupported.includes(entity))
    }

    const adminSupportedSingleRegister = () => {
        let entities = Object.keys(cache.entities)
        let adminOnly = []
        return entities.filter(entity => adminOnly.includes(entity))
    }

    const supportedBulkRegister = () => {
        let entities = Object.keys(cache.entities)
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

    const  deleteTutorialCookies = () => {
        deleteCookie(`${tutorialCookieKey}true`)
        deleteCookie(`${tutorialCookieKey}false`)
        setTutorialTrigger(tutorialTrigger+1)
    }

    const getShowTutorialLink = () => {
        const tutorialCompleted = getCookie(`${tutorialCookieKey}${isLoggedIn()}`)
        return tutorialCompleted || false
    }

    return (
        <Navbar
            ref={innerRef}
            variant={'dark'}
            expand="lg"
            className={`sticky-top bg--navBarGrey`}
        >
            <Container fluid={true}>
                <Navbar.Brand href={APP_ROUTES.search}>
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
                        <NavDropdown
                            active={false}
                            variant={'primary'}
                            hidden={hidden || !isLoggedIn()}
                            title={_t("Register entity")}
                            id="nav-dropdown"
                        >
                            {['Single', 'Bulk'].map((range, key) => (
                                <div key={`dropdownItem-register-${range}`} id={`dropdownItem-register-${range}`}>
                                    {key !== 0 && <NavDropdown.Divider/>}
                                    <NavDropdown.Item className='dropdown-item is-heading'
                                                      aria-controls={`submenu-md-${range}`}>
                                        {range}
                                    </NavDropdown.Item>

                                    <div className={'submenu'} id={`submenu-md-${range}`}>
                                        {eq(range, 'single') && supportedSingleRegister().map((entity) => (
                                            <NavDropdown.Item key={entity} href={formatRegisterUrl(entity, range)}>
                                                {eq(entity, cache.entities.upload) ? 'Data Upload' : _t(entity)}
                                            </NavDropdown.Item>
                                        ))}

                                        {eq(range, 'single') && adminGroup && adminSupportedSingleRegister().map((entity) => (
                                            <NavDropdown.Item key={entity} href={formatRegisterUrl(entity, range)}>
                                                {_t(entity)}
                                            </NavDropdown.Item>
                                        ))}

                                        {eq(range, 'bulk') && supportedBulkRegister().map((entity) => (
                                            <NavDropdown.Item key={entity} href={formatRegisterUrl(entity, range)}>
                                                {eq(entity, 'upload') ? 'Data (IDs and Data Files)' : eq(entity, 'dataset') ? 'Data (IDs Only)' : `${entity}s`}
                                            </NavDropdown.Item>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </NavDropdown>

                        <Nav.Link hidden={hidden || !isLoggedIn()} key={`submenuItem-md-all`}
                                  href={`/edit/bulk/metadata`}
                                  id={'nav-dropdown--upload-metadata'}
                                  className={'is-subItem'}>
                            <span>Upload metadata</span>
                        </Nav.Link>

                        <NavDropdown active={false}
                                     variant={'primary'}
                                     title="Documentation"
                                     id="nav-dropdown--docs">
                            <NavDropdown.Item key={`dd-getting-started`}
                                              href='https://docs.sennetconsortium.org/libraries/ingest-validation-tools/upload-guidelines/getting-started/'>
                                <span>Getting started</span>
                            </NavDropdown.Item>
                            <NavDropdown.Item key={`dd-search-md-schema`}
                                              href='https://docs.sennetconsortium.org/libraries/ingest-validation-tools/'>
                                <span>Metadata schemas & upload guidelines</span>
                            </NavDropdown.Item>
                            <NavDropdown.Item key={`dd-prov-ui`}
                                              href='https://docs.sennetconsortium.org/libraries/provenance-ui/'>
                                <span>Provenance UI</span>
                            </NavDropdown.Item>
                            <NavDropdown.Item key={`dd-apis`} href='https://docs.sennetconsortium.org/apis/'>
                                <span>APIs</span>
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Nav>
                        <NavDropdown active={false}
                                     variant={'primary'}
                                     align={{ lg: 'end' }}
                                     title="Atlas & Tools"
                                     id="nav-dropdown--atlas">
                            <NavDropdown.Item key={`dd-ccf-eui`}
                                              href='/ccf-eui'>
                                <span>Exploration User Interface (EUI)</span>
                            </NavDropdown.Item>
                            {isLoggedIn() &&
                                <NavDropdown.Item key={`dd-data-board`}
                                                  href={getDataIngestBoardEndpoint()}
                                                  target='_blank'>
                                    <span>Data Ingest Board</span>
                                </NavDropdown.Item>
                            }
                            <NavDropdown.Item key={`dd-organs`}
                                              href={APP_ROUTES.organs}>
                                <span>Organs</span>
                            </NavDropdown.Item>
                        </NavDropdown>
                        {isLoggedIn() ?
                            (
                                <NavDropdown active={false}
                                             variant={'primary'}
                                             title={userEmail}
                                             id="nav-dropdown--user">
                                    <NavDropdown.Item id={`dd-user-tutorial`} key={`dd-user-tutorial`}
                                                      hidden={!getShowTutorialLink()}
                                                      href='#'
                                                      onClick={(e) => deleteTutorialCookies(e)}>
                                        {_t('Show Tutorial')}
                                    </NavDropdown.Item>
                                    <NavDropdown.Item key={`dd-user-jobs`}
                                                      hidden={signoutHidden}
                                                      href='/user/jobs'>
                                        {_t('Job Dashboard')}
                                    </NavDropdown.Item>
                                    <NavDropdown.Item key={`dd-user-logout`}
                                                      hidden={signoutHidden}
                                                      href='#'
                                                      onClick={(e) => handleSession(e)}>
                                        {_t('Log out')}
                                    </NavDropdown.Item>
                                </NavDropdown>
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
    )
}

export default AppNavbar
