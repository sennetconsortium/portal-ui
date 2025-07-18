import dynamic from "next/dynamic";
import React, {useContext} from "react";
import {ErrorBoundary, SearchBox} from "@elastic/react-search-ui";
import {Layout} from "@elastic/react-search-ui-views";
import {APP_TITLE} from "@/config/config";
import {SEARCH_METADATA} from "@/config/search/metadata"
import CustomClearSearchBox from "../../components/custom/layout/CustomClearSearchBox";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import AppContext from "@/context/AppContext";
import SelectedFilters from "@/components/custom/layout/SelectedFilters";
import {getUBKGFullName} from "@/components/custom/js/functions";
import {TableResultsEntities} from "@/components/custom/TableResultsEntities";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const BodyContent = dynamic(() => import("@/components/custom/search/BodyContent"))
const FacetsContent = dynamic(() => import("@/components/custom/search/FacetsContent"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const InvalidToken = dynamic(() => import("@/components/custom/layout/InvalidToken"))
const SearchTypeButton = dynamic(() => import("@/components/custom/search/SearchTypeButton"))
const SearchUIContainer = dynamic(() => import("@/search-ui/components/core/SearchUIContainer"))
const SelectedFacets = dynamic(() => import("@/components/custom/search/SelectedFacets"))
const Spinner = dynamic(() => import("@/components/custom/Spinner"))


function SearchMetadata() {
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

    const getFacetName = (term) => {
        return term.length ? getUBKGFullName(term) : 'None'
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

                <SearchUIContainer config={SEARCH_METADATA} name='metadata' authState={authState}>
                    <AppNavbar hidden={isRegisterHidden}/>
                    <ErrorBoundary className={'js-app--searchErrorBoundary'} data-components={getStringifiedComponents()}>
                        <Layout
                            header={
                                <>
                                    <div className="search-box-header js-gtm--search">
                                        <SearchBox
                                            view={({onChange, value, onSubmit}) => (
                                                <Form onSubmit={e => handleSearchFormSubmit(e, onSubmit)}>
                                                    <Form.Group controlId="search">
                                                        <InputGroup>
                                                            <Form.Control
                                                                value={value}
                                                                onChange={(e) => onChange(e.currentTarget.value)}
                                                                className="right-border-none form-control form-control-lg rounded-1"
                                                                placeholder="Search"
                                                                autoFocus={false}
                                                            />
                                                            <InputGroup.Text
                                                                className={"transparent"}><i
                                                                className="bi bi-search"></i></InputGroup.Text>
                                                            <Button variant="outline-primary"
                                                                    className={"rounded-1"}
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
                                    <CustomClearSearchBox/>

                                    <SearchTypeButton title='Entities'/>


                                    <SelectedFilters/>

                                    <FacetsContent transformFunction={getFacetName}/>
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

export default SearchMetadata
