import React from 'react'
import { Skeleton } from '@mui/material'

const TabsSkeleton = ({ tabCount }) => (
    <div className='d-flex gap-3 mb-4'>
        {Array.from({ length: tabCount }).map((_, i) => (
            <Skeleton key={i} variant='rectangular' width={i === 0 ? 130 : 128} height={40} />
        ))}
    </div>
)

export default TabsSkeleton
