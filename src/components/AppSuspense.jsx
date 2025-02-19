import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {ShimmerTable, ShimmerText, ShimmerTitle} from "react-shimmer-effects"

/**
 *
 * @param predicate - a condition to check against
 * @param children - a component to show once predicate evals to true
 * @param fallback - a component to show while predicate does not eval to true
 * @param fallbackBuilder - a list of obj describing how to build the fallback component
 * @param className
 * @returns {*|JSX.Element}
 * @constructor
 */
function AppSuspense({predicate, children, fallback, fallbackBuilder = [], className = null}) {
    const defaultFallback = (
        <div className={`sui-result p-4 mb-3 ${className}`}>
            <ShimmerTitle line={2} gap={10} variant="secondary"/>
            <ShimmerText line={3} gap={10}/>
        </div>
    )
    const [builtFallback, setBuiltFallback] = useState(defaultFallback)

    const buildFallback = () => {
        let result = []
        let x = 0
        for (let f of fallbackBuilder) {
            if (f.comp === 'text') {
                result.push(<ShimmerText key={x} line={f.line} gap={f.gap} className={f.class} />)
            } else if (f.comp === 'title') {
                result.push(<ShimmerTitle key={x} line={f.line} gap={f.gap} variant={f.variant || "secondary"} />)
            } else if (f.comp === 'table') {
                result.push(<ShimmerTable key={x} row={f.row} col={f.col}/>)
            }
            x++
        }
        setBuiltFallback(<div className={className || 'sui-result p-4 mb-3'}>{result}</div>)
    }

    useEffect(() => {
        if (fallbackBuilder) {
            buildFallback()
        }
    }, [])

    if (!fallback && (!fallbackBuilder || !fallbackBuilder.length)) {
        fallback = defaultFallback
    }

    if (!predicate && fallback) {
        return fallback
    }

    if (!predicate) {
        return builtFallback
    }

    return children
}



AppSuspense.propTypes = {
    children: PropTypes.node
}

export default AppSuspense