import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap'
import {APP_TITLE, getLogoutURL} from '../../../config/config'
import {APP_ROUTES} from '../../../config/constants'
import {useContext, useEffect, useRef} from 'react'
import styles from '../appNavbar.module.css'
import logo from './sennet-logo.png'
import Image from 'next/image'
import AppContext from '../../../context/AppContext'
import Addon from "../js/addons/Addon";

const AppNavbar = ({hidden, signoutHidden}) => {
    const {_t, isLoggedIn, logout, cache} = useContext(AppContext)
    const hasInit = useRef(false)

    useEffect(()=>{
        if (hasInit.current === false) {
            hasInit.current = true
            Addon.navBar()
        }
    })

    const handleSession = (e) => {
        e.preventDefault()
        let url = APP_ROUTES.login
        if (isLoggedIn()) {
            logout()
            url = APP_ROUTES.logout //getLogoutURL()
        }
        window.location.replace(url)
    }

    const supportedMetadata = () => {
        let supported = {}
        supported[cache.entities.source] = {
            categories: [
                cache.sourceTypes['Mouse']
            ]
        }
        supported[cache.entities.sample] = {
            categories: [
                cache.sampleCategories.Block,
                cache.sampleCategories.Section,
                cache.sampleCategories.Suspension,
            ]
        }
        return supported
    }

    return (
        <Navbar
            variant={'dark'}
            expand="lg"
            className={`sticky-top ${styles.navbar_custom}`}
        >
            <Container fluid={true}>
                <Navbar.Brand
                    href={APP_ROUTES.search}
                    className={'d-flex align-items-center'}
                >
                    <Image
                        src={logo}
                        width="42"
                        height="42"
                        alt={_t("SenNet logo")}
                    />
                    <div className={'ms-2 fs-3'}>{APP_TITLE}</div>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse>
                    <Nav className={'me-auto'}>
                        <NavDropdown
                            active={false}
                            variant={'primary'}
                            hidden={hidden}
                            title={_t("Register entity")}
                            id="nav-dropdown"
                        >
                            {Object.keys(cache.entities).map((entity) => (
                                <NavDropdown.Item key={entity} href={`/edit/${entity}?uuid=create`}>
                                    {_t(entity)}
                                </NavDropdown.Item>
                            ))}

                        </NavDropdown>
                        <NavDropdown
                            active={false}
                            variant={'primary'}
                            hidden={hidden}
                            title="Bulk register entities"
                            id="nav-dropdown--bulkCreate">
                            {Object.keys(cache.entities).map((entity) => (
                                <NavDropdown.Item key={entity} href={`/edit/bulk/${entity}?action=register`}>
                                    {entity}s
                                </NavDropdown.Item>
                            ))}

                        </NavDropdown>
                        <NavDropdown
                            active={false}
                            variant={'primary'}
                            hidden={hidden}
                            title="Bulk upload metadata"
                            id="nav-dropdown--bulkMetadata">
                            {Object.keys(supportedMetadata()).map((entity, key) => (
                                <div key={`dropdownItem-md-${entity}`}>
                                { key !== 0 && <NavDropdown.Divider  /> }
                                    <NavDropdown.Item className='dropdown-item is-heading dropdown-toggle' aria-controls={`submenu-md-${entity}`}>
                                        {entity}s
                                    </NavDropdown.Item>

                                   <div className={'submenu'} id={`submenu-md-${entity}`}>
                                       <NavDropdown.Divider />
                                       {Object.entries(supportedMetadata()[entity].categories).map((type, typekey) => (
                                           <NavDropdown.Item key={`submenuItem-md-${type}`} href={`/edit/bulk/${type}?action=metadata&category=${type}`} className={'is-subItem'}>
                                               <span>{supportedMetadata()[entity].categories[typekey]}</span>
                                           </NavDropdown.Item>
                                       ))}
                                   </div>
                                </div>
                            ))}
                        </NavDropdown>
                    </Nav>
                    <Nav>
                        <Nav.Link
                            className={'justify-content-end'}
                            hidden={signoutHidden}
                            href='#'
                            onClick={(e) => handleSession(e)}
                        >
                            {isLoggedIn() ? _t('Sign-out') : _t('Sign-in')}
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default AppNavbar
