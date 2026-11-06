import React from 'react'
import { Skeleton } from '@mui/material'

const ToolbarSkeleton = () => (
    <div className='d-flex justify-content-end mb-4'>
        {/* "Download Files with SenNet CLT" button */}
        <Skeleton variant='rounded' width={280} height={38} />
    </div>
)

export default ToolbarSkeleton
