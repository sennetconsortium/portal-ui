import React, {useContext, useEffect, useRef, useState} from 'react';
import {Form} from 'react-bootstrap';
import {Results, SearchBox} from "@elastic/react-search-ui";
import {Layout} from "@elastic/react-search-ui-views";
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {exclude_dataset_config} from "../../../../config/config";
import {TableResultsEntities} from '../../TableResultsEntities';
import CustomClearSearchBox from "../../layout/CustomClearSearchBox";
import addons from "../../js/addons/addons";
import SelectedFilters from "../../layout/SelectedFilters";
import {getUBKGFullName} from "../../js/functions";
import SenNetPopover from "../../../SenNetPopover";
import SearchUIContainer from 'search-ui/components/core/SearchUIContainer';
import FacetsContent from '../../search/FacetsContent';
import AppContext from "../../../../context/AppContext";
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";

function BodyContent({ handleChangeSource, data }) {
    const {hasAuthenticationCookie, isUnauthorized } = useContext(AppContext)
    const { filters } = useSearchUIContext();
    const includedExclude = useRef(false)

    exclude_dataset_config['searchQuery']['conditionalFacets']['rui_location'] = ({filters}) => {
        return hasAuthenticationCookie() && !isUnauthorized() &&
            filters.some((filter) => filter.field === "entity_type" && filter.values.includes('Sample'))
    }

    exclude_dataset_config['searchQuery']['conditionalFacets']['ancestors.rui_location'] = () => false

    useEffect(() => {
        if (!includedExclude.current && data && data.uuid) {
            includedExclude.current = true
            exclude_dataset_config['searchQuery']['excludeFilters'].push({
                type: 'term',
                field: 'uuid.keyword',
                values: [data['uuid']]
            })
        }
    }, [])

    return (
        <div className="js-gtm--results"
             data-js-ada='.rdt_TableCell'>
            <Results filters={filters}
                     inModal={true}
                     onRowClicked={handleChangeSource}
                     view={TableResultsEntities} />
        </div>
    )
}

const AncestorId = ({fetchSource, onChange, source, data, isDisabled}) => {
    const {
        adminGroup,
        authorized,
        hasAuthenticationCookie
    } = useContext(AppContext);

    const [showHideModal, setShowHideModal] = useState(false)

    const handleSearchFormSubmit = (event, onSubmit) => {
        onSubmit(event)
    }

    const showModal = () => {
        setShowHideModal(true)
        // Enable addons for facets
        addons('sample')
    }

    const hideModal = () => {
        setShowHideModal(false)

        // Reset addons for facets
        delete window.addons['sample']
    }

    // Handles when updates are made to `Source ID` when the search feature is used
    const changeSource = async (e, sourceId) => {
        onChange(e, 'direct_ancestor_uuid', sourceId);
        fetchSource(sourceId);
        hideModal();
    }

    const authState = {
        isAuthenticated: hasAuthenticationCookie() === true,
        isAuthorized: authorized === true,
        isAdmin: adminGroup === true
    }

    return (
        <>
            <Form.Label>Ancestor ID <span
                className="required">* </span>
                <SenNetPopover className={'direct_ancestor_uuid'}
                               text={<>The SenNet ID of the entity that this <code>Sample</code> came from. Must be
                                   another <code>Sample</code> or <code>Source</code>.</>}>
                    <i className="bi bi-question-circle-fill"></i>
                </SenNetPopover>
            </Form.Label>
            <InputGroup className="mb-3" id="direct_ancestor_uuid">
                <Form.Control required type="text"
                              placeholder=""
                              disabled
                              onChange={e => onChange(e, e.target.id, e.target.value)}
                              defaultValue={source?.sennet_id}/>
                <Button disabled={isDisabled} variant="primary" onClick={isDisabled ? null : showModal}>
                    <i className="bi bi-search"></i>
                </Button>
            </InputGroup>

            <Modal
                size="xxl"
                show={showHideModal}
                onHide={hideModal}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Body>
                    <SearchUIContainer config={exclude_dataset_config} name={undefined} authState={authState}>
                        <Layout
                            header={
                                <div className="search-box-header js-gtm--search">
                                    <SearchBox
                                        view={({onChange, value, onSubmit}) => (
                                            <Form
                                                onSubmit={e => handleSearchFormSubmit(e, onSubmit)}>
                                                <Form.Group controlId="search">
                                                    <InputGroup>
                                                        <Form.Control
                                                            value={value}
                                                            onChange={(e) => onChange(e.currentTarget.value)}
                                                            className="right-border-none form-control form-control-lg rounded-0"
                                                            placeholder="Search"
                                                            autoFocus={true}
                                                        />
                                                        <InputGroup.Text
                                                            className={"transparent"}><i className="bi bi-search"></i></InputGroup.Text>
                                                        <Button variant="outline-primary"
                                                                className={"rounded-0"}
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

                                    <SelectedFilters/>

                                    <FacetsContent transformFunction={getUBKGFullName} />
                                </div>
                            }
                            bodyContent={
                                <BodyContent handleChangeSource={changeSource} data={data} />
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
        </>
    )
}

export default AncestorId
