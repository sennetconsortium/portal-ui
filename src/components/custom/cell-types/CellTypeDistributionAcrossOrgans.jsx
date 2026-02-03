import { getOrganByCode } from '@/config/organs'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { useEffect, useState } from 'react'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Spinner from '../Spinner'

/**
 * @typedef {Object} CellTypeDistributionAcrossOrgansProps
 * @property {string} clId - CL identifier to fetch distribution for (e.g. CL:0002394)
 */

/**
 * Cell Type Distribution Across Organs component
 *
 * @param {CellTypeDistributionAcrossOrgansProps} props
 */
export default function CellTypeDistributionAcrossOrgans({ clId }) {
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
            by_organ_code: {
                terms: {
                    field: 'organs.code.keyword',
                    size: 50
                },
                aggs: {
                    by_cell_label: {
                        terms: {
                            field: 'cell_label.keyword',
                            size: 50
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

    function getSegmentDataForOrgan(data, organCode) {
        const organData = data?.aggregations?.by_organ_code?.buckets?.find(
            (o) => o.key === organCode
        )
        if (!organData) {
            return []
        }

        return organData.by_cell_label.buckets.map((b) => {
            return {
                label: b.key,
                number: b.doc_count
            }
        })
    }

    const [selectedTab, setSelectedTab] = useState(null)
    const { data, loading, error } = useSearchUIQuery('cell-types', query)

    useEffect(() => {
        if (!data || selectedTab) {
            return
        }
        const organs = getOrganData(data) || []
        if (organs.length > 0) {
            setSelectedTab(organs[0].code)
        }
    }, [data, selectedTab])

    if (loading) {
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
                        <div>This is the {organ.label} tab</div>
                    </Tab.Pane>
                ))}
            </Tab.Content>
        </Tab.Container>
    )
}
