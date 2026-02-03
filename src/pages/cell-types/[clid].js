import CellTypeDistribution from '@/components/custom/cell-types/CellTypeDistribution'
import CellTypeDistributionAcrossOrgans from '@/components/custom/cell-types/CellTypeDistributionAcrossOrgans'
import ViewHeader from '@/components/custom/cell-types/ViewHeader'
import AppNavbar from '@/components/custom/layout/AppNavbar'
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import Spinner from '@/components/custom/Spinner'
import AppContext from '@/context/AppContext'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useContext } from 'react'
import Card from 'react-bootstrap/Card'

const AppFooter = dynamic(() => import('@/components/custom/layout/AppFooter'))
const Header = dynamic(() => import('@/components/custom/layout/Header'))
const NotFound = dynamic(() => import('@/components/custom/NotFound'))
const SidebarBtn = dynamic(() => import('@/components/SidebarBtn'))

function ViewCellType() {
    const { isRegisterHidden } = useContext(AppContext)

    const router = useRouter()
    const { clid } = router.query

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
              }
          }
        : null

    const { data, loading, error } = useSearchUIQuery('cell-types', query)

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
            <Header title={`${clid} | Cell Type | SenNet`}></Header>

            <AppNavbar hidden={isRegisterHidden} signoutHidden={false} />

            <div className='container-fluid'>
                <div className='row flex-nowrap entity-body g-0'>
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

                        <ViewHeader label={data?.hits?.hits[0]?._source?.cell_label} clId={clid} />

                        {/* Cell Type Distribution */}
                        <SenNetAccordion id='CellTypeDistribution' title='Cell Type Distribution'>
                            <Card border='0'>
                                <Card.Body className='mx-auto mb-4'>
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
                                    <CellTypeDistributionAcrossOrgans clId={clid} />
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
