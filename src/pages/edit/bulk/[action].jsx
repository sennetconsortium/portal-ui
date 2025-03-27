import dynamic from "next/dynamic";
import React, {useContext} from 'react';
import {useRouter} from 'next/router'
import EntityContext, {EntityProvider} from "@/context/EntityContext";
import AppContext from "@/context/AppContext";
import {eq} from "@/components/custom/js/functions";
import {JobQueueProvider} from "@/context/JobQueueContext";

const AppFooter = dynamic(() => import("../../../components/custom/layout/AppFooter"))
const AppNavbar = dynamic(() => import("../../../components/custom/layout/AppNavbar"))
const BulkCreate = dynamic(() => import("../../../components/custom/bulk/BulkCreate"))
const Header = dynamic(() => import("../../../components/custom/layout/Header"))
const NotFound = dynamic(() => import("../../../components/custom/NotFound"))
const Spinner = dynamic(() => import("../../../components/custom/Spinner"))
const Unauthorized = dynamic(() => import("../../../components/custom/layout/Unauthorized"))

export default function EditBulk() {
    const {cache} = useContext(AppContext)

    const {
        isUnauthorized,
        isAuthorizing,
        userWriteGroups,
    } = useContext(EntityContext)

    const router = useRouter()
    let entityType = router.query['entityType']
    entityType = cache.entities[entityType?.toLowerCase()]
    let subType = router.query['category']
    const isMetadata = router.query['action'] === 'metadata'
    let result

    if (eq(entityType, cache.entities.dataset)) {
        window.location = '/edit/upload?uuid=register'
    }

    if (isAuthorizing() || isUnauthorized()) {
        return (
            isUnauthorized() ? <Unauthorized/> : <Spinner/>
        )
    } else {
        if (subType) {
            //ensure formatting
            subType = subType.toLowerCase()
            subType = subType.upperCaseFirst()
        }

        let supportedEntities = Object.values(cache.entities)
        const isSupported = () => {
            console.log('DETAILS', entityType, subType)
            if (isMetadata) {
                return true
            } else {
                return (supportedEntities.includes(entityType))
            }
        }
        if (isSupported()) {
            result = <>
                <Header
                    title={`Bulk Register ${isMetadata ? `Metadata` : entityType.upperCaseFirst()} | SenNet`}></Header>

                <AppNavbar/>
                <BulkCreate
                    entityDetails={{entityType, subType}}
                    userWriteGroups={userWriteGroups}
                    isMetadata={isMetadata}
                />
                <AppFooter/>
            </>
        } else {
            return (<NotFound/>)
        }
    }


    return (result)
}

EditBulk.withWrapper = function (page) {
    return <EntityProvider><JobQueueProvider>{page}</JobQueueProvider></EntityProvider>
}

