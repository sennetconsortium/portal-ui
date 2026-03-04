import { APP_ROUTES } from '@/config/constants'
import { getOrganTypes } from '@/lib/ontology'
import { getIntegratedMapsForOrgan } from '@/lib/services'
import log from 'loglevel'
import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import DataTable from 'react-data-table-component'
import { searchUIQueryString } from '../js/functions'
import SenNetAccordion from '../layout/SenNetAccordion'

function IntegratedMaps({ id, title, organ }) {
    const columns = [
        {
            name: 'Organ',
            selector: (row) => row.tissue.tissuetype,
            sortable: true
        },
        {
            name: 'Assay Type',
            selector: (row) => row.assay.assayName,
            sortable: true
        },
        {
            name: 'Raw Download',
            selector: (row) => {
                const url = row.download_raw
                const filename = url.split('/').pop().split('?')[0]
                return (
                    <a target='_blank' rel='noopener noreferrer' href={url} className='icon-inline'>
                        <span className='me-1'>{filename}</span> <i className='bi bi-download'></i>
                    </a>
                )
            },
            sortable: true
        },
        {
            name: 'Processed Download',
            selector: (row) => {
                const url = row.download
                const filename = url.split('/').pop().split('?')[0]
                return (
                    <a target='_blank' rel='noopener noreferrer' href={url} className='icon-inline'>
                        <span className='me-1'>{filename}</span> <i className='bi bi-download'></i>
                    </a>
                )
            },
            sortable: true
        },
        {
            name: 'Shiny App',
            selector: (row) => {
                const url = row.shiny_app
                return (
                    <a target='_blank' rel='noopener noreferrer' href={url} className='icon-inline'>
                        <span className='me-1'>View</span>{' '}
                        <i className='bi bi-box-arrow-up-right'></i>
                    </a>
                )
            },
            sortable: true
        },
        {
            name: 'Creation Date',
            selector: (row) => {
                const date = new Date(row.creation_time)
                return date.toISOString().split('T')[0]
            },
            sortable: true
        },
        {
            name: '',
            selector: (row) => {
                return (
                    <a className='btn btn-outline-primary rounded-0' href={buildUrl(row)}>
                        View datasets
                    </a>
                )
            },
            sortable: true
        }
    ]

    function buildUrl(row) {
        const datasets = row.dataSets.map((d) => d.sennet_id)
        return (
            `${APP_ROUTES.search}?` +
            searchUIQueryString([{ field: 'sennet_id', values: datasets, type: 'any' }], 20)
        )
    }

    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            const organTypes = await getOrganTypes()
            const organTerms = organ.codes.map((code) => organTypes[code])

            const integratedMaps = await Promise.all(
                organTerms.map((term) => getIntegratedMapsForOrgan(term))
            )
            if (integratedMaps.some((map) => map === null)) {
                log.error(`Error fetching integrated maps for organ ${organ.name}`)
                setError('Unable to load integrated maps')
                return
            }

            // integratedMap is an array of arrays. for each top level array find the newest item based on creation_time
            const latestMaps = integratedMaps
                .map((maps) => {
                    if (maps.length === 0) return null
                    return maps.reduce((latest, map) => {
                        return new Date(map.creation_time) > new Date(latest.creation_time)
                            ? map
                            : latest
                    })
                })
                .filter((map) => map !== null)
                .sort((a, b) => a.tissue.tissuetype.localeCompare(b.tissue.tissuetype))

            setData(latestMaps)
        }

        fetchData()
    }, [organ])

    return (
        <SenNetAccordion id={id} title={title}>
            <Card border='0'>
                <Card.Body className='mx-auto w-100 mb-4'>
                    {error != null && (
                        <div className='mx-auto text-center'>Unable to load integrated maps</div>
                    )}

                    {data != null && <DataTable columns={columns} data={data} fixedHeader={true} />}
                </Card.Body>
            </Card>
        </SenNetAccordion>
    )
}

export default IntegratedMaps
