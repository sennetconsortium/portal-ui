import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'

function SenNetStats({children}) {
    useEffect(() => {
    }, [])

    return (
        <div className={`c-SenNetStats`}>{children}</div>
    )
}

SenNetStats.propTypes = {
    children: PropTypes.node
}

export default SenNetStats