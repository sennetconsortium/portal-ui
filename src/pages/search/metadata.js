import React, {useContext} from "react";
import {
    ErrorBoundary,
    Results,
    SearchBox,
    SearchProvider,
    WithSearch
} from "@elastic/react-search-ui";
import {Layout} from "@elastic/react-search-ui-views";
import Facets from "search-ui/components/core/Facets";
import {TableResultsEntities} from '../../components/custom/TableResultsEntities'
import {APP_TITLE} from "../../config/config";
import {SEARCH_METADATA} from "../../config/search/metadata"
import AppNavbar from "../../components/custom/layout/AppNavbar";
import AppFooter from "../../components/custom/layout/AppFooter";
import Header from "../../components/custom/layout/Header";
import CustomClearSearchBox from "../../components/custom/layout/CustomClearSearchBox";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from "../../components/custom/Spinner";
import AppContext from "../../context/AppContext";
import SelectedFilters from "../../components/custom/layout/SelectedFilters";
import {getDataTypesByProperty, getUBKGFullName} from "../../components/custom/js/functions";
import {Sui} from "search-ui/lib/search-tools";
import {Search} from "react-bootstrap-icons";
import SelectedFacets from "../../components/custom/search/SelectedFacets";

function SearchMetadata() {
    const {
        _t,
        cache,
        logout,
        isRegisterHidden,
        isAuthorizing,
        isUnauthorized,
        hasAuthenticationCookie
    } = useContext(AppContext);

    // Return an array of data types that should be excluded from search
    // const excludeDataTypes = getDataTypesByProperty("vis-only", true)
    const excludeNonPrimaryTypes = getDataTypesByProperty("primary", false)
    SEARCH_METADATA['searchQuery']['excludeFilters'].push({
        keyword: "data_types.keyword",
        value: excludeNonPrimaryTypes
    });

    function handleClearFiltersClick() {
        Sui.clearFilters()
    }

    function handleSearchFormSubmit(event, onSubmit) {
        onSubmit(event)
    }

    if (isAuthorizing()) {
        return <Spinner/>
    } else {
        if (isUnauthorized() && hasAuthenticationCookie()) {
            // This is a scenario in which the GLOBUS token is expired but the token still exists in the user's cookies
            logout()
            window.location.reload()
        }
        return (
            <>
                <Header title={APP_TITLE}/>

                <SearchProvider config={SEARCH_METADATA}>
                    <WithSearch mapContextToProps={({wasSearched, rawResponse, filters, addFilter, removeFilter, setFilter}) => ({wasSearched, rawResponse, filters, addFilter, removeFilter, setFilter})}>
                        {({wasSearched, rawResponse, filters, addFilter, removeFilter, setFilter}) => {
                            return (
                                <div onLoad={() => Sui.applyFilters(addFilter, removeFilter, filters, 'metadata')}>
                                    <AppNavbar hidden={isRegisterHidden}/>

                                    <ErrorBoundary>

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
                                                                                className={"transparent"}><Search/></InputGroup.Text>
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
                                                        <SelectedFacets filters={filters} addFilter={addFilter} removeFilter={removeFilter} setFilter={setFilter} />
                                                    </div>
                                                 </>
                                            }
                                            sideContent={
                                                <div data-js-ada='facets'>
                                                    <CustomClearSearchBox clearFiltersClick={handleClearFiltersClick} />

                                                    <SelectedFilters/>

                                                    {wasSearched &&
                                                        <Facets fields={SEARCH_METADATA.searchQuery}
                                                                filters={filters}
                                                                rawResponse={rawResponse}
                                                                transformFunction={getUBKGFullName} />
                                                    }
                                                </div>

                                            }
                                            bodyContent={
                                                <div className="js-gtm--results sui-resultsTable" data-js-ada='tableResults' data-ada-data='{"trigger": ".rdt_TableCell", "tabIndex": ".rdt_TableRow"}'>
                                                    {wasSearched && <Results filters={filters} titleField={filters}
                                                                             view={TableResultsEntities}
                                                    />}
                                                    {!wasSearched && <Spinner /> }
                                                </div>

                                            }
                                        />
                                    </ErrorBoundary>
                                </div>
                            );
                        }}
                    </WithSearch>
                    <AppFooter/>
                </SearchProvider>
            </>
        )
    }
}

export default SearchMetadata