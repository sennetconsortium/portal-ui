import { getCellTypesIndex } from '@/config/config'
import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import Image from 'next/image'
import { memo, useEffect, useRef, useState } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Spinner from '../Spinner'

import CellTypeDistributionAcrossOrgansTab from './CellTypeDistributionAcrossOrgansTab'

/**
 * @typedef {Object} CellTypeDistributionAcrossOrgansProps
 * @property {object} cell - CL identifier to fetch distribution for (e.g. {id: 'CL:0002394', label: string})
 */

/**
 * Cell Type Distribution Across Organs component
 *
 * @param {CellTypeDistributionAcrossOrgansProps} props
 */
const CellTypeDistributionAcrossOrgans = memo(({ cell }) => {
    const query = {
        size: 0,
        query: {
            term: {
                'cl_id.keyword': {
                    value: cell.id
                }
            }
        },
        aggs: {
            by_organ_category: {
                terms: {
                    field: "organs.category.keyword",
                    size: 100
                },
                aggs: {
                    total_unique_cell_types: {
                        cardinality: {
                            field: "cl_id.keyword",
                            precision_threshold: 40000
                        }
                    },
                    total_cell_count: {
                        sum: {
                            field: "cell_count"
                        }
                    },
                    details: {
                        top_hits: {
                            size: 1,
                            _source: {
                                include: [
                                    "cl_id",
                                    "organs.code"
                                ]
                            }
                        }
                    },
                    by_cell_label: {
                        terms: {
                            field: "cell_label.keyword",
                            size: 1000
                        },
                        aggs: {
                            total_cell_count: {
                                sum: {
                                    field: "cell_count"
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    function getOrganData(data) {
        let results = []
        let label, code
        for (let o of data?.aggregations?.by_organ_category?.buckets) {
            label = o.key
            code = o.details.hits.hits[0]?._source.organs[0].code
            results.push({
                _id: label.toCamelCase(),
                code,
                label,
                cellCount: o.total_cell_count.value,
                icon: getOrganByCode(code)?.icon
            })
        }
        return results
    }

    const [tabData, setTabData] = useState(null)
    const cellIds = useRef({})

    function getSegmentDataForOrgan(_organ) {
        let cells = 0, types = 0, currentCell = 0
        let empty = { data: [], cells, types, currentCell }
        if (!otherCellTypes?.data) return empty
        let organData = otherCellTypes?.data?.aggregations?.by_organ_category?.buckets?.find(
            (o) => o.key === _organ.label
        )

        if (!organData) return empty

        let _barData = { group: _organ.label }

        organData.by_cell_label.buckets.map((b) => {
            if (b.key === cell.label) {
                currentCell += b.total_cell_count.value
            }
            _barData[b.key] = b.total_cell_count.value
            cellIds.current[b.key] = organData.details.hits.hits[0]?._source.cl_id
        })
        cells += organData.total_cell_count.value
        types += organData.total_unique_cell_types.value

        return { data: [_barData], cells, types, currentCell }
    }

    const [selectedTab, setSelectedTab] = useState(null)
    const { data, loading, error } = useSearchUIQuery(getCellTypesIndex(), query)
    const query2 = JSON.parse(JSON.stringify(query))
    query2.query = { match_all: {} }

    const otherCellTypes = useSearchUIQuery(getCellTypesIndex(), query2)

    useEffect(() => {
        if (!data || selectedTab) {
            return
        }
        const organs = getOrganData(data) || []
        if (organs.length > 0) {
            setSelectedTab(organs[0]._id)
            let _tabData = { organs }
            for (let o of organs) {
                _tabData[o._id] = getSegmentDataForOrgan(o)
            }
            Addon.log('CellTypeDistributionAcrossOrgans', { data: _tabData, color: '#ff0000' })
            setTabData(_tabData)
        }
    }, [otherCellTypes?.data])

    if (loading || !tabData) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    return (
        <Tab.Container activeKey={selectedTab} onSelect={(k) => setSelectedTab(k)}>
            <Nav variant='pills' className='overflow-auto align-items-center gap-2'>
                {getOrganData(data).map((organ) => (
                    <Nav.Item key={organ._id}>
                        <Nav.Link className='tabHeader' eventKey={organ._id}>
                            <span>{organ.label}</span> &nbsp;
                            <Image
                                className='tabHeader__organImg'
                                alt={''}
                                src={organ.icon}
                                width={16}
                                height={16}
                            />
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            <Tab.Content className={'tabContent tabContent--cellTypeOrgan'}>
                {getOrganData(data).map((organ) => (
                    <Tab.Pane eventKey={organ._id} key={organ._id} className='mt-4'>
                        <CellTypeDistributionAcrossOrgansTab organ={organ} tabData={tabData} cell={{ ...cell, cellIds: cellIds.current }} />
                    </Tab.Pane>
                ))}
            </Tab.Content>
        </Tab.Container>
    )
})

export default CellTypeDistributionAcrossOrgans