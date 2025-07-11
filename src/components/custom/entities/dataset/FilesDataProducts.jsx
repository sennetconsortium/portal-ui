import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "../../layout/SenNetAccordion";
import {datasetIs} from "../../js/functions";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import FileTreeView from "@/components/custom/entities/dataset/FileTreeView";
import DataProducts from "@/components/custom/entities/dataset/DataProducts";

function FilesDataProducts({ data, dataProducts, setShowFilesSection, showFilesSection }) {
    const [showSection, setShowSection] = useState(true)
    const [hasDataProducts, setHasDataProducts] = useState(false)
    useEffect(() => {
        if (showFilesSection != null) {
            setShowSection(showFilesSection)
        }
    }, [showFilesSection]);

    useEffect(() => {
        setHasDataProducts((datasetIs.primary(data.creation_action) || datasetIs.processed(data.creation_action)) && dataProducts && (dataProducts.length > 0))
    }, [dataProducts]);

    return (
        <>
            {showSection && <SenNetAccordion title={'Files'} id={'files-data-products'} className={showFilesSection ? '' : 'dp-invisible'}>

                <Tabs
                    className="mb-3"
                    variant="pills"
                >

                    {hasDataProducts &&
                        <Tab eventKey="data-products" title={'Data Products'}>
                            <DataProducts data={data} files={dataProducts}/>
                        </Tab>
                    }

                    <Tab eventKey="files" title={'File Browser'}>
                        <FileTreeView onStateUpdateCallback={setShowFilesSection} data={data} withoutAccordion={true}/>
                    </Tab>


                </Tabs>
            </SenNetAccordion>}
        </>
    )
}

FilesDataProducts.propTypes = {
    children: PropTypes.node
}

export default FilesDataProducts
