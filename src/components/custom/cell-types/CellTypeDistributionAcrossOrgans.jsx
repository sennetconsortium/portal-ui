import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useEffect, useState, useRef, memo } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
            by_organ_code: {
                terms: {
                    field: 'organs.code.keyword',
                    size: 50
                },
                aggs: {
                    by_cell_label: {
                        terms: {
                            field: 'cell_label.keyword',
                            size: 10000
                        }
                    }
                }
            }
        }
    }

    function getOrganData(data) {
        return data?.aggregations?.by_organ_code?.buckets?.map((o) => {
            return {
                code: o.key,
                label: getOrganByCode(o.key)?.label
            }
        })
    }

    const [tabData, setTabData] = useState({})
    
    
    
    function getSegmentDataForOrgan(organCode) {
        const organData = otherCellTypes?.data?.aggregations?.by_organ_code?.buckets?.find(
            (o) => o.key === organCode
        )
        if (!organData) {
            return []
        }

        let _barData = {group: organCode}
        let currentCell = 0
        organData.by_cell_label.buckets.map((b) => {
            if (b.key === cell.label) {
                currentCell = b.doc_count
            }
            _barData[b.key] = b.doc_count
        })

        return {data: [_barData], cells: organData.doc_count, types: organData.by_cell_label.buckets.length, currentCell}
    }

    const [selectedTab, setSelectedTab] = useState(null)
    const { data, loading, error } = useSearchUIQuery('cell-types', query)
    query.query = {match_all: {}}
    const otherCellTypes = useSearchUIQuery('cell-types', query)

    useEffect(() => {
        if (!data || selectedTab) {
            return
        }
        const organs = getOrganData(data) || []
        if (organs.length > 0) {
            setSelectedTab(organs[0].code)
            let _tabData = {organs}
            for (let o of organs) {
                _tabData[o.code] = getSegmentDataForOrgan(o.code)
            }
            setTabData(_tabData)
            console.log('TD', _tabData)
        }
    }, [data])

    if (loading || !Object.keys(tabData).length) {
        return <Spinner />
    }
    if (error || !data) {
        return <div>Unable to load chart</div>
    }

    

    return (
        <Tab.Container activeKey={selectedTab} onSelect={(k) => setSelectedTab(k)}>
            <Nav variant='pills' className='overflow-auto align-items-center gap-2'>
                {getOrganData(data).map((organ) => (
                    <Nav.Item key={organ.code}>
                        <Nav.Link eventKey={organ.code}>{organ.label}</Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            <Tab.Content>
                {getOrganData(data).map((organ) => (
                    <Tab.Pane eventKey={organ.code} key={organ.code} className='mt-4'>
                        <CellTypeDistributionAcrossOrgansTab organ={organ} tabData={tabData} cell={cell} />
                    </Tab.Pane>
                ))}
            </Tab.Content>
        </Tab.Container>
    )
})

export default CellTypeDistributionAcrossOrgans