import { getOrganByCode } from '@/config/organs'
import { VisualizationsProvider } from '@/context/VisualizationsContext'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { formatNum } from '../js/functions'
import Spinner from '../Spinner'
import ChartContainer from '../visualizations/ChartContainer'
import { useMemo } from 'react'

/**
 * @typedef {object} CellTypeDistributionProps
 * @property {string} clId - The CL ID to query.
 */

/**
 * Displays a bar chart with organs on x-axis and cell counts on y-axis for a given CL id.
 *
 * @param {CellTypeDistributionProps} props
 */
export default function CellTypeDistribution({ clId }) {
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
                    total_cells: { sum: { field: 'cell_count' } },
                    unique_datasets: { cardinality: { field: 'dataset.uuid.keyword' } }
                }
            }
        }
    }

    const { data, loading, error } = useSearchUIQuery('cell-types', query)

    const chartData = useMemo(() => {
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
            value: organs[organLabel]
        }))

        // sort by count
        organList.sort((a, b) => b.value - a.value)

        return organList
    }, [data])

    if (loading) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    const yAxis = { label: 'Cell Count', formatter: formatNum, scaleLog: false, ticks: 3 }
    const xAxis = {
        formatter: formatNum,
        label: 'Organ',
        description: `Bar chart showing distribution of cell type ${clId} across organs.`
    }

    return (
        <VisualizationsProvider>
            <ChartContainer
                data={chartData}
                chartId={'cellTypeDistribution'}
                xAxis={xAxis}
                yAxis={yAxis}
                chartType={'bar'}
            />
        </VisualizationsProvider>
    )
}
