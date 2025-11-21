import { APP_ROUTES } from '@/config/constants'
import useLocalSettings from '@/hooks/useLocalSettings'
import { getSamplesByOrgan } from '@/lib/services'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useContext } from 'react'
import DataTable from 'react-data-table-component'
import ClipboardCopy from '../../ClipboardCopy'
import { searchUIQueryString } from '../js/functions'
import SenNetAccordion from '../layout/SenNetAccordion'
import AppContext from '@/context/AppContext'

/**
 * Samples component displays the samples for a given organ in a SenNetAccordion.
 *
 * @param {Object} props - The properties object.
 * @param {import('@/config/organs').Organ} props.organ - The organ.
 *
 * @returns {JSX.Element} The JSX code for the HumanReferenceAtlas component.
 */
const Samples = ({ id, organ }) => {
    const router = useRouter()
    const { setLocalSettings } = useLocalSettings()
    const [samples, setSamples] = useState(null)
    const {authorized} = useContext(AppContext)

    useEffect(() => {
        const getSamples = async () => {
            const res = await getSamplesByOrgan(organ.codes)
            setSamples(res)
        }
        getSamples()
    }, [organ])

    const sampleUrl = (uuid) => {
        return `${APP_ROUTES.sample}?uuid=${uuid}`
    }

    const columns = [
        {
            name: 'SenNet ID',
            sortable: true,
            cell: (row, index, column, id) => {
                return (
                    <span data-field='sennet_id'>
                        <a href={sampleUrl(row.uuid)}>{row.sennetId}</a>{' '}
                        <ClipboardCopy
                            text={row.sennetId}
                            title={'Copy SenNet ID {text} to clipboard'}
                        />
                    </span>
                )
            }
        },
         {
            name: 'Source Type',
            selector: (row) => row.sourceType,
            sortable: true
        },
        {
            name: 'Lab ID',
            selector: (row) => row.labId,
            omit: !authorized,
            sortable: true
        },
        {
            name: 'Group',
            selector: (row) => row.groupName,
            sortable: true
        }
    ]

    const searchUrl =
        `${APP_ROUTES.search}?` +
        searchUIQueryString(
            [
                { field: 'entity_type', values: ['Sample'], type: 'any' },
                { field: 'organ', values: organ.codes, type: 'any' }
            ],
            20
        )

    const handleSearchPageClick = (e) => {
        e.preventDefault()
        // Expand the relevant facets on the search page
        setLocalSettings('entities', {
            entity_type: { isExpanded: true },
            organ: { isExpanded: true }
        })
        window.location = e.target.href
    }

    return (
        <SenNetAccordion id={id} title='Samples' afterTitle={undefined}>
            <div className='d-flex flex-row-reverse'>
                <Link
                    className='btn btn-outline-primary rounded-0'
                    href={searchUrl}
                    onClick={handleSearchPageClick}
                >
                    View on search page
                </Link>
            </div>
            {samples != null && (
                <DataTable
                    columns={columns}
                    data={samples}
                    fixedHeader={true}
                    pagination
                />
            )}
        </SenNetAccordion>
    )
}

export default Samples
