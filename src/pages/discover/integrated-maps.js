
import React, { useContext, useEffect, useState, useRef } from 'react'
import Spinner from '@/components/custom/Spinner'
import dynamic from "next/dynamic";
import AppContext from "@/context/AppContext"
import { APP_TITLE } from "@/config/config"
import IntegratedMaps from '@/components/custom/organ/IntegratedMaps';

const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

function IntegratedMapsView() {

  const { isRegisterHidden } = useContext(AppContext)


  return (
    <>
      <Header title={APP_TITLE + '| Integrated Maps'} />

      <AppNavbar hidden={isRegisterHidden} />
      <div className="mt-4 mb-5 d-block container-fluid px-5">
        <h1 className='fs-2'>Integrated Maps</h1>
        <p>
          SenNet-wide integrated maps contain consolidated data for all datasets of a particular assay type and tissue, across all datasets, assay variants, and data providers. RNA-seq integrated maps are added as both raw and processed versions: 'raw'
          features gene expression count matrices from the SenNet RNA-seq pipeline, and 'processed' versions are the results of secondary analysis (normalization, filtering, dimensionality reduction, clustering) applied to the raw matrix.
        </p>
        <IntegratedMaps />
      </div>
    </>

  )
}

export default IntegratedMapsView