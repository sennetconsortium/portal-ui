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

        const countTotal = hits.length
        const countByOrgan = new Map()

        for (const hit of hits) {
            const src = hit._source
            for (const organ of src.organs) {
                const organCode = organ.code
                const prevCount = countByOrgan.get(organCode) || 0
                countByOrgan.set(organCode, prevCount + 1)
            }
        }

        const titles = [{ key: allTabKey, title: `${cellLabel} (${countTotal})` }]
        for (const [organCode, organCount] of countByOrgan.entries()) {
            const organ = getOrganByCode(organCode)
            titles.push({ key: organCode, title: `${cellLabel} in ${organ.label} (${organCount})` })
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
            const organs = source.organs.map((organ) => getOrganByCode(organ.code).label).join(', ')
            return {
                uuid: source.dataset.uuid,
                sennetId: source.dataset.sennet_id,
                organCodes: source.organs.map((organ) => organ.code),
                organs: organs,
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

        return allData.filter((row) => row.organCodes.includes(selectedTab))
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
                return row.organs
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
