import dynamic from "next/dynamic";
import React, {useContext, useEffect} from "react"
import {useRouter} from "next/router"
import Link from "next/link"
import {APP_TITLE} from "@/config/config"
import {SEARCH_METADATA} from "@/config/search/metadata"
import AppContext from "@/context/AppContext"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import {Sui} from "search-ui/lib/search-tools"

const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

function Metadata() {
    const {logout, isRegisterHidden, isAuthorizing, isUnauthorized, hasAuthenticationCookie} = useContext(AppContext)
    const router = useRouter()

    const METADATA_SEARCH = "/search/metadata"

    useEffect(() => {
        Sui.keyPrefix = "metadata"
    }, [])

    function handleBrowseAllMetadataClicked(event) {
        event.preventDefault()
        Sui.saveFilters({})
        router.push({
            pathname: METADATA_SEARCH,
        })
    }

    if (isAuthorizing()) {
        return <Spinner/>
    } else {
        if (isUnauthorized() && hasAuthenticationCookie()) {
            // This is a scenario in which the GLOBUS token is expired but the token still exists in the user"s cookies
            logout()
            window.location.reload()
        }
        return (
            <>
                <Header title={APP_TITLE}/>
                <AppNavbar hidden={isRegisterHidden}/>
                <Container className="mb-5 d-block">
                    <Row>
                        <div className="py-4 d-flex bd-highlight align-items-center">
                            <h2 className="m-0 flex-grow-1 bd-highlight">Browse by Popular Searches</h2>
                            <div className="bd-highlight">
                                <button className="btn btn-outline-primary rounded-0 clear-filter-button"
                                        onClick={handleBrowseAllMetadataClicked}>
                                    Search All Metadata
                                </button>
                            </div>
                        </div>
                    </Row>

                    <Row xs={1} s={2} md={3} className="gy-2">
                        {SEARCH_METADATA.discover.map((item) => {
                            return (
                                <Col key={item.title}>
                                    <Card className="p-4 rounded-0 h-100">
                                        <Card.Body
                                            className="d-flex flex-column justify-content-between align-items-start">
                                            <div className="mb-2">
                                                <div className={`mb-2 circle ${item.entityType}-background`}/>
                                                <Card.Title className="mb-2">{item.title}</Card.Title>
                                                <Card.Text className="mb-2">{item.description}</Card.Text>
                                            </div>
                                            <Link href={{pathname: METADATA_SEARCH, query: item.queryString}}>
                                                <Button variant="primary rounded-0">Search</Button>
                                            </Link>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            )
                        })}
                    </Row>
                </Container>
            </>
        )
    }
}

export default Metadata
