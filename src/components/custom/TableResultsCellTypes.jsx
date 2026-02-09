import React, { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  checkFilterType,
  getOrganHierarchy, matchArrayOrder, 
} from './js/functions'
import { getOptions } from "./search/ResultsPerPage";
import ResultsBlock from "./search/ResultsBlock";
import { TableResultsProvider } from "@/context/TableResultsContext";
import ClipboardCopy from "../ClipboardCopy";
import 'primeicons/primeicons.css';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Chip } from "@mui/material";
import SenNetPopover from "../SenNetPopover";
import AppModal from "../AppModal";
import { COLS_ORDER_KEY } from "@/config/config";
import { getCellTypesByIds, parseJson } from "@/lib/services";
import { useSearchUIContext } from "@/search-ui/components/core/SearchUIContext";
import { ShimmerText } from "react-shimmer-effects";
import { APP_ROUTES } from '@/config/constants';

function TableResultsCellTypes({ children, onRowClicked, filters, forData = false, rowFn, inModal = false, rawResponse }) {

  const raw = rowFn ? rowFn : ((obj) => obj ? (obj.raw || obj) : null)

  const getId = (column) => column.code

  const currentColumns = useRef([])
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState(null)
  const [modalBody, setModalBody] = useState(null)
  const [results, setResults] = useState([])
  const hiddenColumns = useRef(null)
  const tableContext = useRef(null)
  const [isBusy, setIsBusy] = useState(true)
  const [searchResponse, setSearchResponse] = useState({})
  const {pageSize} = useSearchUIContext()
  const isSearching = useRef(false)

  const loadingComponent = <ShimmerText line={2} gap={10} />

  function updatePagingInfo(resultsCount) {
        $('.sui-paging-info strong').eq(1).text(resultsCount)
    }

  const formatDataForTable = () => {
    let _organsDict = {}
    for (let o of rawResponse.aggregations.group_organs_by_cell_type.buckets) {
      _organsDict[o.key] = o.organs.buckets
    }
    let _results = []
    for (let c of rawResponse.records['cell-types']) {
      _results.push({...c, organs: _organsDict[c.cl_id]})
    }

    setResults(_results)
    updatePagingInfo(rawResponse.record_count)
  }
  useEffect(() => {
    // TODO: build results array
    formatDataForTable()
    setIsBusy(false)
  }, [rawResponse, pageSize, pageSize])

  const getHotLink = (row) => {
      return `/cell-types/${row.cl_id}`
  }

  // Prepare opsDict
  getOptions(results.length)

  const getSearchContext = () => `cellTypes.${tableContext.current}`

  const handleModal = (row) => {
    setShowModal(true)
    setModalBody(<span>{raw(row.cell_definition)}</span>)
    setModalTitle(<h5>Description for <code>{raw(row.cell_label)}</code><ClipboardCopy text={raw(row.cell_label)} /></h5>)
  }

  const getIds = (e, row) => {
    if (!isSearching.current) {
      isSearching.current = true
      const btnSelector = '.js-btn--cellTypes__viewDatasets'
      $(btnSelector).addClass('btn-disabled')
      getCellTypesByIds([row.cl_id]).then((_results)=>{
        let ids = []
        for (let r of _results) {
          ids.push(r.dataset.sennet_id)
        }

        if (ids.length) {
          window.location = APP_ROUTES.search + `?addFilters=sennet_id=${ids.join(',')};entity_type=Dataset;sources.source_type=Human;dataset_type=RNAseq&fct=1`
        }
        $(btnSelector).removeClass('btn-disabled')
        isSearching.current = false
      })
    }
  }

  const defaultColumns = ({ hasMultipleFileTypes = true, columns = [], _isLoggedIn }) => {
    let cols = []

    cols.push(
      {
        name: 'Cell Type',
        id: 'cell_label',
        width: '25%',
        selector: row => raw(row.cell_label),
        sortable: true,
        reorder: true,
        format: row => <a href={getHotLink(row)}><span>{raw(row.cell_label)}</span><br /><small className='text-muted'>{raw(row.cl_id)}</small></a>,
      }
    )

    cols.push(
      {
        name: 'Description',
        id: 'cell_definition',
        selector: row => raw(row.cell_definition),
        sortable: true,
        reorder: true,
        format: (row) => {
          const max = 100
          const desc = raw(row.cell_definition)
          if (!desc) {
            return null
          }
          return (<div>
            {desc.length > max ? desc.slice(0, max) : desc}
            {desc.length > max && <SenNetPopover text={'Read full details'} className={`popover-${getId(row)}`}>
              &nbsp;<Chip label={<MoreHorizIcon />} size="small" onClick={() => handleModal(row)} />
            </SenNetPopover>}
          </div>)
        }
      }
    )

    cols.push({
      name: 'Organs',
      id: 'organs.code',
      width: '25',
      selector: row => {
        let val = raw(row.organs)
        let organs = new Set()
        if (Array.isArray(val)) {
          for (let o of val) {
            organs.add(getOrganHierarchy(o.key))
          }
        }
        if (organs.size > 0) {
          return [...organs].join(', ')
        }
        return ''
      },
      sortable: true,
      reorder: true,
    })

    cols.push(
      {
        name: '',
        id: 'view_datasets',
        width: '25%',
        selector: row => '',
        sortable: false,
        reorder: true,
        format: row => <span role='button' className='btn btn-outline-primary js-btn--cellTypes__viewDatasets' onClick={(e) => getIds(e, row)}>View Datasets</span>,
      }
    )


    return cols

  }

  const getTableColumns = (columnsToHide) => {
    let cols;
    if (checkFilterType(filters) === false) {
      tableContext.current = 'default'
      cols = defaultColumns({});
    }

    if (columnsToHide) {
      hiddenColumns.current = columnsToHide
      for (let col of cols) {
        col.omit = columnsToHide[col.name]
      }
    }

    matchArrayOrder(parseJson(localStorage.getItem(COLS_ORDER_KEY(`cellTypes.${tableContext.current}`))), cols)
    currentColumns.current = cols;
    return cols;
  }

  return (
    <>
      <TableResultsProvider onRowClicked={onRowClicked} getHotLink={getHotLink} columnsRef={currentColumns} getId={getId} rows={results} filters={filters} forData={forData} raw={raw} inModal={inModal}>
        <ResultsBlock
          //onCheckboxChange={handleChecboxSelectionsStates}
          //searchActionHandlers={{getModalSelectedFiles:getModalSelectedFiles, clearCheckboxSelections: clearCheckboxSelections, getModalSelectedUuids: getModalSelectedUuids}}
          index={'cellTypes'}
          isBusy={isBusy}
          searchContext={getSearchContext}
          tableClassName={'rdt_Results--CellTypes'}
          getTableColumns={getTableColumns}
          totalRows={results.length}
          selectableRows={false}
        />

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

      </TableResultsProvider>
    </>
  )

}

TableResultsCellTypes.propTypes = {
  children: PropTypes.node,
  onRowClicked: PropTypes.func
}

export { TableResultsCellTypes }