import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import SenNetSuspense from "@/components/SenNetSuspense";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import {datasetIs, eq, getDatasetTypeDisplay, getEntityViewUrl} from "@/components/custom/js/functions";
import DataTable from "react-data-table-component";
import {ShimmerTable, ShimmerText} from "react-shimmer-effects";
import LnkIc from "@/components/custom/layout/LnkIc";
import useAutoHideColumns from "@/hooks/useAutoHideColumns";
import ClipboardCopy from "@/components/ClipboardCopy";

function ProtocolsWorkflow({data}) {
    const [rawTableData, setRawTableData] = useState([])
    const [workflow, setWorkflow] = useState({})
    const {columnVisibility, tableData, updateCount, setTriggerUpdate} = useAutoHideColumns( {data: rawTableData})
    const [descendant, setDescendant] = useState(null)


    const parseToolVal = (r) => {
        let parts = r.origin.split('/')
        return `${parts[parts.length - 1].replace('.git', '')} ${r.version ? `(${r.version})` : '' }`
    }

    const parseCommitVal = (r) => {
        return `${r.origin.replace('.git', '')}/tree/${r.hash}`
    }

    const parsePipelineVal = (r) => {
        if (r.name && eq(r.name, 'pipeline.cwl')) {
            return `https://view.commonwl.org/workflows${r.origin.replace('https:/', '').replace('.git', '')}/blob/${r.hash}/pipeline.cwl`
        }
        return null
    }

    const hasInputParams = (r) => {
        return !(r.input_parameters !== undefined && r.input_parameters.length > 0)
    }

    const transformData = () => {
        let ingestDetails
        if (datasetIs.processed(data.creation_action)) {
            ingestDetails = data.ingest_metadata
            setWorkflow(ingestDetails)
        } else if (datasetIs.primary(data.creation_action)) {
            for (let d of data.descendants) {
                if (datasetIs.processed(d.creation_action)) {
                    ingestDetails = d.ingest_metadata
                    setWorkflow(ingestDetails)
                    setDescendant(d)
                    break;
                }
            }
        }

        if (ingestDetails) {
            let _data = []
            let i = 1;
            for (let r of ingestDetails.dag_provenance_list) {
                _data.push({
                    ...r,
                    step: i,
                    tool: parseToolVal(r),
                    origin_link: r.origin,
                    git_commit: parseCommitVal(r),
                    cwl_pipeline: parsePipelineVal(r)
                })
                i++
            }

            setRawTableData(_data)
            setTriggerUpdate(true)
        }
    }

    const columns = () => {
        return [
            {
                name: 'Step',
                id: 'step',
                width: '100px',
                selector: row => row.step,
                reorder: true,
                format: row => <span data-field='step'>{row.step}</span>,
            },
            {
                name: 'Tool',
                id: 'tool',
                selector: row => row.tool,
                width: '250px',
                reorder: true,
                format: row => <span data-field='tool'>{row.tool}</span>,
            },
            {
                name: 'Origin Link',
                id: 'origin_link',
                selector: row => row.origin_link,
                reorder: true,
                format: row => <span data-field='origin_link'><LnkIc title={row.origin_link} href={row.origin_link} /> </span>,
            },
            {
                name: 'Git Commit',
                id: 'git_commit',
                selector: row => row.git_commit,
                width: '150px',
                reorder: true,
                format: row => <span data-field='git_commit'><LnkIc title={row.hash} href={row.git_commit} /> </span>,
            },
            {
                name: 'Documentation',
                id: 'documentation_url',
                selector: row => row.documentation_url || '',
                omit: columnVisibility.documentation_url,
                reorder: true,
                format: row => {
                    updateCount('documentation_url', (row.documentation_url != null && row.documentation_url?.length > 0))
                    return <span data-field='documentation_url'>{row.documentation_url && <LnkIc title={row.documentation_url} href={row.documentation_url} />} </span>
                },
            },
            {
                name: 'CWL Pipeline',
                id: 'cwl_pipeline',
                selector: row => row.cwl_pipeline,
                omit: columnVisibility.cwl_pipeline,
                reorder: true,
                format: row => {
                    updateCount('cwl_pipeline', row.cwl_pipeline)
                    return <span data-field='cwl_pipeline'>{row.cwl_pipeline && <LnkIc className={'btn btn-outline-primary btn-sm'} aria-label={`Open CWL Viewer Step ${row.step}`} title={'Open CWL Viewer'} href={row.cwl_pipeline} />} </span>
                },
            }
        ]

    }


    useEffect(() => {
        if (data && ( datasetIs.processed(data.creation_action)
            || (datasetIs.primary(data.creation_action) && data.descendants))) {

            transformData()
        }
    }, [data, data?.descendants])

    const ExpandedComponent = ({ data }) => {
        if (!data.input_parameters) return <></>
        let copyText = ''
        let res = []
        let i = 0;
        let curr = ''

        for (let c of data?.input_parameters) {
            curr = `${c.parameter_name} ${c.value}`
            copyText += curr
            res.push(<li key={`ip-${i}`}><small><code>{curr}</code> <ClipboardCopy title={'Copy this input snippet'} text={curr} /></small></li>)
            i++
        }

        return <>
            <h3 className={'fs-6 mt-3'}>Input Parameters {data?.input_parameters.length > 1 && <ClipboardCopy title={'Copy all input parameters'} text={copyText} />}</h3>
            <div className={'mb-2'}>
                {res}
            </div>
        </>
    }


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
                {descendant && <p>Workflow from descendant <a href={getEntityViewUrl('dataset', descendant.uuid, {}, {})}>{descendant.sennet_id} {getDatasetTypeDisplay(descendant)}</a></p>}
                {workflow?.workflow_version && <h2 className={'fs-6'}>Workflow {workflow?.workflow_version}</h2>}
                <p>{workflow?.workflow_description}</p>
                <DataTable
                    columns={columns()}
                    data={tableData}
                    expandableRows
                    expandableRowDisabled={hasInputParams}
                    expandableRowsComponent={ExpandedComponent}
                />
            </SenNetAccordion>
        </SenNetSuspense>
    )
}



ProtocolsWorkflow.propTypes = {
    children: PropTypes.node
}

export default ProtocolsWorkflow