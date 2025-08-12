import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import DerivedContext from "@/context/DerivedContext";
import SenNetSuspense from "@/components/SenNetSuspense";
import {ShimmerText, ShimmerThumbnail} from "react-shimmer-effects";
import dynamic from "next/dynamic";

const SennetVitessce = dynamic(() => import("@/components/custom/vitessce/SennetVitessce"))

function VitessceQuadrant({data, children}) {
    const {
        showVitessce,
        initVitessceConfig
    } = useContext(DerivedContext)

    useEffect(() => {
        initVitessceConfig(data)
    }, [])

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
                <SennetVitessce id={'viz-'+ data.uuid} title={data.sennet_id} data={data}/>
            </SenNetSuspense>
        </div>

    )
}


VitessceQuadrant.propTypes = {
    children: PropTypes.node
}




export default VitessceQuadrant