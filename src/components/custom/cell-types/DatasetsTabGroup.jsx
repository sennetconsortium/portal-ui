import ClipboardCopy from '@/components/ClipboardCopy'
import Spinner from '@/components/custom/Spinner'
import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useMemo, useState, useRef } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import DataTable from 'react-data-table-component'
import Image from 'next/image'

function DatasetsTabGroup({ clId, cellLabel }) {
    const query = {
        size: 500,
        _source: ['dataset.uuid', 'dataset.sennet_id', 'organs.category', 'organs.code', 'cell_count'],
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
    const organCodes = useRef({})

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
            const organLabels = new Set(hit._source.organs.map((o) => o.category))
            for (const organLabel of organLabels) {
                const prevCount = countByOrgan.get(organLabel) || 0
                countByOrgan.set(organLabel, prevCount + 1)
            }
        }
 
        // code by label
        for (const hit of hits) {
            for (const o of hit._source.organs) {
                organCodes.current[o.category] = o.code
            }
        }

        // Build titles for tabs
        const titles = [{ key: allTabKey, title: `${cellLabel} (${countTotal})` }]
        for (const [organLabel, organCount] of countByOrgan.entries()) {
            titles.push({ key: organLabel, title: `${cellLabel} in ${organLabel} (${organCount})`, icon: getOrganByCode(organCodes.current[organLabel])?.icon })
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
                organLabels: source.organs.map((organ) => organ.category),
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
            format: (row) => {
                let list = []
                for (const o of row.organLabels) {
                    list.push(<span key={o}>{o} &nbsp;
                        <Image
                            alt={''}
                            src={getOrganByCode(organCodes.current[o])?.icon}
                            width={16}
                            height={16}
                        />
                    &nbsp;</span>)
                }
                return <div>{list}</div>
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
                        <Nav.Link className='tabHeader' eventKey={title.key}>
                            <span>{title.title}</span>&nbsp;
                            <Image
                                className='tabHeader__organImg'
                                alt={''}
                                src={title.icon}
                                width={16}
                                height={16}
                            />
                            </Nav.Link>
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
