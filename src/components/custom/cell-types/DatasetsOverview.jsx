import Spinner from '@/components/custom/Spinner'
import { getCellTypesIndex } from '@/config/config'
import { VisualizationsProvider } from '@/context/VisualizationsContext'
import { fetchSearchAPIEntities } from '@/lib/services'
import { Object } from 'core-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'react-bootstrap'
import ChartContainer from '../visualizations/ChartContainer'
import VizLegend from '../visualizations/VizLegend'

const ageBins = [
    {
        key: '0-10',
        from: 0,
        to: 10
    },
    {
        key: '10-20',
        from: 10,
        to: 20
    },
    {
        key: '20-30',
        from: 20,
        to: 30
    },
    {
        key: '30-40',
        from: 30,
        to: 40
    },
    {
        key: '40-50',
        from: 40,
        to: 50
    },
    {
        key: '50-60',
        from: 50,
        to: 60
    },
    {
        key: '60-70',
        from: 60,
        to: 70
    },
    {
        key: '70-80',
        from: 70,
        to: 80
    },
    {
        key: '80-90',
        from: 80,
        to: 90
    },
    {
        key: '90+',
        from: 90
    }
]

const fieldMap = {
    age: 'dataset.age',
    race: 'dataset.race.keyword',
    sex: 'dataset.sex.keyword',
    organ: 'organs.term.keyword'
}

const yAxisMap = {
    datasets: 'dataset.uuid.keyword',
    sources: 'source_uuids.keyword'
}

function DatasetsOverview({ clId }) {
    const [data, setData] = useState(null)
    const [counts, setCounts] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState()
    const [selectedXAxis, setSelectedXAxis] = useState('age')
    const [selectedYAxis, setSelectedYAxis] = useState('datasets')
    const [selectedCompareBy, setSelectedCompareBy] = useState('sex')
    const [legend, setLegend] = useState({})

    const titalize = useCallback((str) => {
        if (!str) {
            return ''
        }
        if (typeof str === 'number') {
            return str.toString()
        }
        return str.charAt(0).toUpperCase() + str.slice(1)
    }, [])

    useEffect(() => {
        if (!clId || !selectedXAxis || !selectedYAxis || !selectedCompareBy) {
            return
        }

        const fetchData = async () => {
            setLoading(true)
            const query = {
                size: 0,
                query: {
                    term: {
                        'cl_id.keyword': {
                            value: clId
                        }
                    }
                },
                aggs: {
                    dataset_count: {
                        cardinality: {
                            field: 'dataset.uuid.keyword'
                        }
                    },
                    source_count: {
                        cardinality: {
                            field: 'source_uuids.keyword'
                        }
                    },
                    compare_by: {
                        aggs: {
                            x_axis: {
                                aggs: {
                                    count: {
                                        cardinality: {
                                            field: yAxisMap[selectedYAxis]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Set compare by
            if (selectedCompareBy === 'age') {
                query['aggs']['compare_by']['range'] = {
                    field: fieldMap[selectedCompareBy],
                    ranges: ageBins
                }
            } else {
                query['aggs']['compare_by']['terms'] = {
                    field: fieldMap[selectedCompareBy],
                    size: 100
                }
            }

            // Set x-axis
            if (selectedXAxis === 'age') {
                query['aggs']['compare_by']['aggs']['x_axis']['range'] = {
                    field: fieldMap[selectedXAxis],
                    ranges: ageBins
                }
            } else {
                query['aggs']['compare_by']['aggs']['x_axis']['terms'] = {
                    field: fieldMap[selectedXAxis],
                    size: 100
                }
            }

            try {
                const res = await fetchSearchAPIEntities(query, getCellTypesIndex())
                setData(res)
                setCounts({
                    datasets: res.aggregations.dataset_count.value,
                    sources: res.aggregations.source_count.value
                })
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [clId, selectedXAxis, selectedYAxis, selectedCompareBy])

    const chartData = useMemo(() => {
        if (!data) {
            return null
        }

        const buckets = data?.aggregations?.compare_by?.buckets
        const labels = {}
        const groups = []

        for (const bucket of buckets) {
            const key = bucket.key
            labels[key] = titalize(key)
            for (const xbucket of bucket['x_axis'].buckets) {
                let idx = groups.findIndex((group) => group.group === xbucket.key)
                if (idx === -1) {
                    groups.push({ group: xbucket.key })
                    idx = groups.length - 1
                }
                groups[idx][key] = xbucket.count.value
            }
        }

        return {
            labels: labels,
            groups: groups
        }
    }, [data, titalize])

    // initial load
    if (loading && !data) {
        return <Spinner />
    }

    // error on initial load
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    return (
        <VisualizationsProvider>
            <div className='d-flex flex-row gap-4 flex-wrap'>
                <Form.Group>
                    <Form.Label>X-Axis</Form.Label>
                    <Form.Select
                        aria-label='X-Axis select'
                        className='w-auto'
                        value={selectedXAxis}
                        onChange={(e) => setSelectedXAxis(e.target.value)}
                    >
                        {Object.keys(fieldMap)
                            .filter((key) => key !== selectedCompareBy)
                            .map((key) => (
                                <option key={key} value={key}>
                                    {titalize(key)}
                                </option>
                            ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Y-Axis</Form.Label>
                    <Form.Select
                        aria-label='Y-Axis select'
                        className='w-auto'
                        value={selectedYAxis}
                        onChange={(e) => setSelectedYAxis(e.target.value)}
                    >
                        {Object.keys(yAxisMap).map((key) => (
                            <option key={key} value={key}>
                                {`${titalize(key)} (${counts[key]})`}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Compare By</Form.Label>
                    <Form.Select
                        aria-label='Compare By select'
                        className='w-auto'
                        value={selectedCompareBy}
                        onChange={(e) => setSelectedCompareBy(e.target.value)}
                    >
                        {Object.keys(fieldMap)
                            .filter((key) => key !== selectedXAxis)
                            .map((key) => (
                                <option key={key} value={key}>
                                    {titalize(key)}
                                </option>
                            ))}
                    </Form.Select>
                </Form.Group>
            </div>

            {!loading ? (
                <div className='d-flex flex-row w-100'>
                    <ChartContainer
                        chartType='groupedBar'
                        containerClassName='flex-grow-1 mt-4'
                        data={chartData.groups}
                        setLegend={setLegend}
                        subGroupLabels={chartData.labels}
                        xAxis={{
                            label: titalize(selectedXAxis)
                        }}
                        yAxis={{
                            label: titalize(selectedYAxis),
                            formatter: ({ y, maxY }) => (y % 1 === 0 ? y : '')
                        }}
                    />
                    <VizLegend
                        legend={legend}
                        legendToolTip={null}
                        title={`${titalize(selectedYAxis)} (${counts[selectedYAxis]} total)`}
                    />
                </div>
            ) : (
                <Spinner />
            )}
        </VisualizationsProvider>
    )
}

export default DatasetsOverview
