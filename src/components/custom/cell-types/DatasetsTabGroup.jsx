import ClipboardCopy from '@/components/ClipboardCopy'
import Spinner from '@/components/custom/Spinner'
import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useMemo, useState } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import DataTable from 'react-data-table-component'

function DatasetsTabGroup({ clId, cellLabel }) {
    const query = {
        size: 500,
        _source: ['dataset.uuid', 'dataset.sennet_id', 'organs.code', 'cell_count'],
        query: {
            term: {
                'cl_id.keyword': {
                    value: clId
                }
            }
        }
    }
    const allTabKey = 'all'

    const { data, loading, error } = useSearchUIQuery('cell-types', query)
    const [selectedTab, setSelectedTab] = useState(allTabKey)

    const tabTitles = useMemo(() => {
        const hits = data?.hits?.hits
        if (!hits)
            return [
                {
                    key: allTabKey,
                    title: cellLabel
                }
            ]

        // Calculate counts for each organ
        const countTotal = hits.length
        const countByOrgan = new Map()

        for (const hit of hits) {
            const src = hit._source
            const organNames = new Set()
            for (const o of src.organs) {
                const organ = getOrganByCode(o.code)
                if (!organ) {
                    continue
                }

                // Don't count lateral organs twice if both sides are present
                if (organNames.has(organ.label)) {
                    continue
                }
                organNames.add(organ.label)

                const prevCount = countByOrgan.get(organ.label) || 0
                countByOrgan.set(organ.label, prevCount + 1)
            }
        }

        // Build titles for tabs
        const titles = [{ key: allTabKey, title: `${cellLabel} (${countTotal})` }]
        for (const [organLabel, organCount] of countByOrgan.entries()) {
            titles.push({ key: organLabel, title: `${cellLabel} in ${organLabel} (${organCount})` })
        }

        return titles
    }, [cellLabel, data])

    const allData = useMemo(() => {
        const hits = data?.hits?.hits
        if (!hits) return null

        const totalCells =
            hits?.reduce((sum, hit) => {
                return sum + hit._source.cell_count
            }, 0) || 1
        return hits?.map((hit) => {
            const source = hit._source
            return {
                uuid: source.dataset.uuid,
                sennetId: source.dataset.sennet_id,
                organLabels: source.organs.map((organ) => getOrganByCode(organ.code).label),
                cellCountPercent: ((source.cell_count / totalCells) * 100).toFixed(2) + '%',
                cellCount: source.cell_count
            }
        })
    }, [data])

    const tabData = useMemo(() => {
        if (!allData) {
            return null
        }
        if (selectedTab === 'all') {
            return allData
        }

        return allData.filter((row) => row.organLabels.includes(selectedTab))
    }, [allData, selectedTab])

    if (loading) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    const columns = [
        {
            name: 'SenNet ID',
            sortable: true,
            cell: (row, index, column, id) => {
                return (
                    <span data-field='sennet_id'>
                        <a href={`dataset?uuid=${row.uuid}`}>{row.sennetId}</a>{' '}
                        <ClipboardCopy
                            text={row.sennetId}
                            title={'Copy SenNet ID {text} to clipboard'}
                        />
                    </span>
                )
            }
        },
        {
            name: 'Organs',
            selector: (row) => {
                return row.organLabels.join(', ')
            },
            sortable: true
        },
        {
            name: 'Target Cell %',
            selector: (row) => {
                return row.cellCountPercent
            },
            sortable: true
        },
        {
            name: 'Target Cell Count',
            selector: (row) => {
                return row.cellCount
            },
            sortable: true
        }
    ]

    return (
        <Tab.Container activeKey={selectedTab} onSelect={(k) => setSelectedTab(k)}>
            <Nav variant='pills' className='overflow-auto align-items-center gap-2'>
                {tabTitles.map((title) => (
                    <Nav.Item key={title.key}>
                        <Nav.Link eventKey={title.key}>{title.title}</Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            <Tab.Content>
                {tabTitles.map((title) => (
                    <Tab.Pane key={title.key} className='mt-4' eventKey={title.key}>
                        <DataTable
                            columns={columns}
                            data={tabData || []}
                            fixedHeader={true}
                            pagination
                        />
                    </Tab.Pane>
                ))}
            </Tab.Content>
        </Tab.Container>
    )
}

export default DatasetsTabGroup
