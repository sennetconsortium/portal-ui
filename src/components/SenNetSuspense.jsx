import {useEffect} from 'react'
import PropTypes from 'prop-types'
import {ShimmerThumbnail} from "react-shimmer-effects";
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";

function SenNetSuspense({children, showChildren,  suspenseElements, id, title, style}) {
    useEffect(() => {
    }, [])

    if (showChildren) {
        return children
    }

    return (
        <LoadingAccordion id={id} title={title} style={style}>
            {!suspenseElements && <ShimmerThumbnail className={'mt-5'} rounded />}
            {suspenseElements}
        </LoadingAccordion>
    )
}

SenNetSuspense.propTypes = {
    children: PropTypes.node
}

export default SenNetSuspense