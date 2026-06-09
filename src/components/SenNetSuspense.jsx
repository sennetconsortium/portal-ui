import React from 'react';
import PropTypes from 'prop-types'
import LoadingAccordion from "@/components/custom/layout/LoadingAccordion";
import { Skeleton } from '@mui/material';

function SenNetSuspense({children, showChildren,  suspenseElements, id, title, style}) {

    if (showChildren) {
        return children
    }

    return (
        <LoadingAccordion id={id} title={title} style={style}>
            {!suspenseElements &&  <Skeleton variant="rounded" className={'mt-5'} height={250} />}
            {suspenseElements}
        </LoadingAccordion>
    )
}

SenNetSuspense.propTypes = {
    children: PropTypes.node,
    showChildren: PropTypes.bool,
    suspenseElements: PropTypes.node,
    id: PropTypes.string,
    title: PropTypes.string,
    style: PropTypes.object
}

export default SenNetSuspense