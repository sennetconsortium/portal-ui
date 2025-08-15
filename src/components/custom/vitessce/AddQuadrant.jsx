import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Button, Form, InputGroup, Col} from 'react-bootstrap'
import Stack from "@mui/material/Stack";
import AncestorsModal from "@/components/custom/edit/dataset/AncestorsModal";

function AddQuadrant({setQ, qId, fetchData, resultsFilterCallback}) {
    const [showHideModal, setShowHideModal] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const handleSearchFormSubmit = (event, onSubmit) => {
        onSubmit(event)
    }

    const changeAncestor = async (e, ancestorId) => {
        fetchData(ancestorId, setQ, updateUI)
    }

    const updateUI = (data) => {
        let uuids = []
        let uuid
        for (let i = 1; i < 5; i++) {
            uuid = data[`q${i}`]?.uuid
            if (uuid && data.current.uuid !== uuid ) {
                uuids.push(uuid)
            }
            if ((i - 1) === qId) {
                uuids.push(data.current.uuid)
            }
        }
        window.history.replaceState(null, null, `?uuids=${uuids.join(',')}`)
        hideModal()
    }

    const hideModal = () => {
        setShowHideModal(false)
    }

    return (
        <Stack className={'c-compare__addQuadrant'} spacing={2}>
            <div className={'c-compare__search'}>

                <Form
                    onSubmit={e => {
                        e.preventDefault()
                        setShowHideModal(true)
                    }}>
                <Form.Group className={`sui-filterableComponent`} as={Col} controlId="search">
                    <InputGroup>
                        <Form.Control
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.currentTarget.value)}
                        />
                        <InputGroup.Text className={"transparent"}><i className="bi bi-search"></i></InputGroup.Text>
                        <Button type="button" label={'Reset'}><i className="bi bi-x"></i></Button>
                    </InputGroup>
                </Form.Group>
                </Form>
            </div>
            <div className={'text-center c-compare__addBtn'}>
                <i className="bi bi-plus-lg" onClick={() => setShowHideModal(true)}></i>
            </div>

            <AncestorsModal resultsFilterCallback={resultsFilterCallback} data={[]} hideModal={hideModal}
                            changeAncestor={changeAncestor} showHideModal={showHideModal}
                            searchValue={searchValue}
                            handleSearchFormSubmit={handleSearchFormSubmit} />

        </Stack>
    )
}

AddQuadrant.propTypes = {
    children: PropTypes.node
}

export default AddQuadrant