import React from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "../../layout/SenNetAccordion";
import {datasetIs} from "../../js/functions";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import FileTreeView from "@/components/custom/entities/dataset/FileTreeView";
import DataProducts from "@/components/custom/entities/dataset/DataProducts";

function FilesDataProducts({ data, dataProducts }) {


    return (
        <>
            <SenNetAccordion title={'Files & Data Products'} id={'files-data-products'}>


                <Tabs
                    defaultActiveKey={'files'}
                    className="mb-3"
                    variant="pills"
                >

                    <Tab eventKey="files" title={'Files'}>
                        <FileTreeView data={data} withoutAccordion={true}/>
                    </Tab>

                    {(datasetIs.primary(data.creation_action) || datasetIs.processed(data.creation_action)) && dataProducts && (dataProducts.length > 0) &&
                        <Tab eventKey="data-products" title={'Data Products'}>
                            <DataProducts data={data} files={dataProducts}/>
                        </Tab>
                    }
                </Tabs>
            </SenNetAccordion>
        </>
    )
}

FilesDataProducts.propTypes = {
    children: PropTypes.node
}

export default FilesDataProducts
