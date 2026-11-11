import dynamic from "next/dynamic";
import React, {useEffect, useState} from 'react';
import {Container, Row} from 'react-bootstrap'
import {createDownloadUrl, tableDataToTSV} from '../js/functions';
import useDataTableSearch from '@/hooks/useDataTableSearch';
import GroupedDataTable from './GroupedDataTable';
import SenNetPopover from '@/components/SenNetPopover';

const DataTable = dynamic(() => import('react-data-table-component'), {
    ssr: false,
});

export default function MetadataTable({data, metadata, mappedMetadata, metadataKey, filename, groups}) {
    let columns = [
        {
            name: 'Key',
            selector: row => row.key,
            sortable: true,
            wrap: true,
            style: {
                'padding-top': '16px',
                'padding-bottom': '16px',
            }
        },
        {
            name: 'Value',
            selector: row => row.value,
            sortable: true,
            wrap: true,
            style: {
                'padding-top': '16px',
                'padding-bottom': '16px',
            }
        }
    ];

    let tableData = [];
    if (mappedMetadata) {
        Object.entries(mappedMetadata).map(([key, value]) => {
            tableData.push({
                key: metadataKey + key,
                value: Array.isArray(value) ? value.join(', ') : value
            })
        })
    } else {
        Object.entries(metadata).map(([key, value]) => {
            tableData.push({
                key: metadataKey + key,
                value: Array.isArray(value) ? value.join(', ') : value
            })
        })
    }

    const {filteredItems, searchBarComponent} = useDataTableSearch({data: tableData, fieldsToSearch: ['value', 'key']})
    const [downloadURL, setDownloadURL] = useState(null)
    const tableDataTSV = tableDataToTSV(metadata);

    useEffect(() => {
        setDownloadURL(
            createDownloadUrl(
                tableDataTSV,
                'text/tab-separated-values'
            )
        )
    }, [tableDataTSV])

    return (
        <Container fluid={true} className={'rdt-container-wrap'}>
            <Row className="mb-2">
                <div className="col-sm-12">
                    <div className="entity-subtitle icon-inline float-md-end">
                        <SenNetPopover className='download-entity-metadata'
                                       text={<>Download the metadata
                                           for <code>{data.entity_type} {data.sennet_id}</code>.</>}>
                            <a href={downloadURL}
                               download={downloadURL ? `${filename}.tsv` : undefined} className="float-end">
                                <span className="btn btn-primary"
                                      role='button'>
                                    <i className="bi bi-download"></i>
                                </span>
                            </a>
                        </SenNetPopover>
                    </div>
                </div>
            </Row>
            {groups ?
                (
                    <GroupedDataTable metadata={metadata} groups={groups}/>
                ) :
                (
                    <DataTable columns={columns}
                               data={filteredItems}
                               fixedHeader={true}
                               subHeader={searchBarComponent}
                               pagination/>
                )
            }
        </Container>
    )
}
