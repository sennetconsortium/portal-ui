import React, {useContext, useEffect, useState} from "react";
import SenNetPopover from "../../SenNetPopover";
import {eq, extractSourceMappedMetadataInfo} from "../js/functions";
import SenNetAccordion from "../layout/SenNetAccordion";
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import AppContext from "../../../context/AppContext";
import MetadataTable from "./MetadataTable";
import PropTypes from "prop-types";
import * as d3 from "d3";
import $ from 'jquery'
import {ViewHeaderBadges} from "../layout/entity/ViewHeaderBadges";

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
    const [headerBadges, setHeaderBadges] = useState(null)

    useEffect(() => {
        // Trigger the default node to be clicked
        const $el = document.querySelector(`[data-rr-ui-event-key="${data.sennet_id}"]`)
        if ($el) {
            $el.click();
        }
    }, [data]);

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
                <Nav.Item>
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
        <SenNetAccordion title={'Metadata'} afterTitle={headerBadges}>
            {data.ancestors ? (
                    <Tab.Container defaultActiveKey={data.sennet_id}>
                        <Nav variant="pills" className={"mb-3 flex-nowrap overflow-auto"}>
                            {/*Create metadata table for current entity*/}
                            {!!(metadata && Object.keys(metadata).length) &&
                                <SenNetPopover className={"current-metadata"}
                                               text={<>View the metadata for this entity.</>}>
                                    <Nav.Item>
                                        <Nav.Link onClick={(e) => {triggerNode(e, data.uuid); updateHeader(data)}} data-uuid={data.uuid}
                                                  eventKey={data.sennet_id}>
                                            {data.sennet_id}*
                                        </Nav.Link>
                                    </Nav.Item>
                                </SenNetPopover>
                            }

                            {/*Create metadata table for ancestors*/}
                            {/*We want to reverse the ordering of this array so that the furthest ancestor is on the left*/}
                            {data.ancestors.reverse().map((ancestor, index, array) => {
                                    // The source nav link
                                    if (eq(ancestor.entity_type, cache.entities.source)) {
                                        if ((ancestor.source_mapped_metadata && Object.keys(ancestor.source_mapped_metadata).length) ||
                                            (ancestor.metadata && Object.keys(ancestor.metadata).length)) {
                                            return (
                                                popoverCommon(index, 'source', ancestor)
                                            )
                                        }
                                        // the sample nav link
                                    } else if (eq(ancestor.entity_type, cache.entities.sample)) {
                                        if (ancestor.metadata && Object.keys(ancestor.metadata).length > 0) {
                                            return (
                                                popoverCommon(index, 'sample', ancestor)
                                            )
                                        }
                                        // The dataset nav link
                                    } else if (eq(ancestor.entity_type, cache.entities.dataset)) {
                                        if (ancestor.ingest_metadata && Object.keys(ancestor.ingest_metadata).length && 'metadata' in ancestor.ingest_metadata) {
                                            return (
                                                popoverCommon(index, 'dataset', ancestor)
                                            )
                                        }
                                    }
                                }
                            )}

                        </Nav>
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
                            {data.ancestors.reverse().map((ancestor, index, array) => {
                                // Handle human source table
                                // Human sources have their metadata inside "source_mapped_metadata"
                                if (eq(ancestor.entity_type, cache.entities.source) && eq(ancestor.source_type, cache.sourceTypes.Human)) {
                                    if (ancestor.source_mapped_metadata && Object.keys(ancestor.source_mapped_metadata).length) {
                                        const {groups, metadata} = extractSourceMappedMetadataInfo(ancestor.source_mapped_metadata)
                                        return (
                                            tabPaneCommon('0', index, ancestor, metadata, undefined, groups)
                                        )
                                    }
                                } else if (!eq(ancestor.entity_type, cache.entities.dataset) && ancestor.metadata && Object.keys(ancestor.metadata).length > 0) {
                                    // Handle mouse source and sample table
                                    // Mice sources and all samples have their metadata inside "metadata"
                                    return (
                                        tabPaneCommon('1', index, ancestor, ancestor.metadata, ancestor.cedar_mapped_metadata)
                                    )
                                } else if (ancestor.ingest_metadata && Object.keys(ancestor.ingest_metadata).length && 'metadata' in ancestor.ingest_metadata) {
                                    // Handle dataset table
                                    // Datasets have their metadata inside "metadata.metadata"
                                    return (
                                        tabPaneCommon('2', index, ancestor, ancestor.ingest_metadata.metadata, ancestor.cedar_mapped_metadata)
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
