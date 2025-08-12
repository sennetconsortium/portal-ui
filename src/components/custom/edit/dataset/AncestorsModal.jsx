import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import CustomClearSearchBox from "@/components/custom/layout/CustomClearSearchBox";
import SelectedFilters from "@/components/custom/layout/SelectedFilters";
import {Layout} from '@elastic/react-search-ui-views';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {getUBKGFullName} from '@/components/custom/js/functions';
import FacetsContent from '@/components/custom/search/FacetsContent';
import SearchUIContainer from 'search-ui/components/core/SearchUIContainer';
import AppContext from "@/context/AppContext";
import {valid_dataset_ancestor_config} from '@/config/config';
import {TableResultsEntities} from '@/components/custom/TableResultsEntities'
import { useSearchUIContext } from 'search-ui/components/core/SearchUIContext';
import {Results, SearchBox} from '@elastic/react-search-ui';
import {Form} from 'react-bootstrap';


function BodyContent({ handleChangeAncestor, data, resultsFilterCallback }) {
    const {hasAuthenticationCookie, isUnauthorized } = useContext(AppContext)
    const { wasSearched, filters } = useSearchUIContext();
    const includedExclude = useRef(false)

    valid_dataset_ancestor_config['searchQuery']['conditionalFacets']['rui_location'] = ({filters}) => {
        return hasAuthenticationCookie() && !isUnauthorized() &&
            filters.some((filter) => filter.field === "entity_type" && filter.values.includes('Sample'))
    }

    valid_dataset_ancestor_config['searchQuery']['conditionalFacets']['ancestors.rui_location'] = () => false

    useEffect(() => {
        if (!includedExclude.current && data && data.uuid) {
            includedExclude.current = true
            valid_dataset_ancestor_config['searchQuery']['excludeFilters'].push({
                type: 'term',
                field: "uuid.keyword",
                value: data['uuid']
            })
        }
        if (resultsFilterCallback) {
            resultsFilterCallback(valid_dataset_ancestor_config)
        }
    }, [])

    return (
        <div
            data-js-ada='.rdt_TableCell'
            data-js-tooltip='{"trigger":".rdt_TableBody [role=\"row\"]", "diffY": -81, "data":".modal-content .rdt_Table", "class": "is-error"}'
        >
            {wasSearched && <Results filters={filters}
                                     inModal={true}
                                     onRowClicked={handleChangeAncestor}
                                     view={TableResultsEntities} />}
        </div>
    )
}

function AncestorsModal({data, hideModal, changeAncestor, showHideModal, handleSearchFormSubmit, resultsFilterCallback, searchValue}) {
    const hasInit = useRef(false)
    useEffect(() => {

    }, [])

    const getValue = (value) => {
        if (!hasInit.current && searchValue) {
            hasInit.current = true;
            return searchValue
        }
        return value
    }

    const {
        adminGroup,
        authorized,
        hasAuthenticationCookie
    } = useContext(AppContext);

    const authState = {
        isAuthenticated: hasAuthenticationCookie() === true,
        isAuthorized: authorized === true,
        isAdmin: adminGroup === true
    }

    return (
        <Modal
            size="xxl"
            show={showHideModal}
            onHide={hideModal}
            backdrop="static"
            keyboard={false}
        >
            <Modal.Body>
                <SearchUIContainer config={valid_dataset_ancestor_config} name={undefined} authState={authState}>
                    <Layout
                        header={
                            <div className="search-box-header js-gtm--search">
                                <SearchBox
                                    view={({onChange, value, onSubmit}) => (
                                        <Form id={'modal-search-form'}
                                            onSubmit={e => handleSearchFormSubmit(e, onSubmit)}>
                                            <Form.Group controlId="search">
                                                <InputGroup>
                                                    <Form.Control
                                                        value={getValue(value)}
                                                        onChange={(e) => onChange(e.currentTarget.value)}
                                                        className="right-border-none form-control form-control-lg rounded-1"
                                                        placeholder="Search"
                                                        autoFocus={true}
                                                    />
                                                    <InputGroup.Text
                                                        className={"transparent"}><i
                                                        className="bi bi-search"></i></InputGroup.Text>
                                                    <Button variant="outline-primary"
                                                            className={"rounded-1"}
                                                            onClick={e => handleSearchFormSubmit(e, onSubmit)}>Search</Button>
                                                </InputGroup>
                                            </Form.Group>
                                        </Form>
                                    )}
                                />
                            </div>
                        }
                        sideContent={
                            <div data-js-ada='facets'>
                                <CustomClearSearchBox />

                                <SelectedFilters />

                                <FacetsContent transformFunction={getUBKGFullName} />
                            </div>
                        }
                        bodyContent={
                            <BodyContent handleChangeAncestor={changeAncestor} data={data} resultsFilterCallback={resultsFilterCallback} />
                        }
                    />
                </SearchUIContainer>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary rounded-0" onClick={hideModal}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

AncestorsModal.propTypes = {
    children: PropTypes.node
}

export default AncestorsModal