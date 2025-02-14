import React, {useContext, useEffect, useRef, useState} from "react";
import SenNetPopover from '@/components/SenNetPopover';
import {eq, extractSourceMappedMetadataInfo} from "../js/functions";
import SenNetAccordion from "../layout/SenNetAccordion";
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import AppContext from "@/context/AppContext";
import MetadataTable from "./MetadataTable";
import PropTypes from "prop-types";
import * as d3 from "d3";
import $ from 'jquery'
import {ViewHeaderBadges} from "../layout/entity/ViewHeaderBadges";
import log from 'loglevel';
import { getProvenanceMetadata } from "@/lib/services";

/**
 * Component that displays metadata information.
 *
 * @component
 * @param {Object} props - The props object for the Metadata component
 * @param {Record<string, any>} props.data - The data entity object.
 * @param {Record<string, string>} [props.metadata] - The metadata object. Used for tsv file download. Used for display if mappedMetadata is not supplied (optional)
 * @param {Record<string, string>} [props.mappedMetadata] - The mapped metadata object used for display (optional)
 * @param {Record<string, string>} [props.groups] - The groups object used to create a GroupedDataTable (i.e. Human sources) (optional)
 * @param {boolean} [props.hasLineageMetadata=false] - A boolean indicating whether lineage metadata is present (default: false)
 */
