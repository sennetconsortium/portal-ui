import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {SpinnerEl} from "@/components/custom/Spinner";
import { ShimmerText } from "react-shimmer-effects"

function AppSuspense({predicate, children, fallback}) {
    useEffect(() => {
    }, [])
    if (!fallback) {
        fallback = <ShimmerText line={5} gap={10} />
    }

    if (!predicate) {
        return fallback
    }

    return children
}



AppSuspense.propTypes = {
    children: PropTypes.node
}

export default AppSuspense