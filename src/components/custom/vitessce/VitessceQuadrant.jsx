import React, {useContext, useEffect, useState} from 'react'
import DerivedContext from "@/context/DerivedContext";
import SenNetSuspense from "@/components/SenNetSuspense";
import {ShimmerText, ShimmerThumbnail} from "react-shimmer-effects";
import dynamic from "next/dynamic";
import AncestorsModal from "@/components/custom/edit/dataset/AncestorsModal";
import {DescendantInfo} from "@/components/custom/vitessce/SenNetVitessce";
import ClipboardCopy from "@/components/ClipboardCopy";

const SenNetVitessce = dynamic(() => import("@/components/custom/vitessce/SenNetVitessce"))

function VitessceQuadrant({data, setQ, fetchData, resultsFilterCallback}) {
    const {
        showVitessce,
        initVitessceConfig,
        isPrimaryDataset,
        derivedDataset,
    } = useContext(DerivedContext)

    useEffect(() => {
        initVitessceConfig(data)
    }, [])

    const [showHideModal, setShowHideModal] = useState(false)

    const handleSearchFormSubmit = (event, onSubmit) => {
        onSubmit(event)
    }

    const changeAncestor = async (e, ancestorId) => {
        fetchData(ancestorId, setQ, hideModal)
    }

    const hideModal = () => {
        setShowHideModal(false)
    }

    return (
        <div>
            {/* Vitessce */}
            <SenNetSuspense showChildren={showVitessce}
                                               suspenseElements={<>
                                                   <ShimmerText line={3} gap={10} />
                                                   <ShimmerThumbnail height={700} className={'mt-2'} rounded />
                                               </>}
                                               id={'viz-'+ data.uuid} title={data.sennet_id}
                                               style={{ height:'800px' }}>
                <SenNetVitessce showDescendantInfo={false} showPoweredInfo={false} id={'viz-'+ data.uuid} title={
                    <div className={'c-compare__quadrantTitle'}>

                        <span className='pt-1 d-block'>
                            <span>{data.sennet_id}</span>
                            <i className="bi bi-pencil mx-2" aria-label={`Modify Dataset ${data.sennet_id}`} onClick={()=>setShowHideModal(true)}></i>
                        </span>

                        <DescendantInfo isPrimaryDataset={isPrimaryDataset} derivedDataset={derivedDataset} wrapClassNames={''} />
                    </div>} data={data}/>
            </SenNetSuspense>
            <AncestorsModal resultsFilterCallback={resultsFilterCallback} data={[]} hideModal={hideModal} changeAncestor={changeAncestor} showHideModal={showHideModal} handleSearchFormSubmit={handleSearchFormSubmit} />
        </div>

    )
}


export default VitessceQuadrant