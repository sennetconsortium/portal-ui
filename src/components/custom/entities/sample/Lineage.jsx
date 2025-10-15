import React, {useContext} from 'react';
import {
    displayBodyHeader,
    getDatasetTypeDisplay,
    getOrganMeta,
    getStatusColor,
    getStatusDefinition,
    getSubtypeProvenanceShape,
    getUBKGFullName
} from "../../js/functions";
import ClipboardCopy from "@/components/ClipboardCopy";
import AppContext from "@/context/AppContext";
import useAutoHideColumns from "@/hooks/useAutoHideColumns";
import DataTable from "react-data-table-component";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {RESULTS_PER_PAGE} from "@/config/config";
import SenNetPopover from "@/components/SenNetPopover";

const Lineage = ({lineage}) => {
    const {isLoggedIn} = useContext(AppContext)
    const {columnVisibility, tableData, updateCount} = useAutoHideColumns({data: lineage})
    const getId = (column) => column.id || column.uuid

    console.log(tableData)
    const reusableColumns = {}
    reusableColumns['SenNetID'] = {
        name: 'SenNet ID',
        selector: row => row.sennet_id,
        sortable: false,
        format: col => {
            return <span className={'has-supIcon'}><a
                href={'/' + col.entity_type.toLowerCase() + '?uuid=' + col.uuid}
                className="icon-inline">{col.sennet_id}</a><ClipboardCopy text={col.sennet_id}
                                                                          size={10}
                                                                          title={'Copy SenNet ID {text} to clipboard'}/></span>
        }
    }
    reusableColumns['Status'] = {
        name: 'Status',
        id: 'status',
        selector: row => row.status,
        format: (row) => <span className={`${getStatusColor(row.status)} badge`}><SenNetPopover
            text={getStatusDefinition(row.status)}
            className={`status-info-${getId(row)}`}>{row.status}</SenNetPopover></span>,
        sortable: true
    }
    reusableColumns['Organ'] = {
        name: 'Organ',
        selector: row => {
            const code = row?.origin_samples?.[0]?.organ || row.organ
            const organ = getUBKGFullName(code)
            return organ || ''
        },
        sortable: true,
        omit: columnVisibility.organ,
        format: row => {
            const code = row?.origin_samples?.[0]?.organ || row.organ
            updateCount('organ', code)
            const organ = getUBKGFullName(code)
            return <span>{organ} {code && <img alt={organ} src={getOrganMeta(code).icon} width={'20px'}/>}</span>
        }
    }
    reusableColumns['DatasetType'] = {
        name: 'Dataset Type',
        id: 'dataset_type',
        selector: row => {
            const subType = getDatasetTypeDisplay(row)
            return subType || ''
        },
        format: row => {
            const subType = getDatasetTypeDisplay(row)
            return getSubtypeProvenanceShape(subType, row.creation_action)
        },
        sortable: true
    }
    reusableColumns['SampleCategory'] = {
        name: 'Category',
        id: 'sample_category',
        selector: row => row.sample_category ? displayBodyHeader(row.sample_category) : '',
        format: row => {
            const sample_category = row.sample_category
            return getSubtypeProvenanceShape(sample_category)
        },
        sortable: true,
    }
    reusableColumns['SourceType'] = {
        name: 'Type',
        id: 'source_type',
        selector: row => row.source_type,
        sortable: true
    }
    reusableColumns['LabDatasetID'] = {
        name: 'Lab ID',
        selector: row => {
            const lab_dataset_id = row.lab_dataset_id
            updateCount('lab_dataset_id', lab_dataset_id)
            return lab_dataset_id || ''
        },
        sortable: true,
        omit: columnVisibility.lab_dataset_id
    }
    reusableColumns['LabSampleID'] = {
        name: 'Lab ID',
        selector: row => {
            const lab_tissue_sample_id = row.lab_tissue_sample_id
            updateCount('lab_tissue_sample_id', lab_tissue_sample_id)
            return lab_tissue_sample_id || ''
        },
        sortable: true,
        omit: columnVisibility.lab_tissue_sample_id
    }
    reusableColumns['LabSourceID'] = {
        name: 'Lab ID',
        selector: row => {
            const lab_source_id = row.lab_source_id
            updateCount('lab_source_id', lab_source_id)
            return lab_source_id || ''
        },
        sortable: true,
        omit: columnVisibility.lab_source_id
    }


    reusableColumns['GroupName'] = {
        name: 'Group Name',
        selector: row => row.group_name,
        sortable: true,
    }

    const datasetColumns = [
        reusableColumns.SenNetID,
        reusableColumns.DatasetType,
        reusableColumns.Organ,
        reusableColumns.Status
    ]
    if (isLoggedIn()) {
        datasetColumns.push(reusableColumns.LabDatasetID)
    }
    datasetColumns.push(reusableColumns.GroupName)

    const sampleColumns = [
        reusableColumns.SenNetID,
        reusableColumns.Organ,
        reusableColumns.SampleCategory
    ]
    if (isLoggedIn()) {
        sampleColumns.push(reusableColumns.LabSampleID)
    }
    sampleColumns.push(reusableColumns.GroupName)

    const sourceColumns = [
        reusableColumns.SenNetID,
        reusableColumns.SourceType
    ]
    if (isLoggedIn()) {
        sourceColumns.push(reusableColumns.LabSourceID)
    }
    sourceColumns.push(reusableColumns.GroupName)


    const datasetData = tableData.filter(obj => obj.entity_type === "Dataset")
    const sampleData = tableData.filter(obj => obj.entity_type === "Sample")
    const sourceData = tableData.filter(obj => obj.entity_type === "Source")

    return (
        <div className={"p-tree mb-3"}>
            <Tabs
                defaultActiveKey={datasetData.length > 0 ? "datasets" : sampleData.length > 0 ? "samples" : "sources"}
                className="c-provenance__lineage__tabs mb-3"
                variant="pills"
            >
                {datasetData && datasetData.length > 0 &&
                    <Tab eventKey="datasets"
                         title={<span>{getSubtypeProvenanceShape("Dataset", null, 'lg')} ({datasetData.length})</span>}>
                        <DataTable
                            columns={datasetColumns}
                            data={datasetData}
                            fixedHeader={true}
                            paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                            pagination/>
                    </Tab>
                }


                {sampleData && sampleData.length > 0 &&
                    <Tab eventKey="samples"
                         title={<div>{getSubtypeProvenanceShape("Sample", null, 'lg')} ({sampleData.length})</div>}>
                        <DataTable
                            columns={sampleColumns}
                            data={sampleData}
                            fixedHeader={true}
                            paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                            pagination/>
                    </Tab>
                }
                {sourceData && sourceData.length > 0 &&
                    <Tab eventKey="sources"
                         title={<span>{getSubtypeProvenanceShape("Source", null, 'lg')} ({sourceData.length})</span>}>
                        <DataTable
                            columns={sourceColumns}
                            data={sourceData}
                            fixedHeader={true}
                            paginationRowsPerPageOptions={RESULTS_PER_PAGE}
                            pagination/>
                    </Tab>
                }
            </Tabs>
        </div>
    )
}

export default Lineage