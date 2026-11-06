import React from 'react'
import { Skeleton } from '@mui/material'

const TableSkeleton = ({ rows, columns }) => {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: '1rem',
        alignItems: 'center',
        padding: '0 1rem'
    }

    return (
        <div>
            {/* Header row */}
            <div style={{ ...gridStyle, height: 48, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                {Array.from({ length: columns }).map((_, c) => (
                    <Skeleton key={c} variant='text' width='50%' height={20} />
                ))}
            </div>

            {/* Body rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={r}
                    style={{ ...gridStyle, height: 48, borderBottom: '1px solid rgba(0,0,0,0.12)' }}
                >
                    {Array.from({ length: columns }).map((_, c) => (
                        <Skeleton key={c} variant='text' width='70%' height={22} />
                    ))}
                </div>
            ))}

            {/* Pagination footer */}
            <div className='d-flex justify-content-end align-items-center gap-3 pt-3'>
                <Skeleton variant='text' width={100} height={20} />
                <Skeleton variant='rounded' width={56} height={30} />
                <Skeleton variant='text' width={50} height={20} />
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton variant='circular' width={20} height={20} />
            </div>
        </div>
    )
}

export default TableSkeleton
