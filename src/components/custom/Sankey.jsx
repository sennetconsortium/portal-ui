import {useEffect, useRef, useState} from 'react'
import Spinner from "@/components/custom/Spinner"
import {eq} from "@/components/custom/js/functions";

function SankeyPage() {

    const xacSankey = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingMsg, setLoadingMsg] = useState('')

    const handleLoading = (ctx, msg) => {
        setLoading(msg ? true : ctx.isLoading)
        setLoadingMsg(msg)
    }

    const setSankeyOptions = ()=> {
        if (xacSankey.current && xacSankey.current.setOptions) {
            const el = xacSankey.current
            const adapter = new SenNetAdapter(el)
            el.setOptions({
                loading: {
                    callback: handleLoading
                },
                onDataBuildCallback: () => adapter.onDataBuildCallback(),
                onNodeBuildCssCallback: (d) => {
                    if (eq(d.columnName, el.validFilterMap.dataset_type)) {
                        const assay = adapter.captureByKeysValue({matchKey: d.columnName, matchValue: d.name, keepKey: 'dataset_type_description'}, el.rawData)
                        return assay.length <= 0 ? 'c-sankey__node--default' : ''
                    }
                    return ''
                },
                onNodeClickCallback: (e, d) => adapter.goTo(d),
                onLabelClickCallback: (e, d) => adapter.goTo(d)
            })
        }
    }

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
            <react-consortia-sankey ref={xacSankey} options={btoa(JSON.stringify({
                useShadow: true,
                styleSheetPath: '/css/xac-sankey.css?v='+(new Date()).getMilliseconds(),
                validFilterMap: {
                    dataset_type: 'dataset_type_hierarchy',
                    source_type: 'dataset_source_type'
                }
            }))
            } />
            {loading && <Spinner tip={loadingMsg} />}

        </div>
    )
}

export default SankeyPage
