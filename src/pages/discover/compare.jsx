import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react"
import {APP_TITLE} from "@/config/config"
import AppContext from "@/context/AppContext"
import { useRouter } from 'next/router'
import {getAncestryData, getEntityData} from "@/lib/services";
import {eq} from "@/components/custom/js/functions";
import VitessceQuadrant from "@/components/custom/vitessce/VitessceQuadrant";
import {DerivedProvider} from "@/context/DerivedContext";
import AddQuadrant from "@/components/custom/vitessce/AddQuadrant";

const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

function ViewCompare() {
    const {logout, isRegisterHidden, isAuthorizing, isUnauthorized, hasAuthenticationCookie} = useContext(AppContext)
    const router = useRouter()
    const [q1, setQ1] = useState(null)
    const [q2, setQ2] = useState(null)
    const [q3, setQ3] = useState(null)
    const [q4, setQ4] = useState(null)
    const [loadSortable, setLoadSortable] = useState(false)
    const [datasetType, setDatasetType] = useState(null)


    const resultsFilterCallback = (_config, {addFilter, setStateProps}) => {
        addFilter('entity_type', 'Dataset')
        addFilter('has_visualization', 'True')
        let typeDisabled = false
        if (datasetType) {
            addFilter('dataset_type', datasetType)
            typeDisabled = true
        }
        setStateProps({
            'entity_type.keyword': {'disabled': true},
            'has_visualization.keyword': {'disabled': true},
            'dataset_type_hierarchy.first_level.keyword': {'disabled': typeDisabled},
            'dataset_type_hierarchy.second_level.keyword': {'disabled': typeDisabled},
        })

        setTimeout(()=> {
            $('.sui-facet__HasVisualization input').attr('disabled', true)
        }, 2000)

        if (!_config) return

        _config['searchQuery']['includeFilters'] = _config['searchQuery']['includeFilters'] || []
        _config['searchQuery']['includeFilters']?.push({
            'type': 'term',
            'field': 'entity_type.keyword',
            'values': ['Dataset']
        })

    }

    const fetchData = async (uuid, stateFn, cb) => {
        const _data = await getEntityData(uuid, ['ancestors', 'descendants'])
        let hasViz = eq(_data.has_visualization, 'true')

        if (!_data.error) {
            getAncestryData(_data.uuid).then(ancestry => {
                if (!hasViz) {
                    // Primary gets processed and updated to QA but the derived dataset is still processed.
                    // This could lead to a scenario where the primary has the property has_visualization: false but the processed is true.
                    // So let's check that a descendant has_visualization: true
                    for (const descendant of ancestry?.descendants) {
                        if (eq(descendant.has_visualization, 'true')) {
                            hasViz = true
                            break;
                        }
                    }
                }
                if (hasViz) {
                    Object.assign(_data, ancestry)
                    stateFn(_data)
                    setDatasetType(_data.dataset_type)
                }
                if (cb) {
                    // a callback to load sortable or close modal
                    cb({current: _data, q1, q2, q3, q4})
                }
            })
        }
    }

    const loadQ = (i, n, uuids, stateFn) => {
        const uuid = uuids[i]
        if (!uuid || !stateFn) return
        const cb = () => {
            if (i === (n-1)) {
                setLoadSortable(true)
            }
        }
        fetchData(uuid, stateFn, cb)

    }

    const getQuadrants = () => {
        let res = []
        const states = [setQ1, setQ2, setQ3, setQ4]
        const vals = [q1, q2, q3, q4]
        let i = 0;
        for (let q of vals) {
            res.push(
                <div key={`q-${i}`} className={'c-compare__quadrant col col-6'}>
                    <div className={'c-compare__sortableHead'}></div>
                    {q && <DerivedProvider><VitessceQuadrant resultsFilterCallback={resultsFilterCallback} setQ={states[i]} data={q} fetchData={fetchData} /></DerivedProvider>}
                    {!q && <AddQuadrant resultsFilterCallback={resultsFilterCallback} qId={i} setQ={states[i]} fetchData={fetchData} />}
                </div>
            )
            i++
        }
        return res
    }

    useEffect(() => {
        if (!router.isReady) return
        let uuids = router.query.uuids?.split(',') || []
        const n = uuids.length
        const states = [setQ1, setQ2, setQ3, setQ4]
        for (let i = 0; i < n; i++) {
            loadQ(i, n, uuids, states[i])
        }
    }, [router.isReady, router.query])

    useEffect(()=> {
        if (loadSortable) {
            $( "#sortable" ).sortable()
        }
    }, [loadSortable])

    const clearSelections = () => {
        const states = [setQ1, setQ2, setQ3, setQ4]
        for (let s of states) {
            s(null)
        }
        setDatasetType(null)
        const query = '?clear=true'
        window.history.pushState(null, null, query)
        router.replace(location.href + query, { scroll: false })
    }

    if (isAuthorizing()) {
        return <Spinner/>
    } else {
        if (isUnauthorized() && hasAuthenticationCookie()) {
            // This is a scenario in which the GLOBUS token is expired but the token still exists in the user's cookies
            logout()
            window.location.reload()
        }
        return (
            <>
                <Header title={APP_TITLE}/>

                <AppNavbar hidden={isRegisterHidden}/>
                <div className="mb-5 container-fluid">
                    <div className={'mx-3 mt-4'}>
                        <h3>Datasets Comparison {datasetType && <span className={'badge badge-secondary'}>{datasetType}</span>}</h3>
                        {(q1 || q2 || q3 || q4) && <button onClick={clearSelections} className='btn btn-outline-primary rounded-0'>Reset selections &nbsp;<i
                            className="bi bi-x-circle"></i></button>}
                    </div>
                    {/*<DataTable  columns={} data={} />*/}
                    <div id="sortable" className={'c-compare row m-0'}>
                        {getQuadrants()}

                    </div>
                </div>
            </>
        )
    }
}



export default ViewCompare
