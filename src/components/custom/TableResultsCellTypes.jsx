import React, { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  autoBlobDownloader,
  checkFilterType,
  checkMultipleFilterType, getEntityViewUrl,
  getUBKGFullName, matchArrayOrder, goToTransfers
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
import FileTreeView from "./entities/dataset/FileTreeView";
import { COLS_ORDER_KEY, FILE_KEY_SEPARATOR } from "@/config/config";
import { fetchGlobusFilepath, parseJson } from "@/lib/services";
import { useSearchUIContext } from "@/search-ui/components/core/SearchUIContext";
import DataUsageModal from "@/components/custom/entities/dataset/DataUsageModal";
import { ShimmerText } from "react-shimmer-effects";
import { Button } from 'react-bootstrap'

function TableResultsCellTypes({ children, onRowClicked, filters, forData = false, rowFn, inModal = false, rawResponse }) {

  const raw = rowFn ? rowFn : ((obj) => obj ? (obj.raw || obj) : null)

  const getId = (column) => column.id || column.uuid

  const currentColumns = useRef([])
  const [showModal, setShowModal] = useState(false)
  const [results, setResults] = useState([])
  const hiddenColumns = useRef(null)
  const tableContext = useRef(null)
  const [isBusy, setIsBusy] = useState(true)
  const [searchResponse, setSearchResponse] = useState({})

  const loadingComponent = <ShimmerText line={2} gap={10} />

  useEffect(() => {
    // TODO: build results array
    setIsBusy(false)
  }, [])

  // Prepare opsDict
  getOptions(children.length)

  const getSearchContext = () => `cellTypes.${tableContext.current}`

  const handleModal = (row) => {
    setShowModal(true)
    setModalBody(<span>{raw(row.description)}</span>)
    setModalTitle(<h5>Description for <code>{raw(row.sennet_id)}</code><ClipboardCopy text={raw(row.sennet_id)} /></h5>)
  }

  const defaultColumns = ({ hasMultipleFileTypes = true, columns = [], _isLoggedIn }) => {
    let cols = []

    cols.push(
      {
        name: 'Cell Type',
        id: 'name',
        width: '200px',
        selector: row => raw(row.name),
        sortable: true,
        reorder: true,
        format: row => <div><span>{raw(row.name)}</span><br /><small className='text-muted'>{raw(row.id)}</small></div>,
      }
    )

    cols.push(
      {
        name: 'Description',
        id: 'description',
        selector: row => raw(row.description),
        sortable: true,
        reorder: true,
        format: (row) => {
          const max = 100
          const desc = raw(row.description)
          if (!desc) {
            return null
          }
          return (<div>
            {desc.length > max ? desc.slice(0, max) : desc}
            {desc.length > max && <SenNetPopover text={'Read full details'} className={`popover-${getId(row)}`}>
              <Chip label={<MoreHorizIcon />} size="small" onClick={() => handleModal(row)} />
            </SenNetPopover>}
          </div>)
        }
      }
    )

    cols.push({
      name: 'Organs',
      id: 'organs.label',
      width: '10%',
      selector: row => {
        let val = raw(row.organs)
        let organs = new Set()
        if (val) {
          if (Array.isArray(val)) {
            for (let o of val) {
              organs.add(getUBKGFullName(o.code))
            }
          } else {
            organs.add(getUBKGFullName(val.code))
          }
          if (organs.size > 0) {
            return [...organs].join(', ')
          }
        }
        return ''
      },
      sortable: true,
      reorder: true,
    })

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
      <TableResultsProvider onRowClicked={onRowClicked} columnsRef={currentColumns} getId={getId} rows={results} filters={filters} forData={forData} raw={raw} inModal={inModal}>
        <ResultsBlock
          //onCheckboxChange={handleChecboxSelectionsStates}
          //searchActionHandlers={{getModalSelectedFiles:getModalSelectedFiles, clearCheckboxSelections: clearCheckboxSelections, getModalSelectedUuids: getModalSelectedUuids}}
          index={'cellTypes'}
          isBusy={isBusy}
          searchContext={getSearchContext}
          tableClassName={'rdt_Results--CellTypes'}
          getTableColumns={getTableColumns}
          totalRows={searchResponse?.aggregations?.total_datasets.value}
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