import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import {APP_ROUTES} from '@/config/constants'
import {getIntegratedMaps, getIntegratedMapsForOrgan, getPrimaryDatasets} from '@/lib/services'
import log from 'xac-loglevel'
import {useEffect, useState, useContext} from 'react'
import {Card} from 'react-bootstrap'
import DataTable from 'react-data-table-component'
import {formatByteSize, getOrganHierarchy, getOrganMeta, searchUIQueryString} from '../js/functions'
import { Skeleton } from '@mui/material'
import AppContext from '@/context/AppContext'

/**
 * Displays the latest integrated maps in a table.
 *
 * @param {Object} props Component props.
 * @param {string} props.id Accordion element id.
 * @param {string} props.title Accordion title.
 * @param {import('@/config/organs').Organ} props.organ Organ metadata used to resolve map records.
 * @returns {JSX.Element}
 */
function IntegratedMaps({id, title, organ}) {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [primaryDatasets, setPrimaryDatasets] = useState(null)
    const {cache} = useContext(AppContext)

    const setLatestMaps = (integratedMaps) => {
        // integratedMaps is an array of arrays. for each top level array find the newest item based on creation_time
        const latestMaps = integratedMaps
            .map((maps) => {
                if (maps.length === 0) return null

                const uniqueAssayNames = [
                    ...new Set(maps.map(item => item.assay.assayName))
                ];

                let uniqueAssayLatestMaps = []
                uniqueAssayNames.forEach((assayName) => {
                    uniqueAssayLatestMaps.push(maps.filter(item => item.assay.assayName === assayName).reduce((latest, map) => {
                        return new Date(map.creation_time) > new Date(latest.creation_time)
                            ? map
                            : latest
                    }))
                })
                return uniqueAssayLatestMaps
            }).flat() // Since the above returns an array we want to flatten this so we don't have nested arrays
            .filter((map) => map !== null)
            .sort((a, b) => a.tissue.tissuetype.localeCompare(b.tissue.tissuetype))

        return latestMaps
    }

    useEffect(() => {
        const fetchData = async () => {
            let integratedMaps
            let organTerms
            const dict = {}
            const organTypes = cache.organTypes
            if (!organ) {
                organTerms = Object.keys(organTypes)
                // get results for all organs
                const allResults = await getIntegratedMaps()
                // group by uberoncode
                for (const r of allResults) {
                    dict[r.tissue.uberoncode] = dict[r.tissue.uberoncode] || []
                    dict[r.tissue.uberoncode].push(r)
                }
                // an array of arrays
                integratedMaps = Object.values(dict)
            } else {
                organTerms = organ.codes.map((code) => organTypes[code])
                // the promise returns an array of arrays
                integratedMaps = await Promise.all(
                    organTerms.map((term) => getIntegratedMapsForOrgan(term))
                )
            }
            
            if (integratedMaps.some((map) => map === null)) {
                log.error(`Error fetching integrated maps for organ ${organ.name}`)
                setError('Unable to load integrated maps')
                return
            }

            const latestMaps = setLatestMaps(integratedMaps)
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
            sortable: true,
            format: (row) => {
               
                const tag = organ ? row.tissue.tissuetype : <a href={`${APP_ROUTES.organs}/${getOrganHierarchy(row.tissue.uberoncode).toLowerCase()}`}>{row.tissue.tissuetype}</a>
                return <>{tag} &nbsp;<img alt={''}
                    src={getOrganMeta(row.tissue.uberoncode).icon}
                    width={'16px'} /></>
            }
        },
        {
            name: 'Assay Type',
            selector: (row) => row.assay.assayName,
            sortable: true
        },
        {
            name: 'Raw Download',
            id: 'raw_download',
            sortable: true,
            reorder: true,
            selector: (row) => row.download_raw,
            format: (row) => {
                if (row.download_raw !== null) {
                    const url = row.download_raw.split('/').pop().split('?')[0]
                    return (
                        <div data-field='raw_download'>
                            <div>
                                <a target='_blank' rel='noopener noreferrer' href={row.download_raw}>
                                {url}
                            </a>{' '}
                            <i className='bi bi-download'></i>
                            </div>
                            <small  className='text-muted'>{formatByteSize(row.raw_file_size_bytes)}</small>
                        </div>
                    )
                }
            }
        },
        {
            name: 'Processed Download',
            id: 'processed_download',
            sortable: true,
            reorder: true,
            selector: (row) => row.download,
            format: (row) => {
                if (row.download !== null) {
                    const url = row.download.split('/').pop().split('?')[0]
                    let cells = 0
                    if (Object.keys(row.processed_cell_type_counts).length) {
                        for (const c in row.processed_cell_type_counts) {
                            cells += row.processed_cell_type_counts[c]
                        }
                    }
                    
                    return (
                        <div data-field='processed_download'>
                           <div>
                             <a target='_blank' rel='noopener noreferrer' href={row.download}>
                                {url}
                            </a>{' '}
                            <i className='bi bi-download'></i>
                           </div>
                            <small className='text-muted'>{formatByteSize(row.processed_file_sizes_bytes)}</small>
                            {cells > 0 && <span>
                                <br />
                                <small className='text-muted'>{cells} cells, {Object.keys(row.processed_cell_type_counts).length} cell types</small>
                            </span>}
                        </div>
                    )
                }
            }
        },
        {
            name: 'Shiny App',
            id: 'shiny_app',
            sortable: true,
            reorder: true,
            selector: (row) => {
                if (row.shiny_app !== null) {
                    return (
                        <span data-field='shiny_app' className='has-supIcon'>
                        <a target='_blank' rel='noopener noreferrer' href={row.shiny_app}>
                            View
                        </a>{' '}
                            <i className='bi bi-box-arrow-up-right'></i>
                    </span>
                    )
                }
            }
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
                        <button className='btn btn-outline-primary my-1' disabled>
                            Loading datasets...
                        </button>
                    )
                }

                const url = buildUrl(row.dataSets)
                if (url == null) {
                    return (
                        <button className='btn btn-outline-primary my-1' disabled>
                            No datasets to view
                        </button>
                    )
                }

                return (
                    <a className='btn btn-outline-primary my-1' href={url}>
                        View {row.dataSets.length} datasets
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
                    {field: 'sennet_id', values: primarySennetIds, type: 'any'},
                    {field: 'entity_type', values: ['Dataset'], type: 'any'}
                ],
                20
            )
        )
    }

    const content = <>
        {error != null && (
            <div className='mx-auto text-center'>Unable to load integrated maps</div>
        )}

        {data != null && (
            <DataTable
                className='rdt_Results'
                columns={columns}
                data={data}
                fixedHeader={true}
            />
        )}
    </>

    if (!data) {
        return <Skeleton variant='roubded' height={250} />
    }

    if (!id) {
        return content
    }

    return (
        <SenNetAccordion id={id} title={title}>
            <Card border='0'>
                <Card.Body className='mx-auto w-100 mb-4'>
                    {content}
                </Card.Body>
            </Card>
        </SenNetAccordion>
    )
}

export default IntegratedMaps
