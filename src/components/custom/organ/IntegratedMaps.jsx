import { APP_ROUTES } from '@/config/constants'
import { getOrganTypes } from '@/lib/ontology'
import { getIntegratedMapsForOrgan, getPrimaryDatasets } from '@/lib/services'
import log from 'loglevel'
import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import DataTable from 'react-data-table-component'
import { searchUIQueryString } from '../js/functions'
import SenNetAccordion from '../layout/SenNetAccordion'

function IntegratedMaps({ id, title, organ }) {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [primaryDatasets, setPrimaryDatasets] = useState(null)

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

            if (latestMaps.length === 0) {
                log.warn(`No integrated maps found for organ ${organ.name}`)
                return
            }

            const uuids = [...new Set(latestMaps.flatMap((map) => map.dataSets.map((d) => d.uuid)))]
            const primaryDatasets = await getPrimaryDatasets(uuids)

            const primaryDatasetsMap = {}
            for (const dataset of primaryDatasets) {
                primaryDatasetsMap[dataset.uuid] = dataset.primary_datasets
            }
            setPrimaryDatasets(primaryDatasetsMap)
        }

        fetchData()
    }, [organ])

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
                // integrated maps contain derived datasets. we need the primary datasets to link to the search page.
                if (primaryDatasets == null) {
                    return (
                        <button className='btn btn-outline-primary' disabled>
                            Loading datasets...
                        </button>
                    )
                }

                const url = buildUrl(row.dataSets)
                if (url == null) {
                    return (
                        <button className='btn btn-outline-primary' disabled>
                            No datasets to view
                        </button>
                    )
                }

                return (
                    <a className='btn btn-outline-primary' href={url}>
                        View datasets
                    </a>
                )
            },
            sortable: true
        }
    ]

    function buildUrl(datasets) {
        const derivedUUIDs = datasets.map((d) => d.uuid)

        // find all the primary datasets for the given uuids and extract their sennetIds.
        const primarySennetIds = []
        for (const uuid of derivedUUIDs) {
            const dataset = primaryDatasets[uuid]
            if (dataset) {
                primarySennetIds.push(...dataset.map((d) => d.sennetId))
            }
        }

        if (primarySennetIds.length === 0) {
            return null
        }

        // build a search url for the entity search page
        return (
            `${APP_ROUTES.search}?` +
            searchUIQueryString(
                [
                    { field: 'sennet_id', values: primarySennetIds, type: 'any' },
                    { field: 'entity_type', values: ['Dataset'], type: 'any' }
                ],
                20
            )
        )
    }

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
