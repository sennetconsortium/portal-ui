import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {SpinnerEl} from "@/components/custom/Spinner";

function AppSuspense({predicate, children, fallback}) {
    useEffect(() => {
    }, [])
    if (!fallback) {
        fallback = <SpinnerEl />
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