function Metadata({data, metadata, mappedMetadata, groups}) {
    const {cache} = useContext(AppContext)
    const downloadRef = useRef(null)
    const [headerBadges, setHeaderBadges] = useState(null)
    const [hasProvMetadata, setHasProvMetadata] = useState(false)

    useEffect(() => {
        // Trigger the default node to be clicked
        const $el = document.querySelector(`[data-rr-ui-event-key="${data.sennet_id}"]`)
        if ($el) {
            $el.click();
        }
    }, [data]);

    useEffect(() => {
        if (!eq(data.entity_type, cache.entities.dataset) || !data.ancestors) {
            return
        }

        // Check if any of the ancestors have metadata property
        const hasProvMetadata = data.ancestors.some(a => a.metadata !== undefined) ?? false
        setHasProvMetadata(hasProvMetadata)
    }, [data.ancestors])

    const handleProvMetadataDownload = async () => {
        if (!downloadRef.current) {
            return
        }

        if (!downloadRef.current.href) {
            // This is a bit of a hack to lazy download the provenance metadata
            try {
                const jsonData = await getProvenanceMetadata(data.uuid)
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                const downloadUrl = URL.createObjectURL(blob);
                downloadRef.current.href = downloadUrl;
                downloadRef.current.download = `${data.sennet_id}_provenance_metadata.json`;
            } catch (e) {
                log.error('Error downloading provenance metadata:', e)
            }
        }

        downloadRef.current.click();
    }

    const triggerNode = (e, uuid) => {
        // Coupled with Provenance.onNodeClick
        const sel = `node--${uuid}`
        const $list = $(`[id="${sel}"]`)
        const $target = $list.eq($list.length - 1)
        const treeId = $target.parents('.c-provenance--Tree').attr('id')
        $(`#${treeId} .node`).removeClass('is-active')
        $target.addClass('is-active')
        d3.select(`#${treeId} #${sel}`).dispatch('click', {detail: {metadata: true}})
    }

    const updateHeader = (data) => {
        setHeaderBadges(<ViewHeaderBadges data={data} isMetadataHeader={true}/>)
    }

    const popoverCommon = (index, entity, data) => {
        return (
            <SenNetPopover key={`sennet-popover-${entity}-${index}`} className={`${index}-${entity}-metadata`}
                           text={<>View the metadata for the ancestor <code>{cache.entities[entity]}</code> of this
                               entity.</>}>
                <Nav.Item className='p-0'>
                    <Nav.Link
                        onClick={(e) => {
                            triggerNode(e, data.uuid);
                            updateHeader(data)
                        }}
                        data-uuid={data.uuid}
                        eventKey={data.sennet_id}
                        bsPrefix={`btn btn-${entity} rounded-0`}
                    >
                        {data.sennet_id}
                    </Nav.Link>
                </Nav.Item>
            </SenNetPopover>
        )
    }

    const tabPaneCommon = (pre, index, data, metadata, mappedMetadata, groups) => {
        return (
            <Tab.Pane key={`tabpane-${pre}-${index}`} eventKey={data.sennet_id}>
                <MetadataTable data={data}
                               filename={data.sennet_id}
                               metadataKey={""}
                               metadata={metadata}
                               mappedMetadata={mappedMetadata}
                               groups={groups}
                               setHeaderBadges={setHeaderBadges}/>
            </Tab.Pane>
        )
    }

    return (
        <SenNetAccordion title='Metadata' afterTitle={headerBadges} className='accordion-metadata'>
            {data.ancestors ? (
                <Tab.Container defaultActiveKey={data.sennet_id}>
                    <div className='d-flex justify-content-between align-items-sm-center align-items-start my-3'>
                        <Nav variant='pills' className='overflow-auto align-items-center gap-2'>
                            {/*Create metadata table for current entity*/}
                            {!!(metadata && Object.keys(metadata).length) &&
                                <SenNetPopover className='current-metadata'
                                               text={<>View the metadata for this entity.</>}>
                                    <Nav.Item className='p-0'>
                                        <Nav.Link onClick={(e) => {triggerNode(e, data.uuid); updateHeader(data)}}
                                                  data-uuid={data.uuid}
                                                  eventKey={data.sennet_id}>
                                            {data.sennet_id}*
                                        </Nav.Link>
                                    </Nav.Item>
                                </SenNetPopover>
                            }

                            {/*Create metadata table for ancestors*/}
                            {/*We want to reverse the ordering of this array so that the furthest ancestor is on the left*/}
                            {data.ancestors?.reverse().map((ancestor, index) => {
                                // The source nav link
                                if (eq(ancestor.entity_type, cache.entities.source)) {
                                    if ((ancestor.source_mapped_metadata && Object.keys(ancestor.source_mapped_metadata).length) ||
                                        (ancestor.metadata && Object.keys(ancestor.metadata).length)) {
                                        return (
                                            popoverCommon(index, 'source', ancestor)
                                        )
                                    }
                                    // The sample nav link
                                } else if (eq(ancestor.entity_type, cache.entities.sample)) {
                                    if (ancestor.metadata && Object.keys(ancestor.metadata).length > 0) {
                                        return (
                                            popoverCommon(index, 'sample', ancestor)
                                        )
                                    }
                                    // The dataset nav link
                                } else if (eq(ancestor.entity_type, cache.entities.dataset)) {
                                        if (ancestor.metadata && Object.keys(ancestor.metadata).length > 0) {
                                        return (
                                            popoverCommon(index, 'dataset', ancestor)
                                        )
                                    }
                                }
                            })}
                        </Nav>

                        {hasProvMetadata && (
                            <SenNetPopover className='download-provenance-metadata'
                                           text={<>Download the full provenance metadata for this <code>Dataset {data.sennet_id}</code> and all of its ancestors.</>}>
                                <Button type='button'
                                        className='sm:fs-1'
                                        onClick={handleProvMetadataDownload}
                                        label='Download Provenance Metadata'>
                                    Provenance Metadata
                                </Button>
                                <a ref={downloadRef} className='d-none'></a>
                            </SenNetPopover>
                        )}
                    </div>

                    <Tab.Content>
                        {!!(metadata && Object.keys(metadata).length) &&
                            // The metatable table for the current entity
                            <Tab.Pane eventKey={data.sennet_id}>
                                <MetadataTable
                                    data={data}
                                    filename={data.sennet_id}
                                    metadata={metadata}
                                    mappedMetadata={mappedMetadata}
                                    groups={groups}
                                    metadataKey={""}
                                    setHeaderBadges={setHeaderBadges}/>
                            </Tab.Pane>
                        }
                        {data.ancestors?.reverse().map((ancestor, index) => {
                            // Handle human source table
                            // Human sources have their metadata inside "source_mapped_metadata"
                            if (eq(ancestor.entity_type, cache.entities.source) && eq(ancestor.source_type, cache.sourceTypes.Human)) {
                                if (ancestor.source_mapped_metadata && Object.keys(ancestor.source_mapped_metadata).length) {
                                    const {groups, metadata} = extractSourceMappedMetadataInfo(ancestor.source_mapped_metadata)
                                    return (
                                        tabPaneCommon('0', index, ancestor, metadata, undefined, groups)
                                    )
                                }
                            } else if ( ancestor.metadata && Object.keys(ancestor.metadata).length > 0) {
                                return (
                                    tabPaneCommon('1', index, ancestor, ancestor.metadata, ancestor.cedar_mapped_metadata)
                                )
                            }
                        })}
                    </Tab.Content>
                </Tab.Container>
            ) :
            (
                <MetadataTable data={data}
                               filename={data.sennet_id}
                               metadata={metadata}
                               mappedMetadata={mappedMetadata}
                               groups={groups}
                               metadataKey=""
                               setHeaderBadges={setHeaderBadges}/>
            )
        }

        </SenNetAccordion>
    )
}

Metadata.propTypes = {
    data: PropTypes.object.isRequired,
    metadata: PropTypes.object,
    mappedMetadata: PropTypes.object,
    groups: PropTypes.object
}

export default Metadata
