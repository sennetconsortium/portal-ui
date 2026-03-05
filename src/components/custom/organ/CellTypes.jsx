import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { getCellTypesByIds, parseJson } from "@/lib/services";
import { useEffect, useRef, useState } from 'react';
import dynamic from "next/dynamic";
import Spinner from '@/components/custom/Spinner'
import SenNetAccordion from '../layout/SenNetAccordion';
import { getCellTypesIndex } from '@/config/config';
import { Chip } from "@mui/material";
import SenNetPopover from "@/components/SenNetPopover"
import { autoBlobDownloader, percentage } from '../js/functions';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AppModal from '@/components/AppModal';
import ClipboardCopy from '@/components/ClipboardCopy';
import { APP_ROUTES } from '@/config/constants';

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});



function CellTypes({ organ }) {

  const isSearching = useRef(false)
  const [tableData, setTableData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState(null)
  const [modalBody, setModalBody] = useState(null)


  const query = {
    size: 0,
    query: {
      term: {
        "organs.category.keyword": {
          value: organ.label
        }
      }
    },

    aggs: {
      total_datasets: {
        cardinality: {
          field: "dataset.uuid.keyword",
          precision_threshold: 40000
        }
      },
      by_cell_label: {
        terms: {
          field: "cell_label.keyword",
          size: 1000
        },
        aggs: {
          details: {
            top_hits: {
              size: 1,
              _source: {
                include: [
                  "cl_id",
                  "cell_definition"
                ]
              }
            }
          },
          total_datasets: {
            cardinality: {
              field: "dataset.uuid.keyword",
              precision_threshold: 40000
            }
          },
          total_cell_count: {
            sum: {
              field: "cell_count"
            }
          }
        }
      }
    }

  }

  const getIds = (e, row) => {
    if (!isSearching.current) {
      isSearching.current = true
      const btnSelector = '.js-btn--cellTypes__viewDatasets'
      $(btnSelector).addClass('btn-disabled')
      getCellTypesByIds([row.cl_id]).then((_results) => {
        let ids = []
        for (let r of _results) {
          ids.push(r.dataset.sennet_id)
        }

        if (ids.length) {
          window.location = APP_ROUTES.search + `?addFilters=sennet_id=${ids.join(',')};entity_type=Dataset;sources.source_type=Human;dataset_type=RNAseq;origin_samples.organ=${organ.codes.join(',')}`
        }
        $(btnSelector).removeClass('btn-disabled')
        isSearching.current = false
      })
    }
  }


  const { data, loading, error } = useSearchUIQuery(getCellTypesIndex(), query)
  const totalDatasets = useRef(0)

  const getHotLink = (row) => {
    return `/cell-types/${row.cl_id}`
  }

  useEffect(() => {
    let _res = []
    if (data) {
      for (const d of data.aggregations.by_cell_label.buckets) {
        _res.push({
          cell_label: d.key,
          cell_definition: d.details.hits.hits[0]._source.cell_definition,
          cl_id: d.details.hits.hits[0]._source.cl_id,
          cell_count: d.total_cell_count.value,
          percentage: percentage(d.total_datasets.value, data.aggregations.total_datasets.value) + '%',
          total_datasets: d.total_datasets.value,
          total_indexed_datasets: data.aggregations.total_datasets.value,
        })

      }
      totalDatasets.current = data.aggregations.total_datasets.value
      setTableData(_res)
    }
  }, [data, loading])

  if (loading) {
    return <Spinner />
  }

  const handleModal = (row) => {
    setShowModal(true)
    setModalBody(<span>{row.cell_definition}</span>)
    setModalTitle(<h5>Description for <code>{row.cell_label}</code><ClipboardCopy text={row.cell_label} /></h5>)
  }

  const columns = [
    {
      name: 'Cell Type',
      id: 'cell_label',
      width: '25%',
      selector: row => row.cell_label,
      sortable: true,
      reorder: true,
      format: row => <a href={getHotLink(row)}><span>{row.cell_label}</span><br /><small className='text-muted'>{row.cl_id}</small></a>,
    },
    {
      name: 'Description',
      id: 'cell_definition',
      selector: row => row.cell_definition,
      sortable: true,
      reorder: true,
      format: (row) => {
        const max = 100
        const desc = row.cell_definition
        if (!desc) {
          return null
        }
        return (<div>
          {desc.length > max ? desc.slice(0, max) : desc}
          {desc.length > max && <SenNetPopover text={'Read full details'} className={`popover-${row.cl_id}`}>
            &nbsp;<Chip label={<MoreHorizIcon />} size="small" onClick={() => handleModal(row)} />
          </SenNetPopover>}
        </div>)
      }
    },
    {
      name: 'Matched Datasets',
      id: 'total_datasets',
      width: '200px',
      selector: row => '',
      sortable: false,
      reorder: true,
      format: row => <>{row.total_datasets}/{totalDatasets.current} ({row.percentage})</>,
    },
    {
      name: '',
      id: 'view_datasets',
      width: '15%',
      selector: row => '',
      sortable: false,
      reorder: true,
      format: row => <span role='button' className='btn btn-outline-primary js-btn--cellTypes__viewDatasets' onClick={(e) => getIds(e, row)}>View Datasets</span>,
    }
  ]

  const downloadData = () => {
    let tableDataTSV = ''
    const _columns = [{
      name: 'Cell ID',
      id: 'cl_id'
    }, ...columns, {
      name: 'Percentage',
      id: 'percentage'
    },
    {
      name: 'Total Indexed Datasets',
      id: 'total_indexed_datasets'
    }
    ]
    for (let col of _columns) {
      if (col.name.length) {
        tableDataTSV += `${col.name}\t`
      }
    }
    tableDataTSV += "\n"
    for (const d of tableData) {

      for (let col of _columns) {
        if (col.name.length) {
          tableDataTSV += `${d[col.id]}\t`
        }
      }
      tableDataTSV += "\n"
    }
    autoBlobDownloader([tableDataTSV], 'text/tab-separated-values', `cell-types-${organ.label}.tsv`)
  }

  return (
    <>
      <SenNetAccordion id="cell-types" title="Cell Types">

        {tableData.length > 0 && <div className='d-flex flex-row-reverse'>
          <span
            className='btn btn-outline-primary rounded-0'
            role='button'
            onClick={downloadData}
          >
            Download Table Data <i className="bi bi-download"></i>
          </span>
        </div>}

        <DataTable columns={columns} data={tableData} className='rdt_Results' pagination />

        <AppModal
          className={`modal--searchCellTypes`}
          modalSize={'xl'}
          showModal={showModal}
          modalTitle={modalTitle}
          modalBody={modalBody}
          handleSecondaryBtn={
            () => {
              setShowModal(false)
            }}
          showPrimaryBtn={false}
          secondaryBtnLabel={
            'Okay'}
        />
      </SenNetAccordion>
    </>
  )
}

export default CellTypes