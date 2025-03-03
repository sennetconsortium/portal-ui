import dynamic from "next/dynamic";
import React, {useContext} from "react";
import {ErrorBoundary, SearchBox} from "@elastic/react-search-ui";
import {Layout} from "@elastic/react-search-ui-views";
import {APP_TITLE} from "@/config/config";
import {SEARCH_ENTITIES} from "@/config/search/entities"
import CustomClearSearchBox from "@/components/custom/layout/CustomClearSearchBox";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import AppContext from "@/context/AppContext";
import SelectedFilters from "@/components/custom/layout/SelectedFilters";
import {getUBKGFullName} from "@/components/custom/js/functions";
import {TableResultsEntities} from "@/components/custom/TableResultsEntities";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const AppTutorial = dynamic(() => import("@/components/custom/layout/AppTutorial"))
const BodyContent = dynamic(() => import("@/components/custom/search/BodyContent"))
const FacetsContent = dynamic(() => import("@/components/custom/search/FacetsContent"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const InvalidToken = dynamic(() => import("@/components/custom/layout/InvalidToken"))
const SearchDropdown = dynamic(() => import("@/components/custom/search/SearchDropdown"))
const SearchUIContainer = dynamic(() => import("@/search-ui/components/core/SearchUIContainer"))
const SelectedFacets = dynamic(() => import("@/components/custom/search/SelectedFacets"))
const SenNetBanner = dynamic(() => import("@/components/SenNetBanner"))
const Spinner = dynamic(() => import("@/components/custom/Spinner"))

function SearchEntities() {
    const {
        _t,
        logout,
        adminGroup,
        isRegisterHidden,
        hasInvalidToken,
        validatingToken,
        authorized,
        isAuthorizing,
        isUnauthorized,
        hasAuthenticationCookie,
        getStringifiedComponents
    } = useContext(AppContext);

    function handleSearchFormSubmit(event, onSubmit) {
        onSubmit(event)
    }

    if (validatingToken() || isAuthorizing()) {
        return <Spinner/>
    } else if (hasInvalidToken()) {
        return <InvalidToken/>
    } else {
        if (isUnauthorized() && hasAuthenticationCookie()) {
            // This is a scenario in which the GLOBUS token is expired but the token still exists in the user's cookies
            logout()
            window.location.reload()
        }

        const authState = {
            isAuthenticated: hasAuthenticationCookie() === true,
            isAuthorized: authorized === true,
            isAdmin: adminGroup === true
        }

        return (
            <>
                <Header title={APP_TITLE}/>

                <SearchUIContainer config={SEARCH_ENTITIES} name='entities' authState={authState}>
                    <AppNavbar hidden={isRegisterHidden}/>
                    <ErrorBoundary className={'js-app--searchErrorBoundary'} data-components={getStringifiedComponents()}>
                        <Layout
                            header={
                                <>
                                    <div className="search-box-header js-gtm--search">
                                        <SenNetBanner name={'searchEntities'}/>
                                        <AppTutorial/>
                                        <SearchBox
                                            view={({onChange, value, onSubmit}) => (
                                                <Form onSubmit={e => handleSearchFormSubmit(e, onSubmit)}>
                                                    <Form.Group controlId="search">
                                                        <InputGroup>
                                                            <Form.Control
                                                                value={value}
                                                                onChange={(e) => onChange(e.currentTarget.value)}
                                                                className="right-border-none form-control form-control-lg rounded-0"
                                                                placeholder="Search"
                                                                autoFocus={false}
                                                            />
                                                            <InputGroup.Text
                                                                className={"transparent"}><i
                                                                className="bi bi-search"></i></InputGroup.Text>
                                                            <Button variant="outline-primary"
                                                                    className={"rounded-0"}
                                                                    onClick={e => handleSearchFormSubmit(e, onSubmit)}>{_t('Search')}</Button>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Form>
                                            )}
                                        />
                                    </div>
                                    <div className='sui-filters-summary'>
                                        <SelectedFacets/>
                                    </div>
                                </>
                            }
                            sideContent={
                                <div data-js-ada='facets'>
                                    <SearchDropdown title='Entities'/>

                                    <CustomClearSearchBox/>

                                    <SelectedFilters/>

                                    <FacetsContent transformFunction={getUBKGFullName}/>
                                </div>
                            }
                            bodyContent={
                                <BodyContent view={TableResultsEntities}/>
                            }
                        />
                    </ErrorBoundary>
                </SearchUIContainer>

                <AppFooter/>
            </>
        )
    }
}

export default SearchEntities
