import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import Spinner from '../Spinner'
import SimpleBarChart from './SimpleBarChart'

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
            by_organ_code: {
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

    function buildOrganChartData(data) {
        // combine buckets that are lateral organs
        const organs = {}
        data?.aggregations?.by_organ_code?.buckets?.forEach((bucket) => {
            const organInfo = getOrganByCode(bucket.key)
            if (!organInfo) {
                return
            }
            if (organs[organInfo.label]) {
                organs[organInfo.label] += bucket.total_cells.value
            } else {
                organs[organInfo.label] = bucket.total_cells.value
            }
        })
        const organList = Object.keys(organs).map((organLabel) => ({
            label: organLabel,
            count: organs[organLabel]
        }))

        // sort by count
        organList.sort((a, b) => b.count - a.count)

        console.log('==== organList', organList)

        return organList
    }

    const { data, loading, error } = useSearchUIQuery('cell-types', query)

    if (loading) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    return (
        <SimpleBarChart
            data={buildOrganChartData(data)}
            xAxisLabel='Organ'
            yAxisLabel='Cell Count'
            ariaLabel={`Bar chart showing distribution of cell type ${clId} across organs.`}
            width={width}
            height={height}
        />
    )
}
