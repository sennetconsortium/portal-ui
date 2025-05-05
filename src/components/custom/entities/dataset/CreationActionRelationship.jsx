import React from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "../../layout/SenNetAccordion";
import {getCreationActionRelationName, getDatasetTypeDisplay} from "../../js/functions";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import DataTable from "react-data-table-component";
import ClipboardCopy from "../../../ClipboardCopy";

function CreationActionRelationship({ entity, data }) {
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
                return <span className={'has-supIcon'}><a href={'/' + row.entity_type.toLowerCase() + '?uuid=' + row.uuid}
                                                          className="icon-inline">{row.sennet_id}</a><ClipboardCopy text={row.sennet_id} size={10} title={'Copy SenNet ID {text} to clipboard'} /></span>
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
                <p>This dataset is a component of a multi-assay dataset and the relationships between datasets are displayed below.</p>

                <Tabs
                    defaultActiveKey={getDefaultTab()}
                    className="mb-3"
                    variant="pills"
                >
                {data.primary.length > 0 &&
                    <Tab eventKey="primary" title={relationshipNames.primary}>
                        <DataTable
                            columns={columns}
                            data={data.primary}
                            fixedHeader={true}
                            />
                    </Tab>
                }
                {data.component.length > 0 &&
                    <Tab eventKey="component" title={relationshipNames.component}>
                        <DataTable
                            columns={columns}
                            data={data.component}
                            fixedHeader={true}
                           />
                    </Tab>
                }
                {data.processed.length > 0 &&
                    <Tab eventKey="processed" title={relationshipNames.processed}>
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
