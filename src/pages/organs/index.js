import { APP_TITLE } from '@/config/config'
import { APP_ROUTES } from '@/config/constants'
import AppContext from '@/context/AppContext'
import useOrganList from '@/hooks/organ/useOrganList'
import dynamic from 'next/dynamic'
import { useContext } from 'react'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'

const AppFooter = dynamic(() => import('@/components/custom/layout/AppFooter'))
const AppNavbar = dynamic(() => import('@/components/custom/layout/AppNavbar'))
const Header = dynamic(() => import('@/components/custom/layout/Header'))
const OrganCard = dynamic(() => import('@/components/custom/organ/OrganCard'))
const Spinner = dynamic(() => import('@/components/custom/Spinner'))

const AllOrgans = () => {
    const {
        logout,
        isRegisterHidden,
        isAuthorizing,
        isUnauthorized,
        hasAuthenticationCookie
    } = useContext(AppContext)

    const { organList } = useOrganList()

    if (isAuthorizing()) {
        return <Spinner />
    }

    if (isUnauthorized() && hasAuthenticationCookie()) {
        // This is a scenario in which the GLOBUS token is expired but the token still exists in the user's cookies
        logout()
        window.location.reload()
    }

    return (
        <>
            <Header title={APP_TITLE} />
            <AppNavbar hidden={isRegisterHidden} signoutHidden={false} />
            <Container fluid className='mb-5 d-block'>
                <Row>
                    <div className='py-4 bd-highlight'>
                        <h2 className='m-0 flex-grow-1 bd-highlight'>Organs</h2>
                    </div>
                </Row>

                <Row xs={1} s={2} md={4} className='gy-2'>
                    {organList.map((organ) => (
                        <Col key={organ.label}>
                            <a
                                className='text-decoration-none'
                                href={`${APP_ROUTES.organs}/${organ.path}`}
                            >
                                <OrganCard organ={organ} />
                            </a>
                        </Col>
                    ))}
                </Row>
            </Container>
            <AppFooter />
        </>
    )
}

export default AllOrgans
