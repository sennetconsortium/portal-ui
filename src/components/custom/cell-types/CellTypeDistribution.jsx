import { getOrganByCode } from '@/config/organs'
import { fetchSearchAPIEntities } from '@/lib/services'
import { useEffect, useState } from 'react'
import BarChart from './BarChart'

/**
 * Displays a bar chart of Organ (x) -> sum(cell_count) (y) for a given CL id.
 *
 * @param {{clId: string, width?: number, height?: number}} props
 */
export default function CellTypeDistribution({ clId, width = 700, height = 320 }) {
    const query = {
        size: 0,
        query: {
            term: {
                'cl_id.keyword': { value: clId }
            }
        },
        aggs: {
            organ_codes: {
                terms: {
                    field: 'organs.code.keyword',
                    size: 100
                },
                aggs: {
                    total_cells: {
                        sum: { field: 'cell_count' }
                    }
                }
            }
        }
    }

    const { data, loading, error } = useSearchUIQuery('cell-types', query)

    if (loading) return <div>Loading chart…</div>
    if (error && error.status === 404) return <div>{error.message}</div>
    if (error) return <div>Error loading chart</div>
    if (!data) return null

    return <BarChart data={data} width={width} height={height} />
}
