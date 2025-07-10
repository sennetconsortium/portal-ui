import React from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "../../layout/SenNetAccordion";
import {getCreationActionRelationName, getDatasetTypeDisplay} from "../../js/functions";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import DataTable from "react-data-table-component";
import ClipboardCopy from "../../../ClipboardCopy";
import InfoIcon from "@mui/icons-material/Info";
import Alert from 'react-bootstrap/Alert';

function CreationActionRelationship({entity, data}) {
    const relationshipNames = {
        component: 'Component Dataset (Raw)',
        processed: 'Primary Dataset (Processed)',
        primary: 'Primary Dataset (Raw)'
    }

    const getDefaultTab = () => {
        const category = getCreationActionRelationName(entity.creation_action)
        return category.replace(' Dataset', '').toLowerCase()
    }

    const columns = [
        {
            name: 'SenNet ID',
            selector: row => row.sennet_id,
            sortable: false,
            format: (row) => {
                return <span className={'has-supIcon'}><a
                    href={'/' + row.entity_type.toLowerCase() + '?uuid=' + row.uuid}
                    className="icon-inline">{row.sennet_id}</a><ClipboardCopy text={row.sennet_id} size={10}
                                                                              title={'Copy SenNet ID {text} to clipboard'}/></span>
            }
        },
        {
            name: 'Dataset Type',
            selector: row => getDatasetTypeDisplay(row),
            sortable: true,
        },
        {
            name: 'Group Name',
            selector: row => row.group_name,
            sortable: true,
        }
    ];

    const componentColumns = [
        {
            name: 'SenNet ID',
            selector: row => row.sennet_id,
            sortable: false,
            format: (row) => {
                return <span className={'has-supIcon'}>{row.sennet_id}<ClipboardCopy text={row.sennet_id} size={10}
                                                                                     title={'Copy SenNet ID {text} to clipboard'}/></span>
            }
        },
        {
            name: 'Dataset Type',
            selector: row => getDatasetTypeDisplay(row),
            sortable: true,
        },
        {
            name: 'Group Name',
            selector: row => row.group_name,
            sortable: true,
        }
    ];

    return (
        <>
            <SenNetAccordion title={'Multi-Assay Relationship'} id={'multi-assay-relationship'}>
                <p>This dataset is a component of a multi-assay dataset and the relationships between datasets are
                    displayed below.</p>

                <Tabs
                    defaultActiveKey={getDefaultTab()}
                    className="mb-3"
                    variant="pills"
                >
                    {data.primary.length > 0 &&
                        <Tab eventKey="primary" title={relationshipNames.primary}>
                            <Alert variant='info' style={{fontSize: '.8em'}}><InfoIcon/> Primary (raw) datasets contain
                                comprehensive information about the multi-assay, as
                                provided by the data providers, and are composed of the component datasets.</Alert>
                            <p></p>
                            <DataTable
                                columns={columns}
                                data={data.primary}
                                fixedHeader={true}
                            />
                        </Tab>
                    }
                    {data.component.length > 0 &&
                        <Tab eventKey="component" title={relationshipNames.component}>
                            <Alert variant='info' style={{fontSize: '.8em'}}><InfoIcon/> A component dataset is a dataset that
                                comprises the multi-assay dataset.</Alert>
                            <DataTable
                                columns={componentColumns}
                                data={data.component}
                                fixedHeader={true}
                            />
                        </Tab>
                    }
                    {data.processed.length > 0 &&
                        <Tab eventKey="processed" title={relationshipNames.processed}>
                            <Alert variant='info' style={{fontSize: '.8em'}}><InfoIcon/> Processed primary datasets are analyses
                                generated based on primary (raw) datasets by
                                either SenNet using uniform processing pipelines or by an external processing
                                approach.</Alert>
                            <DataTable
                                columns={columns}
                                data={data.processed}
                                fixedHeader={true}
                            />
                        </Tab>
                    }
                </Tabs>
            </SenNetAccordion>
        </>
    )
}

CreationActionRelationship.propTypes = {
    children: PropTypes.node
}

export default CreationActionRelationship
