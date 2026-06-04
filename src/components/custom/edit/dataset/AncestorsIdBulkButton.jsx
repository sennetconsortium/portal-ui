import dynamic from "next/dynamic";
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Button from 'react-bootstrap/Button';
import log from 'xac-loglevel'
import _ from 'lodash';
import { fetchEntity, getIdRegEx } from '@/components/custom/js/functions'
import AppContext from '@/context/AppContext'
import EntityContext, { EntityProvider } from "@/context/EntityContext";
import $ from 'jquery';
import SenNetPopover, { SenPopoverOptions } from "@/components/SenNetPopover"

import Tooltip from '@mui/material/Tooltip';
import Zoom from "@mui/material/Zoom"
import { SpinnerEl } from "@/components/custom/Spinner";

const AncestorIds = dynamic(() => import('@/components/custom/edit/dataset/AncestorIds'))

export default function AncestorsIdBulkButton({
    values,
    setAncestors,
    ancestors,
    onChange,
    bulkSupportedEntities,
    controlId = 'entity_uuids',
    entityType = 'Collection',
    entitiesTableLabel = 'Entities',
    entitiesButtonLabel = 'entity'
}) {
    const {
        setError,
        setErrorMessage,
        isEditMode
    } = useContext(EntityContext)
    const {
        _t,
        cache,
    } = useContext(AppContext)
    const router = useRouter()
    const [bulkAddField, setBulkAddField] = useState(false)
    const isBulkHandling = useRef(false)
    const [bulkErrorMessage, setBulkErrorMessage] = useState(null)
    const [bulkPopover, setBulkPopover] = useState(false)
    const bulkAddBtnTooltipDefault = (
        <span>
            Toggle the field to bulk add comma separated SenNet IDs or UUIDs.
        </span>
    )
    const [bulkAddBtnTooltip, setBulkAddBtnTooltip] = useState(
        bulkAddBtnTooltipDefault
    )
    const [bulkAddTextareaVal, setBulkAddTextareaVal] = useState(null)
    const supportedEntities = bulkSupportedEntities || [
        cache.entities.dataset,
        cache.entities.sample,
        cache.entities.source
    ]
    const [bulkAddSpinnerVisible, setBulkAddSpinnerVisible] = useState(false)

    async function fetchLinkedEntities(datasetUuids, errMsgs) {
        let newDatasets = []
        if (ancestors) {
            newDatasets = [...ancestors]
        }

        let notSupported = []
        for (const uuid of datasetUuids) {
            let paramKey = getIdRegEx().exec(uuid) ? 'sennet_id' : 'uuid'
            let entity = await fetchEntity(uuid, paramKey)

            if (entity.hasOwnProperty('error')) {
                if (isBulkHandling.current) {
                    setBulkPopover(true)
                    errMsgs = (
                        <>
                            {errMsgs} <br />
                            {entity['error']}
                        </>
                    )
                } else {
                    setError(true)
                    setErrorMessage(entity['error'])
                }
            } else {
                if (supportedEntities.includes(entity.entity_type)) {
                    // delete the entity if it already exists, append the new one
                    let idx = newDatasets.findIndex(
                        (d) => d.uuid === entity.uuid
                    )
                    if (idx > -1) {
                        newDatasets.splice(idx, 1)
                    }
                    newDatasets.push(entity)
                } else {
                    if (isBulkHandling.current) {
                        notSupported.push(uuid)
                    }
                }
            }
        }
        if (errMsgs && !notSupported.length) {
            setBulkPopover(true)
            setBulkErrorMessage(<>{errMsgs}</>)
        }
        if (notSupported.length) {
            setBulkPopover(true)
            setBulkErrorMessage(
                <>
                    {errMsgs}
                    {errMsgs && <br />}
                    <span>
                        Entity with <code>{notSupported.join(',')}</code>
                        {notSupported.length > 1 ? ' are' : ' is'} not
                        {notSupported.length > 1 ? '' : ' a'} dataset
                        {notSupported.length > 1 ? 's' : ''}.
                    </span>
                </>
            )
        }
        isBulkHandling.current = false
        setBulkAddSpinnerVisible(false)
        setAncestors(newDatasets)
        return newDatasets
    }

    const deleteLinkedEntity = (uuid) => {
        const prevEntities = [...ancestors]
        log.debug(prevEntities)
        let updatedEntities = prevEntities.filter((e) => e.uuid !== uuid)
        setAncestors(updatedEntities)
        log.debug(updatedEntities)
    }



    const showBulkAdd = () => {
        setBulkAddBtnTooltip(
            <span>
                Add your comma separated SenNet ids or uuids, and then click
                this button to bulk add <code>{entitiesTableLabel}</code> to the{' '}
                <code>{entityType}</code>.
            </span>
        )
        setBulkAddField(true)
    }

    const hideBulkAdd = () => {
        setBulkAddBtnTooltip(bulkAddBtnTooltipDefault)
        clearBulkPopover()
        setBulkAddTextareaVal(null)
        setBulkAddField(false)
    }

    const getTextareaVal = () => $('[name="ancestor_ids"]').val()

    const clearBulkPopover = () => {
        setBulkErrorMessage(null)
        setBulkPopover(false)
    }

    const handleBulkAddTextChange = () => {
        clearBulkPopover()
        setBulkAddTextareaVal(getTextareaVal())
    }

    const handleBulkAdd = async () => {
        const textareaVal = getTextareaVal()
        setBulkAddTextareaVal(textareaVal)
        clearBulkPopover()
        isBulkHandling.current = true
        setBulkAddSpinnerVisible(true)
        if (textareaVal) {
            let ids = textareaVal.split(',')
            let idsSet = new Set(ids) // remove duplicates
            ids = Array.from(idsSet)

            // in case of lingering commas or too many commas between inputs, let's clear empty values out of array
            ids = ids.filter((id) => id.trim() !== '')
            const re = getIdRegEx()
            let validIds = []
            let previous = ancestors ? [...ancestors] : []
            let dict = {}
            for (let p of previous) {
                dict[p.uuid] = true
                dict[p.sennet_id] = true
            }
            let alreadyAdded = []
            let invalidFormat = []
            for (let id of ids) {
                id = id.trim()
                let matched = getIdRegEx().test(id)
                if ((matched || id.length === 32) && !dict[id]) {
                    validIds.push(id)
                }
                if (dict[id]) {
                    alreadyAdded.push(id)
                }
                if (!matched && id.length !== 32) {
                    invalidFormat.push(id)
                }
            }
            let errMsg
            if (alreadyAdded.length) {
                errMsg = (
                    <span>
                        The dataset{alreadyAdded.length > 1 ? 's' : ''}&nbsp;
                        <code>{alreadyAdded.join(',')}</code>{' '}
                        {alreadyAdded.length > 1 ? 'have' : 'has'} already been
                        added.
                    </span>
                )
            }
            if (invalidFormat.length) {
                errMsg = (
                    <>
                        {errMsg}
                        <span>
                            Invalid dataset{invalidFormat.length > 1 ? 's' : ''}{' '}
                            id format <code>{invalidFormat.join(',')}</code>.
                        </span>
                    </>
                )
            }
            let datasets = await fetchLinkedEntities(validIds, errMsg)
            if (datasets.length) {
                onChange(
                    null,
                    controlId,
                    datasets.map((item) => item.uuid)
                )

                const $field = document.getElementById('ancestor_ids')
                // Clear textfield if all went well
                try {
                    if (datasets.length === ids.length) {
                        $field.value = ''
                    } else {
                        const idsDict = {}
                        for (let d of datasets) {
                            // delete what can be deleted, i.e. those user inputs that match normalized casing, making list smaller to deal with
                            idsSet.delete(d.uuid)
                            idsSet.delete(d.sennet_id)
                            //flag them to not be included in userReducedInput below
                            idsDict[d.uuid.toLowerCase()] = false
                            idsDict[d.sennet_id.toLowerCase()] = false
                        }

                        const userReducedInput = Array.from(idsSet).filter(
                            (x) => idsDict[x.trim().toLowerCase()] === undefined
                        )
                        $field.value = userReducedInput.join(',')
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    return (
        <>
            <AncestorIds
                controlId={controlId}
                otherWithAdd={
                    <>
                        &nbsp; &nbsp;
                        <SenNetPopover
                            placement={SenPopoverOptions.placement.top}
                            className={`c-metadataUpload__popover--${controlId}`}
                            text={bulkAddBtnTooltip}
                        >
                            <Button
                                variant='outline-secondary rounded-0 mt-1'
                                onClick={
                                    !bulkAddField ? showBulkAdd : handleBulkAdd
                                }
                                aria-controls='js-modal'
                            >
                                Bulk add {entitiesTableLabel.toLowerCase()}{' '}
                                <i className='bi bi-plus-lg'></i>
                            </Button>
                        </SenNetPopover>
                        <Tooltip
                            PopperProps={{
                                disablePortal: true
                            }}
                            onClose={() => {
                                setBulkPopover(false)
                            }}
                            open={bulkPopover}
                            TransitionComponent={Zoom}
                            disableFocusListener
                            disableHoverListener
                            disableTouchListener
                            title={
                                <>
                                    <span
                                        role='button'
                                        aria-label='Close bulk add entity tooltip'
                                        className='tooltip-close'
                                        onClick={() => {
                                            setBulkPopover(false)
                                        }}
                                    >
                                        <i className='bi bi-x'></i>
                                    </span>
                                    <div
                                        className={
                                            'tooltip-content tooltip-bulk-add-id'
                                        }
                                    >
                                        {bulkErrorMessage}
                                    </div>
                                </>
                            }
                        >
                            <span>&nbsp;</span>
                        </Tooltip>
                        <textarea
                            id='ancestor_ids'
                            name='ancestor_ids'
                            className={bulkAddField ? 'is-visible' : ''}
                            onChange={handleBulkAddTextChange}
                        />
                        <SenNetPopover
                            placement={SenPopoverOptions.placement.top}
                            className={`c-metadataUpload__popover--btnClose`}
                            text={
                                <span>
                                    Click here to cancel/close this field.
                                </span>
                            }
                        >
                            <span
                                role={'button'}
                                aria-label={'Cancel/close this field'}
                                className={`rounded-0 btn btn-outline-secondary btn-cancel ${bulkAddField ? 'is-visible' : ''}`}
                                onClick={hideBulkAdd}
                            >
                                Cancel
                            </span>
                        </SenNetPopover>
                        {bulkAddField && bulkAddTextareaVal && (
                            <SenNetPopover
                                placement={SenPopoverOptions.placement.bottom}
                                className={`c-metadataUpload__popover--btnAdd`}
                                text={
                                    <span>
                                        Click here to bulk add{' '}
                                        <code>{entitiesTableLabel}</code> to the{' '}
                                        <code>{entityType}</code>
                                    </span>
                                }
                            >
                                <span
                                    role='button'
                                    aria-label={`Bulk add Entities to the Collection`}
                                    onClick={
                                        bulkAddSpinnerVisible
                                            ? undefined
                                            : handleBulkAdd
                                    }
                                    className={`rounded-0 btn btn-success btn-add ${bulkAddField && bulkAddTextareaVal ? 'is-visible' : ''}`}
                                >
                                    {' '}
                                    {!bulkAddSpinnerVisible && (
                                        <span> Save Entities</span>
                                    )}
                                    {bulkAddSpinnerVisible && <SpinnerEl />}
                                </span>
                            </SenNetPopover>
                        )}
                    </>
                }
                isEditMode={isEditMode}
                formLabel={entitiesButtonLabel}
                formLabelPlural={entitiesTableLabel}
                values={values}
                ancestors={ancestors}
                onChange={onChange}
                onShowModal={clearBulkPopover}
                fetchAncestors={fetchLinkedEntities}
                deleteAncestor={deleteLinkedEntity}
            />
        </>
    )
}

