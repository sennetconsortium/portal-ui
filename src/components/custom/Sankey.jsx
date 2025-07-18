import {useEffect, useRef, useState} from 'react'
import { useRouter } from 'next/router'
import {getCookie} from "cookies-next";
import { ShimmerThumbnail } from "react-shimmer-effects";
import SenNetAlert from "@/components/SenNetAlert";

/**
 *
 * @param {int} maxHeight - A max height to set on the diagram; leave null to use client height
 * @param {boolean} showExpandButton - whether to show outgoing expand button
 * @returns {JSX.Element}
 * @constructor
 */
function Sankey({maxHeight, showExpandButton = false}) {

    const router = useRouter()
    const xacSankey = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingMsg, setLoadingMsg] = useState('')
    const [filters, setFilters] = useState(null)
    const [options, setOptions] = useState(null)
    const [sankeyHeight, setSankeyHeight] = useState(maxHeight)

    const handleLoading = (ctx, msg) => {
        setLoading(msg ? true : ctx.isLoading)
        setLoadingMsg(msg)
    }

    const setSankeyOptions = ()=> {
        if (xacSankey.current && xacSankey.current.setOptions) {
            const el = xacSankey.current
            const adapter = new SenNetAdapter(el)
            el.setOptions({
                ...options,
                loading: {
                    callback: handleLoading
                },
                onDataBuildCallback: () => adapter.onDataBuildCallback(),
                onNodeBuildCssCallback: (d) => {
                    return adapter.onNodeBuildCssCallback(d)
                },
                onLinkBuildCssCallback: (d) => {
                    return adapter.onLinkBuildCssCallback(d)
                },
                onLinkClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromLink(d)
                },
                onNodeClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromNode(d)
                },
                onLabelClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromNode(d)
                }
            })
        }
    }

    useEffect(() => {
        if (!router.isReady) return
        setFilters(router.query)
        setOptions({
            useShadow: true,
            styleSheetPath: 'https://rawcdn.githack.com/x-atlas-consortia/data-sankey/1.0.15/src/lib/xac-sankey.css',
            api: {
                token: getCookie('groups_token')
            },
            displayableFilterMap: {
                status: null
            },
            validFilterMap: {
                dataset_type: 'dataset_type_hierarchy',
                source_type: 'dataset_source_type'
            }
        })
    }, [router.isReady, router.query])

    useEffect(()=>{
        // web components needs global window
        import('xac-sankey').then(() => {
            // the only way to pass objects is via a functional call to the exposed shadow dom
            // must observe that this web component el is ready in DOM before calling the method
            const targetNode = document.getElementById("__next")
            const config = {  attributes: true, childList: true, subtree: true }

            const callback = (mutationList, observer) => {
                if (xacSankey.current && xacSankey.current.setOptions) {
                    // it's ready
                    setSankeyOptions()
                    observer.disconnect()
                }
            }

            const observer = new MutationObserver(callback)
            observer.observe(targetNode, config)
        })

        if (!maxHeight) {
            setSankeyHeight(window.innerHeight - 70)
        }

    }, [])


    return (
        <div className={'c-sankey'}>
            {showExpandButton && <a href={'/sankey'} className={'c-sankey__btn btn btn-outline-primary icon-inline'}><span>Expand</span> <i className="bi bi-arrows-angle-expand"></i></a>}
            {filters && options && <react-consortia-sankey ref={xacSankey} options={btoa(JSON.stringify({...options, dimensions: {
                    desktopMaxHeight: sankeyHeight
                } }))
            } /> }

            {loading && <ShimmerThumbnail className={'mt-5'} rounded />}
            {loadingMsg && <SenNetAlert variant={'warning'} text={loadingMsg}></SenNetAlert>}
        </div>
    )
}

export default Sankey
