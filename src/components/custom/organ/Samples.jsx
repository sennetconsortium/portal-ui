import ClipboardCopy from '@/components/ClipboardCopy';
import { searchUIQueryString } from '@/components/custom/js/functions';
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion';
import { APP_ROUTES } from '@/config/constants';
import AppContext from '@/context/AppContext';
import useLocalSettings from '@/hooks/useLocalSettings';
import { getSamplesByOrgan } from '@/lib/services';
import dynamic from "next/dynamic";
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

/**
 * Displays organ-associated samples in a table.
 *
 * @param {Object} props Component props.
 * @param {string} props.id Accordion element id.
 * @param {import('@/config/organs').Organ} props.organ Organ metadata used to fetch and filter samples.
 * @returns {JSX.Element}
 */
const Samples = ({ id, organ }) => {
    const { setLocalSettings } = useLocalSettings()
    const [samples, setSamples] = useState(null)
    const { authorized } = useContext(AppContext)

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
                    className='rdt_Results'
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
