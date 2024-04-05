import React, {useContext} from 'react';
import BulkCreate from "../../../components/custom/bulk/BulkCreate";
import AppNavbar from "../../../components/custom/layout/AppNavbar";
import Unauthorized from "../../../components/custom/layout/Unauthorized";
import {useRouter} from 'next/router'
import EntityContext, {EntityProvider} from "../../../context/EntityContext";
import Spinner from "../../../components/custom/Spinner";
import AppContext from "../../../context/AppContext";
import NotFound from "../../../components/custom/NotFound";
import AppFooter from "../../../components/custom/layout/AppFooter";
import {eq} from "../../../components/custom/js/functions";
import {JobQueueProvider} from "../../../context/JobQueueContext";

export default function EditBulk() {
    const {cache, supportedMetadata} = useContext(AppContext)

    const {
        isUnauthorized,
        isAuthorizing,
        userWriteGroups,
        handleHome
    } = useContext(EntityContext)

    const router = useRouter()
    let entityType = router.query['entityType']
    entityType = entityType.toLowerCase()
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

        let supportedEntities = Object.keys(cache.entities)
        const isSupported = () => {
            if (isMetadata) {
                let supp = supportedMetadata()[cache.entities[entityType]]
                return supp ? supp.categories.includes(subType) : false
            } else {
                return (supportedEntities.includes(entityType))
            }
        }
        if (isSupported()) {
            result = <>
                <AppNavbar/>
                <BulkCreate
                    entity={entityType}
                    sub={subType}
                    userWriteGroups={userWriteGroups}
                    handleHome={handleHome}
                    forMetadata={isMetadata}
                />
                <AppFooter />
            </>
        } else {
            return (<NotFound />)
        }
    }


    return (result)
}

EditBulk.withWrapper = function (page) {
    return <EntityProvider><JobQueueProvider>{page}</JobQueueProvider></EntityProvider>
}

