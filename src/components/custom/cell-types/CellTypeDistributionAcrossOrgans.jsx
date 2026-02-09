import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useEffect, useState, useRef, memo } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Spinner from '../Spinner'
import Image from 'next/image'

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
            by_organ_code: {
                terms: {
                    field: 'organs.code.keyword',
                    size: 50
                },
                aggs: {
                    by_cell_label: {
                        terms: {
                            field: 'cell_label.keyword',
                            size: 10000,
                        }
                    }
                }
            }
        }
    }

    function getOrganData(data) {
        let _dict = {}
        let label
        for (let o of data?.aggregations?.by_organ_code?.buckets) {
            label = getOrganByCode(o.key)?.label
            if (_dict[label]) {
                _dict[label].codes.push(o.key)
            } else {
                _dict[label] = {
                    _id: label.toCamelCase(),
                    codes: [o.key],
                    label,
                    icon: getOrganByCode(o.key)?.icon
                }
            }
        }
        return Object.values(_dict)
    }

    const [tabData, setTabData] = useState(null)
    const cellIds = useRef({})

    function getSegmentDataForOrgan(_organ) {
        let cells = 0, types = 0, currentCell = 0
        let empty = { data: [], cells, types, currentCell }
        if (!otherCellTypes?.data) return empty
        let organData = []
        for (let code of _organ.codes) {
            let _data = otherCellTypes?.data?.aggregations?.by_organ_code?.buckets?.find(
                (o) => o.key === code
            )
            organData = [...organData, _data]
        }

        if (!organData) return empty

        let _barData = { group: _organ.label }


        for (let od of organData) {
            od.by_cell_label.buckets.map((b) => {
                if (b.key === cell.label) {
                    currentCell += b.doc_count
                }
                if (_barData[b.key]) {
                    _barData[b.key] += b.doc_count
                } else {
                    _barData[b.key] = b.doc_count
                }
                cellIds.current[b.key] = b.by_cell_id.buckets[0]?.key
            })
            cells += od.doc_count
            types += od.by_cell_label.buckets.length
        }

        return { data: [_barData], cells, types, currentCell }
    }

    const [selectedTab, setSelectedTab] = useState(null)
    const { data, loading, error } = useSearchUIQuery('cell-types', query)
    const query2 = JSON.parse(JSON.stringify(query))
    query2.query = { match_all: {} }
    query2.aggs.by_organ_code.aggs.by_cell_label.aggs = {
        by_cell_id: {
            terms: {
                field: 'cl_id.keyword',
                size: 10000,
            }
        }
    }

    const otherCellTypes = useSearchUIQuery('cell-types', query2)

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
                        <Nav.Link eventKey={organ._id}>
                            <span>{organ.label}</span> &nbsp;
                            <Image
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