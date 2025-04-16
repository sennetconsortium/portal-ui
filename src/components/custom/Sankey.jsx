import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'

function Sankey({children}) {
    useEffect(() => {
    }, [])

    return (
        <div className={`c-Sankey`}>{children}</div>
    )
}

Sankey.propTypes = {
    children: PropTypes.node
}

export default Sankey