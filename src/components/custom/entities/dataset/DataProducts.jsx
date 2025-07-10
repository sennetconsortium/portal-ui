import React from 'react'
import PropTypes from 'prop-types'
import SenNetAccordion from "../../layout/SenNetAccordion";
import {datasetIs} from "../../js/functions";
import FileTreeView from "./FileTreeView";
import Link from "next/link";

function DataProducts({ files, data }) {


    return (
        <>
            <SenNetAccordion title={'Data Products'} id={'data-products'}>
                {datasetIs.primary(data.creation_action) && <div className={'fw-light fs-6 mb-2'}>
                                Files from descendant
                                <Link target="_blank" href={{pathname: '/dataset', query: {uuid: files[0].uuid}}}>
                                    <span className={'ms-2 me-2'}>{files[0].sennet_id}</span>
                                </Link>
                            </div>}
                {files && (files.length > 0) && <FileTreeView data={{files, uuid: files[0].uuid}}
                                                              keys={{files: 'files', uuid: 'uuid'}}
                                                              showDownloadAllButton={true}
                                                              showQAButton={false}
                                                              showDataProductButton={false}
                                                              includeDescription={true}
                                                              loadDerived={false}
                                                              treeViewOnly={true}
                                                              filesClassName={'js-files'}
                                                              className={'c-treeView__main--inTable mb-3'} />}
            </SenNetAccordion>
        </>
    )
}

DataProducts.propTypes = {
    children: PropTypes.node
}

export default DataProducts