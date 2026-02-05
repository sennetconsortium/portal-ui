import { VisualizationsProvider } from '@/context/VisualizationsContext'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useMemo } from 'react'
import Spinner from '../Spinner'
import ChartContainer from '../visualizations/ChartContainer'

function DatasetsOverview() {
    const query = {
        size: 0,
        aggs: {
            by_sex: {
                terms: {
                    field: 'dataset.sex.keyword',
                    size: 100
                },
                aggs: {
                    age_ranges: {
                        range: {
                            field: 'dataset.age',
                            ranges: [
                                { key: '0-10', from: 0, to: 10 },
                                { key: '10-20', from: 10, to: 20 },
                                { key: '20-30', from: 20, to: 30 },
                                { key: '30-40', from: 30, to: 40 },
                                { key: '40-50', from: 40, to: 50 },
                                { key: '50-60', from: 50, to: 60 },
                                { key: '60-70', from: 60, to: 70 },
                                { key: '70-80', from: 70, to: 80 },
                                { key: '80-90', from: 80, to: 90 },
                                { key: '90+', from: 90 }
                            ]
                        },
                        aggs: {
                            unique_datasets: {
                                cardinality: {
                                    field: 'dataset.uuid.keyword'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const { data, loading, error } = useSearchUIQuery('cell-types', query)

    const chartData = useMemo(() => {
        if (!data) {
            return null
        }

        const buckets = data?.aggregations?.by_sex?.buckets
        const labels = {}
        const groups = [
            { group: '0-10' },
            { group: '10-20' },
            { group: '20-30' },
            { group: '30-40' },
            { group: '40-50' },
            { group: '50-60' },
            { group: '60-70' },
            { group: '70-80' },
            { group: '80-90' },
            { group: '90+' }
        ]
        for (const bucket of buckets) {
            const sex = bucket.key
            labels[sex] = sex.charAt(0).toUpperCase() + sex.slice(1)
            for (const ageRange of bucket.age_ranges.buckets) {
                const idx = groups.findIndex((g) => g.group === ageRange.key)
                if (idx !== -1) {
                    groups[idx][sex] = ageRange.unique_datasets.value
                }
            }
        }

        return {
            labels: labels,
            groups: groups
        }
    }, [data])

    if (loading) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    const yAxis = { label: 'Datasets' }
    const xAxis = { label: 'Age' }

    return (
        <VisualizationsProvider>
            <ChartContainer
                chartType='groupedBar'
                data={chartData.groups}
                subGroupLabels={chartData.labels}
                xAxis={xAxis}
                yAxis={yAxis}
            />
        </VisualizationsProvider>
    )
}

export default DatasetsOverview
