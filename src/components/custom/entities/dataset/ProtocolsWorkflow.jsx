import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import SenNetSuspense from "@/components/SenNetSuspense";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import {datasetIs, eq, getDatasetTypeDisplay} from "@/components/custom/js/functions";
import DataTable from "react-data-table-component";
import {ShimmerTable, ShimmerText, ShimmerThumbnail} from "react-shimmer-effects";
import LnkIc from "@/components/custom/layout/LnkIc";
import useAutoHideColumns from "@/hooks/useAutoHideColumns";

function ProtocolsWorkflow({data}) {
    const [rawTableData, setRawTableData] = useState([])
    const [workflow, setWorkflow] = useState({})
    const {columnVisibility, tableData, updateCount} = useAutoHideColumns( {data: rawTableData})


    const parseToolVal = (r) => {
        let parts = r.origin.split('/')
        return `${parts[parts.length - 1].replace('.git', '')} ${r.version ? `(${r.version})` : '' }`
    }

    const parseCommitVal = (r) => {
        return `${r.origin.replace('.git', '')}/tree/${r.hash}`
    }

    const parsePipelineVal = (r) => {
        if (r.name && eq(r.name, 'pipeline.cwl')) {

        }
        return null

    }

    parsePipelineVal

    const transformData = () => {
        let ingestDetails
        if (datasetIs.processed(data.creation_action)) {
            ingestDetails = data.ingest_metadata
            setWorkflow(data.ingest_metadata)
        } else if (datasetIs.primary(data.creation_action)) {
            for (let d of data.descendants) {
                if (datasetIs.processed(d.creation_action)) {
                    ingestDetails = d.ingest_metadata
                    setWorkflow(d.ingest_metadata)
                    break;
                }
            }
        }

        if (ingestDetails) {
            let _data = []
            let i = 1;
            for (let r of ingestDetails.dag_provenance_list) {
                _data.push({
                    step: i,
                    tool: parseToolVal(r),
                    origin_link: r.origin,
                    hash: r.hash,
                    git_commit: parseCommitVal(r),
                    cwl_pipeline: parsePipelineVal(r)
                })
                i++

            }
            setRawTableData(_data)
        }
    }

    const columns = () => {
        return [
            {
                name: 'Step',
                id: 'step',
                selector: row => row.step,
                sortable: true,
                reorder: true,
                format: row => <span data-field='step'>{row.step}</span>,
            },
            {
                name: 'Tool',
                id: 'tool',
                selector: row => row.tool,
                sortable: true,
                reorder: true,
                format: row => <span data-field='tool'>{row.tool}</span>,
            },
            {
                name: 'Origin Link',
                id: 'origin_link',
                selector: row => row.origin_link,
                sortable: true,
                reorder: true,
                format: row => <span data-field='origin_link'><LnkIc title={row.origin_link} href={row.origin_link} /> </span>,
            },
            {
                name: 'Git Commit',
                id: 'git_commit',
                selector: row => row.git_commit,
                sortable: true,
                reorder: true,
                format: row => <span data-field='git_commit'><LnkIc title={row.hash} href={row.git_commit} /> </span>,
            },
            {
                name: 'Documentation',
                id: 'documentation',
                selector: row => {
                    updateCount('documentation', row.documentation)
                    return row.documentation || ''
                },
                omit: columnVisibility.documentation,
                sortable: true,
                reorder: true,
                format: row => <span data-field='documentation'>{row.documentation && <LnkIc title={row.documentation} href={row.documentation} />} </span>,
            },
            {
                name: 'CWL Pipeline',
                id: 'cwl_pipeline',
                selector: row => {
                    updateCount('cwl_pipeline', row.cwl_pipeline)
                    return row.cwl_pipeline || ''
                },
                omit: columnVisibility.cwl_pipeline,
                sortable: true,
                reorder: true,
                format: row => <span data-field='cwl_pipeline'>{row.cwl_pipeline &&  <LnkIc title={row.cwl_pipeline} href={row.cwl_pipeline} />} </span>,
            }
        ]

    }


    useEffect(() => {
        if (data && ( datasetIs.processed(data.creation_action)
            || (datasetIs.primary(data.creation_action) && data.descendants))) {

            transformData()
        }
    }, [data, data?.descendants])

    return (
        <SenNetSuspense showChildren={rawTableData}
                        id="Protocols-Workflow-Details" title="Protocols & Workflow Details"
                        style={{ height:'600px' }}
                        suspenseElements={<>
                            <ShimmerText line={4} gap={10} />
                            <ShimmerTable row={5} col={5} height={700} className={'mt-2'} rounded />
                        </>}
        >
            <SenNetAccordion id="Protocols-Workflow-Details" title="Protocols & Workflow Details">
                <h2>Workflow {workflow?.workflow_version}</h2>
                <p>{workflow?.workflow_description}</p>
                <DataTable
                    columns={columns()}
                    data={tableData}
                />
            </SenNetAccordion>
        </SenNetSuspense>
    )
}



ProtocolsWorkflow.propTypes = {
    children: PropTypes.node
}

export default ProtocolsWorkflow