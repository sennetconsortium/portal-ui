import ClipboardCopy from '@/components/ClipboardCopy'
import Spinner from '@/components/custom/Spinner'
import { getCellTypesIndex } from '@/config/config'
import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import Form from 'react-bootstrap/Form'
import DataTable from 'react-data-table-component'

function DatasetsTable({ clId, cellLabel }) {
    const query = {
        size: 10000,
        _source: [
            'dataset.uuid',
            'dataset.sennet_id',
            'organs.category',
            'organs.code',
            'cell_count'
        ],
        query: {
            term: {
                'cl_id.keyword': {
                    value: clId
                }
            }
        }
    }
    const allKey = 'all'

    const { data, loading, error } = useSearchUIQuery(getCellTypesIndex(), query)
    const [selectedSubset, setSelectedSubset] = useState(allKey)

    const tabTitles = useMemo(() => {
        const hits = data?.hits?.hits
        if (!cellLabel || !hits)
            return [
                {
                    key: allKey,
                    title: cellLabel
                }
            ]

        const titleCellLabel = cellLabel.charAt(0).toUpperCase() + cellLabel.slice(1)

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

        // Build titles for tabs
        const titles = [{ key: allKey, title: `${titleCellLabel} (${countTotal})` }]
        for (const [organLabel, organCount] of countByOrgan.entries()) {
            titles.push({
                key: organLabel,
                title: `${titleCellLabel} in ${organLabel} (${organCount})`
            })
        }

        return titles
    }, [cellLabel, data])

    const organIcons = useMemo(() => {
        const hits = data?.hits?.hits
        if (!cellLabel || !hits) {
            return {}
        }

        // code by label
        const iconsByLabel = {}
        for (const hit of hits) {
            for (const o of hit._source.organs) {
                iconsByLabel[o.category] = getOrganByCode(o.code)?.icon
            }
        }

        return iconsByLabel
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
        if (selectedSubset === 'all') {
            return allData
        }

        return allData.filter((row) => row.organLabels.includes(selectedSubset))
    }, [allData, selectedSubset])

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
                        <a href={`/dataset?uuid=${row.uuid}`}>{row.sennetId}</a>{' '}
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
                    list.push(
                        <span key={o}>
                            {o} &nbsp;
                            <Image alt={''} src={organIcons[o]} width={16} height={16} />
                            &nbsp;
                        </span>
                    )
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
        <div className='d-flex flex-column gap-3'>
            <Form.Select
                aria-label='cell-type dataset filter'
                style={{ width: 'fit-content' }}
                onChange={(e) => setSelectedSubset(e.target.value)}
                value={selectedSubset}
            >
                {tabTitles.map((title) => (
                    <option key={title.key} value={title.key}>
                        {title.title}
                    </option>
                ))}
            </Form.Select>

            <DataTable columns={columns} data={tabData || []} fixedHeader={true} pagination />
        </div>
    )
}

export default DatasetsTable
