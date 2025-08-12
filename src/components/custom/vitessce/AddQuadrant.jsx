import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Button, Form, InputGroup, Col} from 'react-bootstrap'
import Stack from "@mui/material/Stack";
import AncestorsModal from "@/components/custom/edit/dataset/AncestorsModal";
import {valid_dataset_ancestor_config} from "@/config/config";
import SearchUIContainer from "@/search-ui/components/core/SearchUIContainer";
import AppContext from "@/context/AppContext";
import {Layout} from '@elastic/react-search-ui-views';
import {SearchBox} from '@elastic/react-search-ui';

function AddQuadrant({setQ, fetchData, resultsFilterCallback}) {
    const [showHideModal, setShowHideModal] = useState(false)

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

    const handleSearchFormSubmit = (event, onSubmit) => {
        onSubmit(event)
    }

    const changeAncestor = async (e, ancestorId) => {
        fetchData(ancestorId, setQ, hideModal)
    }

    const hideModal = () => {
        setShowHideModal(false)
    }

    useEffect(() => {
    }, [])

    return (
        <Stack className={'c-compare__addQuadrant'} spacing={2}>
            <div className={'c-compare__search'}>


                <SearchUIContainer config={valid_dataset_ancestor_config} name={undefined} authState={authState}>
                    <Layout
                        header={
                            <div className="search-box-header js-gtm--search">
                                <SearchBox
                                    view={({onChange, value, onSubmit}) => (
                                        <Form
                                            onSubmit={e => handleSearchFormSubmit(e, onSubmit)}>
                                            <Form.Group className={`sui-filterableComponent`} as={Col} controlId="search">
                                                <InputGroup>
                                                    <Form.Control
                                                        value={value}
                                                        onChange={(e) => onChange(e.currentTarget.value)}
                                                    />
                                                    <InputGroup.Text className={"transparent"}><i className="bi bi-search"></i></InputGroup.Text>
                                                    <Button type="button" label={'Reset'}><i className="bi bi-x"></i></Button>
                                                </InputGroup>
                                            </Form.Group>

                                            {/*onClick={e => handleSearchFormSubmit(e, onSubmit)}*/}
                                        </Form>
                                    )}
                                />
                            </div>
                        }
                        sideContent={
                            <span></span>
                        }
                        bodyContent={<span></span>

                        }
                    />
                </SearchUIContainer>
            </div>
            <div className={'text-center c-compare__addBtn'}>
                <i className="bi bi-plus-lg" onClick={() => setShowHideModal(true)}></i>
            </div>

            <AncestorsModal resultsFilterCallback={resultsFilterCallback} data={[]} hideModal={hideModal}
                            changeAncestor={changeAncestor} showHideModal={showHideModal}
                            handleSearchFormSubmit={handleSearchFormSubmit} />

        </Stack>
    )
}

AddQuadrant.propTypes = {
    children: PropTypes.node
}

export default AddQuadrant