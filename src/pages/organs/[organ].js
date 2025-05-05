import HumanReferenceAtlas from '@/components/custom/organ/HumanReferenceAtlas'
import AppContext from '@/context/AppContext'
import useOrganDetail from '@/hooks/organ/useOrganDetail'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useContext } from 'react'

const AppFooter = dynamic(() => import('@/components/custom/layout/AppFooter'))
const AppNavbar = dynamic(() => import('@/components/custom/layout/AppNavbar'))
const DataTypeQuantities = dynamic(() => import('@/components/custom/organ/DataTypeQuantities'))
const NotFound = dynamic(() => import('@/components/custom/NotFound'))
const OrganViewHeader = dynamic(() => import('@/components/custom/organ/ViewHeader'))
const Samples = dynamic(() => import('@/components/custom/organ/Samples'))
const SidebarBtn = dynamic(() => import('@/components/SidebarBtn'))

const Organ = () => {
    const { isRegisterHidden } = useContext(AppContext)

    const router = useRouter()
    const { organ } = router.query;
    const { organDetail } = useOrganDetail(organ)

    if (!organDetail) {
        return <NotFound />
    }

    return (
        <>
            <AppNavbar hidden={isRegisterHidden} signoutHidden={false} />
            <div className='container-fluid'>
                <div className='row flex-nowrap entity-body'>
                    {/* Sidebar */}
                    <div className='col-auto p-0'>
                        <div
                            id='sidebar'
                            className='collapse collapse-horizontal sticky-top custom-sticky'
                        >
                            <ul
                                id='sidebar-nav'
                                className='nav list-group rounded-1 text-sm-start'
                            >
                                {organDetail.hraSupported && (
                                    <li className='nav-item'>
                                        <a
                                            href='#HumanReferenceAtlas'
                                            className='nav-link'
                                            data-bs-parent='#sidebar'
                                        >
                                            Human Reference Atlas
                                        </a>
                                    </li>
                                )}

                                <li className='nav-item'>
                                    <a
                                        href='#DataTypes'
                                        className='nav-link'
                                        data-bs-parent='#sidebar'
                                    >
                                        Data Types
                                    </a>
                                </li>
                                <li className='nav-item'>
                                    <a
                                        href='#Samples'
                                        className='nav-link'
                                        data-bs-parent='#sidebar'
                                    >
                                        Samples
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <main className='col m-md-3 entity-details'>
                        <SidebarBtn />

                        {/* Title and badges */}
                        <OrganViewHeader organ={organDetail} />

                        {/* Human Reference Atlas */}
                        {organDetail.hraSupported && (
                            <HumanReferenceAtlas
                                id='HumanReferenceAtlas'
                                organ={organDetail}
                            />
                        )}

                        {/* Data Types */}
                        <DataTypeQuantities
                            id='DataTypes'
                            organ={organDetail}
                        />

                        {/* Sample */}
                        <Samples id='Samples' organ={organDetail} />
                    </main>
                </div>
            </div>
            <AppFooter />
        </>
    )
}

export default Organ
