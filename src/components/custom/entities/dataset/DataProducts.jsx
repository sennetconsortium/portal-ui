import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import {datasetIs} from "../../js/functions";
import FileTreeView from "./FileTreeView";
import Link from "next/link";
import SenNetPopover from "@/components/SenNetPopover";
import DerivedContext from "@/context/DerivedContext";

function DataProducts({files, data}) {

    const {
        derivedNotLatestVersion
    } = useContext(DerivedContext)

    return (
        <>
            {datasetIs.primary(data.creation_action) &&
                <div className={'row'}>
                    <div className={'col m-2'}>
                        {derivedNotLatestVersion &&
                            <SenNetPopover
                                text={
                                    <span>This information comes from a more recent derived dataset that is not <code>Published</code>.</span>}
                                className={`derivedNotLatest-fileTreeView}`}>
                                <i className="bi text-danger bi-exclamation-circle-fill"></i>
                            </SenNetPopover>
                        }
                        <span className={'fw-light fs-6 mb-2'}> Files from descendant
                <Link target="_blank" href={{pathname: '/dataset', query: {uuid: files[0].uuid}}}>
                    <span
                        className={'ms-2 me-2 icon-inline'}>{`${files[0].display_subtype} ${files[0].sennet_id}`}</span>
                </Link>
            </span>
                    </div>
                </div>
            }
            {files && (files.length > 0) && <FileTreeView data={{files, uuid: files[0].uuid}}
                                                          keys={{files: 'files', uuid: 'uuid'}}
                                                          showDownloadAllButton={true}
                                                          showQAButton={false}
                                                          showDataProductButton={false}
                                                          includeDescription={true}
                                                          loadDerived={false}
                                                          treeViewOnly={true}
                                                          filesClassName={'js-files'}
                                                          className={'c-treeView__main--inTable mb-3'}/>}
        </>
    )
}

DataProducts.propTypes = {
    children: PropTypes.node
}

export default DataProducts