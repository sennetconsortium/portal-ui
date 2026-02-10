import CellTypeDistribution from '@/components/custom/cell-types/CellTypeDistribution'
import CellTypeDistributionAcrossOrgans from '@/components/custom/cell-types/CellTypeDistributionAcrossOrgans'
import DatasetsOverview from '@/components/custom/cell-types/DatasetsOverview'
import DatasetsTabGroup from '@/components/custom/cell-types/DatasetsTabGroup'
import ViewHeader from '@/components/custom/cell-types/ViewHeader'
import AppNavbar from '@/components/custom/layout/AppNavbar'
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import Spinner from '@/components/custom/Spinner'
import AppContext from '@/context/AppContext'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useContext } from 'react'
import { Card } from 'react-bootstrap'
import { getCellTypesIndex } from '@/config/config'

const AppFooter = dynamic(() => import('@/components/custom/layout/AppFooter'))
const Header = dynamic(() => import('@/components/custom/layout/Header'))
const NotFound = dynamic(() => import('@/components/custom/NotFound'))
const SidebarBtn = dynamic(() => import('@/components/SidebarBtn'))

function ViewCellType() {
    const { isRegisterHidden } = useContext(AppContext)

    const router = useRouter()
    const { clid } = router.query

    function getUniqueOrgans(data) {
        return data?.aggregations?.unique_organs?.buckets?.map((bucket) => bucket.key) || []
    }

    function titalize(str) {
        if (!str) {
            return ''
        }
        if (typeof str === 'number') {
            return str.toString()
        }
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const query = clid
        ? {
              _source: ['cell_label', 'cell_definition', 'cl_id', 'cell_count'],
              size: 1,
              query: {
                  term: {
                      'cl_id.keyword': {
                          value: clid
                      }
                  }
              },
              aggs: {
                  unique_organs: {
                      terms: {
                          field: 'organs.code.keyword',
                          size: 10000
                      }
                  }
              }
          }
        : null

    const { data, loading, error } = useSearchUIQuery(getCellTypesIndex(), query)

    if (loading) {
        return <Spinner />
    }
    if (data && data.hits.length === 0) {
        return <NotFound />
    }
    if (error) {
        throw error
    }

    return (
        <>
            <Header
                title={`${clid} | ${data?.hits?.hits[0]?._source?.cell_label} | Cell Type | SenNet`}
            ></Header>

            <AppNavbar hidden={isRegisterHidden} signoutHidden={false} />

            <div className='container-fluid'>
                <div className='row flex-nowrap entity-body has-visualizations g-0'>
                    <div className='col-auto p-0'>
                        <div
                            id='sidebar'
                            className='collapse collapse-horizontal sticky-top custom-sticky'
                        >
                            <ul id='sidebar-nav' className='nav list-group rounded-0 text-sm-start'>
                                <li className='nav-item'>
                                    <a
                                        href='#CellTypeDistribution'
                                        className='nav-link '
                                        data-bs-parent='#sidebar'
                                    >
                                        Cell Type Distribution
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <main className='col m-md-3 entity-details'>
                        <SidebarBtn />

                        <ViewHeader
                            label={titalize(data?.hits?.hits[0]?._source?.cell_label)}
                            clId={clid}
                            organs={getUniqueOrgans(data)}
                        />

                        {/* Description */}
                        <SenNetAccordion id='Description' title='Description'>
                            <Card border='0'>
                                <Card.Body className='mb-4'>
                                    <Card.Text>
                                        {data?.hits?.hits[0]?._source?.cell_definition}
                                    </Card.Text>
                                    <Card.Subtitle>Known References</Card.Subtitle>
                                    <Card.Text>
                                        <a
                                            target='_blank'
                                            href={`http://purl.obolibrary.org/obo/${data?.hits?.hits[0]?._source?.cl_id.replace(':', '_')}`}
                                            className='icon-inline'
                                        >
                                            <span className='me-1'>
                                                {data?.hits?.hits[0]?._source?.cl_id}
                                            </span>{' '}
                                            <i className='bi bi-box-arrow-up-right'></i>
                                        </a>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </SenNetAccordion>

                        {/* Cell Type Distribution */}
                        <SenNetAccordion id='CellTypeDistribution' title='Cell Type Distribution'>
                            <Card border='0'>
                                <Card.Body className='mx-auto w-100 mb-4'>
                                    <CellTypeDistribution clId={clid} />
                                </Card.Body>
                            </Card>
                        </SenNetAccordion>

                        {/* Cell Type Distribution Across Organs */}
                        <SenNetAccordion
                            id='CellTypeDistributionAcrossOrgans'
                            title='Cell Type Distribution Across Organs'
                        >
                            <Card border='0'>
                                <Card.Body className='mx-auto w-100 mb-4'>
                                    <CellTypeDistributionAcrossOrgans
                                        clId={clid}
                                        cell={{
                                            id: clid,
                                            label: data?.hits?.hits[0]?._source?.cell_label
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </SenNetAccordion>

                        {/* Datasets Overview */}
                        <SenNetAccordion id='DatasetsOverview' title='Datasets Overview'>
                            <Card border='0'>
                                <Card.Body
                                    className='mx-auto w-100 mb-4'
                                    style={{ minHeight: '520px' }}
                                >
                                    <DatasetsOverview clId={clid} />
                                </Card.Body>
                            </Card>
                        </SenNetAccordion>

                        {/* Datasets Table */}
                        <SenNetAccordion id='Datasets' title='Datasets'>
                            <Card border='0'>
                                <Card.Body className='mx-auto w-100 mb-4'>
                                    <DatasetsTabGroup
                                        clId={clid}
                                        cellLabel={data?.hits?.hits[0]?._source?.cell_label}
                                    />
                                </Card.Body>
                            </Card>
                        </SenNetAccordion>
                    </main>
                </div>
            </div>

            <AppFooter />
        </>
    )
}

export default ViewCellType
