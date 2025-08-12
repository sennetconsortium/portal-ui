import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Autocomplete, TextField} from "@mui/material";
import Stack from "@mui/material/Stack";
import AncestorsModal from "@/components/custom/edit/dataset/AncestorsModal";

function AddQuadrant({setQ, fetchData}) {
    const [showHideModal, setShowHideModal] = useState(false)

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
                <Autocomplete
                    className={'mx-auto'}
                    disablePortal
                    options={[]}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Dataset" />}
                />
            </div>
            <div className={'text-center c-compare__addBtn'}>
                <i className="bi bi-plus-lg" onClick={()=> setShowHideModal(true)}></i>
            </div>

            <AncestorsModal data={[]} hideModal={hideModal} changeAncestor={changeAncestor} showHideModal={showHideModal} handleSearchFormSubmit={handleSearchFormSubmit} />

        </Stack>
    )
}

AddQuadrant.propTypes = {
    children: PropTypes.node
}

export default AddQuadrant