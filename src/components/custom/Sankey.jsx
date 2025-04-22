import {useEffect, useRef, useState} from 'react'
import { useRouter } from 'next/router'
import {getCookie} from "cookies-next";
import { ShimmerThumbnail } from "react-shimmer-effects";
import SenNetAlert from "@/components/SenNetAlert";

function SankeyPage() {

    const router = useRouter()
    const xacSankey = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingMsg, setLoadingMsg] = useState('')
    const [filters, setFilters] = useState(null)
    const [options, setOptions] = useState(null)

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
            styleSheetPath: 'https://rawcdn.githack.com/x-atlas-consortia/data-sankey/1.0.6-b/src/lib/xac-sankey.css',
            api: {
                token: getCookie('groups_token')
            },
            validFilterMap: {
                dataset_type: 'dataset_type_hierarchy',
                source_type: 'dataset_source_type'
            }
        })
    }, [router.isReady, router.query])

    useEffect(()=>{
        // web components needs global window
        import('xac-sankey')

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

    }, [])


    return (
        <div className={'c-sankey'}>
            {filters && options && <react-consortia-sankey ref={xacSankey} options={btoa(JSON.stringify(options))
            } /> }

            {loading && <ShimmerThumbnail className={'mt-5'} rounded />}
            {loadingMsg && <SenNetAlert variant={'warning'} text={loadingMsg}></SenNetAlert>}

        </div>
    )
}

export default SankeyPage
