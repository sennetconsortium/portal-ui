import dynamic from "next/dynamic";
import React, { useContext } from 'react';
import AppContext from "@/context/AppContext";
import { FileTransfersProvider } from "@/context/FileTransfersContext";

const AppFooter = dynamic(() => import("@/components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("@/components/custom/layout/AppNavbar"))
const BulkTransfer = dynamic(() => import("@/components/custom/bulk/BulkTransfer"))
const Header = dynamic(() => import("@/components/custom/layout/Header"))
const Spinner = dynamic(() => import("@/components/custom/Spinner"))
const Unauthorized = dynamic(() => import("@/components/custom/layout/Unauthorized"))

export default function EditBulk() {
  const { isAuthorizing, isUnauthorized, } = useContext(AppContext)




  if (isAuthorizing() || isUnauthorized()) {
    return (
      isUnauthorized() ? <Unauthorized /> : <Spinner />
    )
  }

  return (<>
    <Header
      title={`Transfers | SenNet`}></Header>

    <AppNavbar />
    <BulkTransfer
     
    />
    <AppFooter />
  </>)
}

EditBulk.withWrapper = function (page) {
  return <FileTransfersProvider>{page}</FileTransfersProvider>
}
