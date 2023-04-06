import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap'
import {APP_TITLE, getLogoutURL} from '../../../config/config'
import {APP_ROUTES} from '../../../config/constants'
import {useContext} from 'react'
import styles from '../appNavbar.module.css'
import logo from './sennet-logo.png'
import Image from 'next/image'
import AppContext from '../../../context/AppContext'

const AppNavbar = ({hidden, signoutHidden}) => {
    const {_t, isLoggedIn, logout, cache} = useContext(AppContext)

    const handleSession = (e) => {
        e.preventDefault()
        let url = APP_ROUTES.login
        if (isLoggedIn()) {
            logout()
            url = APP_ROUTES.logout //getLogoutURL()
        }
        window.location.replace(url)
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
                            title={_t("Create an Entity")}
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
                            title="Bulk create entities"
                            id="nav-dropdown--bulkCreate">
                            <NavDropdown.Item
                                href="/edit/bulk?entity_type=source">Sources</NavDropdown.Item>
                            <NavDropdown.Item
                                href="/edit/bulk?entity_type=sample">Samples</NavDropdown.Item>
                            <NavDropdown.Item
                                href="/edit/bulk?entity_type=dataset">Datasets</NavDropdown.Item>
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
