import {useEffect} from 'react'
import PropTypes from 'prop-types'
import {ShimmerThumbnail} from "react-shimmer-effects";

function SenNetSuspense({children, showChildren}) {
    useEffect(() => {
    }, [])

    if (showChildren) {
        return children
    }

    return (
        <div className={`c-SenNetSuspense`}><ShimmerThumbnail className={'mt-5'} rounded /></div>
    )
}

SenNetSuspense.propTypes = {
    children: PropTypes.node
}

export default SenNetSuspense