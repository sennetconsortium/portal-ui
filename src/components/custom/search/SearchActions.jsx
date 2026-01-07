import React, {useEffect, useRef, useState, useContext} from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import {PagingInfo} from "@elastic/react-search-ui";
import {autoBlobDownloader, eq, goToTransfers} from "@/components/custom/js/functions";
import SenNetPopover from "@/components/SenNetPopover";
import AppTutorial from "@/components/custom/layout/AppTutorial";
import {getCheckboxes} from "@/hooks/useSelectedRows";
import {APP_ROUTES} from "@/config/constants";
import {Divider} from "@mui/material";
import AppContext from '@/context/AppContext';
import StyledMenu from '@/components/custom/layout/StyledMenu';
import NestedMenuItem from '../layout/NestedMenuItem';
import ListItemText from '@mui/material/ListItemText';

function SearchActions({
                           selectedRows,
                           data = [],
                           raw,
                           columns,
                           filters,
                           exportKind,
                           hiddenColumns,
                           inModal,
                           setRefresh,
                           actionHandlers = {},
                           handleOnRowClicked,
                           context = 'entities'
                       }) {
    const [anchorEl, setAnchorEl] = useState(null)
    const [totalSelected, setTotalSelected] = useState(selectedRows.current?.length)
    const [showTutorial, setShowTutorial] = useState(false)
    const open = Boolean(anchorEl)
    const hasListened = useRef(false)
    const {isLoggedIn} = useContext(AppContext)
    const modalSelectedFiles = actionHandlers.getModalSelectedFiles ? actionHandlers.getModalSelectedFiles() : []


    const handleClick = (event) => {
        setTimeout(()=> {
            $('.snMenu-item--export').eq(0).focus()
        }, 100)
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    const getId = (column) => column.id || column.uuid

    const generateTSVData = (selected, isAll) => {
        let _columns = columns.current


        let tableDataTSV = ''
        let _colName
        for (let col of _columns) {
            if (!col.omit) {
                tableDataTSV += `${col.name}\t`
            }
        }
        tableDataTSV += "\n"
        let colVal;
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }
            let row
            for (let item of data) {
                row = item.props ? item.props.result : item
                let id = raw(row.uuid)
                if (isAll || selected[id]) {
                    for (let col of _columns) {
                        if (!col.omit) {
                            _colName = col.name
                            colVal = col.selector(row) ? col.selector(row) : ''
                            tableDataTSV += `${colVal}\t`
                        }
                    }
                    tableDataTSV += "\n"
                }
            }
        } catch (e) {
            console.error(e);
        }

        return tableDataTSV
    }

    const hasFileFilter = () => {
        if (filters.length) {
            for (let f of filters) {
                if (eq(f.field, 'file_extension') || eq(f.field, 'is_data_product') || eq(f.field, 'is_qa_qc')) {
                    return true
                }
            }
        }
        return document.getElementById('search')?.value.length > 0
    }

    const generateManifestData = (selected, isAll) => {
        let manifestData = ''
        try {
            if (!Array.isArray(data)) {
                data = Object.values(data)
            }
            for (let item of data) {
                let id = item.props ? raw(item.props.result.uuid) : raw(item.uuid) || raw(item.id)
                if (isAll || selected[id]) {
                    if (!hasFileFilter() && eq(context, 'files')) {
                        manifestData += `${id} /\n`
                    } else if (item.list) {
                        for (let subItem of item.list) {
                            manifestData += `${raw(subItem.dataset_uuid)} /${raw(subItem.rel_path)}\n`
                        }
                    } else {
                        manifestData += `${id} /${raw(item.rel_path)}\n`
                    }
                }
            }
            if (!isAll) {
                for (let f of modalSelectedFiles) {
                    manifestData += `${f.uuid} ${f.path}\n`
                }  
            }
            
        } catch (e) {
            console.error(e);
        }

        return manifestData
    }

    const atIndex = (index) => {
        return (data[index].props) ? data[index].props.result : data[index]
    }

    const downloadData = (e, fileType, isAll) => {

        let selected = {}
        let results = []
        let fileName = raw(getId(atIndex(0))) + ' - ' + raw(getId(atIndex(data.length - 1)))
        let lastSelected, val


        if (!isAll) {
            for (let s of selectedRows.current) {
                val = s.id
                if (!Object.values(selected).length) {
                    fileName = val
                }
                selected[val] = true
                lastSelected = val
            }

            if (fileName !== lastSelected) {
                fileName += ` - ${lastSelected}`
            }
        }

        for (let i = 0; i < data.length; i++) {
            let id = getId(atIndex(i))

            if (isAll || selected[id]) {
                results.push(atIndex(i))
            }
        }

        let type = 'text/tab-separated-values'
        let blob
        switch (fileType) {
            case 'json':
                type = 'application/json'
                blob = [JSON.stringify(results, null, 2)]
                break;
            case 'manifest':
                type = 'text/plain'
                fileName = 'data-manifest'
                fileType = 'txt'
                blob = [generateManifestData(selected, isAll)]
                break;
            default:
                blob = [generateTSVData(selected, isAll)]
            // code block
        }

        autoBlobDownloader(blob, type, `${fileName}.${fileType}`)
    }

    const _isDatasetFilter = (f) => eq(f.field, 'entity_type') && f.values.contains('dataset')


    const getActions = () => {
        let actions = {
            json: 'JSON',
            tsv: 'TSV'
        }
        if (eq(exportKind, 'manifest')) {
            actions = {
                manifest: 'Manifest TXT'
            }
        }

        if (filters) {
            for (let f of filters) {
                if (_isDatasetFilter(f)) {
                    actions.manifest = 'Manifest TXT'
                    break
                }
            }
        }

        // Disable json action output for now if there are hidden columns
        if (hiddenColumns && Object.keys(hiddenColumns).length) {
            delete actions['json']
        }

        return actions
    }

    const popoverText = (fileType) => {
        if (eq(fileType, 'json')) {
            return <>Exports all properties associated with selected entities in JSON format.</>
        } else if (eq(fileType, 'tsv')) {
            return <>Exports search result table information for selected entities in tab-separated values format.</>
        } else {
            return <>Exports to SenNet CLT manifest format.
                <br/>
                <small className={'text-muted'}>Note: In order to download the files that are included in the manifest
                    file,&nbsp;
                    <a href="https://github.com/x-atlas-consortia/clt" target='_blank' className={'lnk--ic'}>install <i
                        className="bi bi-box-arrow-up-right"></i></a> the CLT and <a target='_blank'
                                                                                     className={'lnk--ic'}
                                                                                     href="https://docs.sennetconsortium.org/libraries/clt/">follow
                        the instructions<i
                            className="bi bi-box-arrow-up-right"></i></a> for how to use it with the manifest
                    file.</small>
            </>
        }
    }

    const getMenuItems = (range) => {
        let results = []
        const isAll = range === 'all'
        const exportActions = getActions()
        const icon = {
            json: 'bi-filetype-json',
            tsv: 'bi-file-earmark-ruled',
            manifest: 'bi-filetype-txt',
        }
        let i = 1

        for (let action in exportActions) {
            results.push(<MenuItem className='snMenu-item' onClick={(e) => downloadData(e, action, isAll)} key={`${range}-${action}`}>
                <SenNetPopover  text={popoverText(action)} className={`${range}-${action}`}>
                    <ListItemText><i class={`bi ${icon[action]}`}></i> &nbsp;<code>{exportActions[action]}</code></ListItemText>
                </SenNetPopover>
                </MenuItem>
            )
           
            i++
        }
        return results
    }

    const hasSelectedRows = () => {
        return totalSelected > 0
    }
    const isFilesSearch = () => {
        return eq(context, 'files')
    }

    const hasDatasetFilter = (ops = {}) => {
        let hasDataet = false
        let hasViz = ops.excludeHasViz || false
        let types = new Set()
        if (filters) {
            for (let f of filters) {
                if (_isDatasetFilter(f)) {
                    hasDataet = true
                }

                if (!ops.excludeHasViz) {
                    if (eq(f.field, 'has_visualization') && f.values.contains('true')) {
                        hasViz = true
                    } 
                }
                
            }
        }
        for (let e of selectedRows.current) {
            if (e.dataset_type) {
                types.add(e.dataset_type?.raw)
            }
        }
        return hasDataet && hasViz && (types.size === 1 || ops.excludeTypes)
    }

    const hasSelectedDatasetsWithViz = () => hasSelectedRows() && hasDatasetFilter()

    const hasSelectedDatasets = () => hasSelectedRows() && (hasDatasetFilter({excludeHasViz: true, excludeTypes: true}) || eq(context, 'files'))

    useEffect(() => {
        document.addEventListener(
            "snRowsSelected",
            (e) => {
                const el = e.detail.el
                setTotalSelected(Number(el.getAttribute('data-count')))
            },
            false,
        )
    }, []);

    useEffect(() => {
        if (hasDatasetFilter() && !hasListened.current) {
            hasListened.current = true
            getCheckboxes().on('click', (e) => {
                setShowTutorial(hasDatasetFilter())
            })
        }
    }, [filters]);

    const goCompare = () => {
        const uuids = selectedRows.current.map((e) => e.id)
        window.location = APP_ROUTES.discover + '/compare?uuids=' + uuids.join(',')
    }

    const goTransferFiles = (e) => {
        let _list = []
        for (let e of selectedRows.current) {
            _list.push({
                dataset: isFilesSearch() ? raw(e.dataset_sennet_id) : raw(e.sennet_id),
                dataset_type: raw(e.dataset_type),
                file_path: isFilesSearch() ? '/' : '/'
            })
        }
        if (actionHandlers.getModalSelectedFiles) {
            for (let l of actionHandlers.getModalSelectedFiles()) {
                _list.push({
                    dataset: l.uuid, 
                    dataset_type: l.dataset_type,
                    file_path: l.path
                })
            }
        }
        
        if (inModal) {
            handleOnRowClicked(_list, e)
        } else {
           goToTransfers(_list)
        }
        
    }

    const clearSelections = () => {
        selectedRows.current = []
        if (actionHandlers.clearCheckboxSelections) {
            actionHandlers.clearCheckboxSelections()
        }
        setRefresh(new Date().getMilliseconds())
    }

    const hasFileTreeModalSelections = () => {
        return actionHandlers.getModalSelectedFiles && actionHandlers.getModalSelectedFiles().length > 0
    }

    const isTransfersEnabled = hasSelectedDatasets() || hasFileTreeModalSelections()

    const getModalSelectedUuids = () => {
        return actionHandlers.getModalSelectedUuids ? actionHandlers.getModalSelectedUuids() : []
    }

    const itemEnabled = isLoggedIn() && (!inModal || isFilesSearch())

    return (
        <div className='c-searchActions'>
            <Button
                id="sui-search-actions-btn"
                aria-controls={'sui-tbl-checkbox-actions'}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="contained"
                disableElevation
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon/>}
                className='bg-primary'
            >
                <i className="bi bi-download fs-6 me-2"></i>
                <PagingInfo/>
            </Button>
            <StyledMenu
                id="sui-tbl-checkbox-actions"
                slotProps={{
                    list: {
                        'aria-labelledby': 'sui-search-actions-btn',
                    },
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                
            
                <NestedMenuItem idPrefix={'export-all'} 
                parentClassName={'snMenu-item snMenu-item--export'} 
                parentLabel={<span> Export all to &nbsp;</span>}>{getMenuItems('all')}</NestedMenuItem>

           
                {hasSelectedRows() && <NestedMenuItem idPrefix={'export-selected'} 
                parentClassName={'snMenu-item snMenu-item--export'} 
                parentLabel={<span> Export selected to &nbsp;</span>}>{getMenuItems()}</NestedMenuItem>}

                {itemEnabled &&

                    <MenuItem className={`snMenu-item ${isTransfersEnabled ? '' : 'text-disabled'}`}
                              key={`transfer-files`}
                              onClick={isTransfersEnabled ? goTransferFiles : undefined}>
                        <ListItemText>
                            <span>Transfer Files &nbsp;</span><SenNetPopover text={<span>Initiate a transfer of <code>Dataset</code> files via Globus.</span>}><i className="bi bi-question-circle-fill"></i>
                    </SenNetPopover>
                        </ListItemText>
                    </MenuItem>}

                    {itemEnabled && eq(context, 'entities') &&
                        
                    <MenuItem className={`snMenu-item ${hasSelectedDatasetsWithViz() ? '' : 'text-disabled'}`}
                              key={`export-all`} onClick={hasSelectedDatasetsWithViz() ? goCompare : undefined}>
                        <ListItemText>
                            
                        <span>Compare Datasets &nbsp;</span>
                            <SenNetPopover
                            text={<span>Select up to 4 datasets of the same <code>Dataset Type</code> to compare the visualizations. You must have <code>Dataset</code> from the Entity Type facet and <code>True</code> from Has Spatial Information facet selected to enable this option.</span>}>
                            <i className="bi bi-question-circle-fill"></i>
                        </SenNetPopover>
                        </ListItemText>
                        
                    </MenuItem>
                    }

                
                {hasSelectedRows() && <Divider/>}
                {(hasSelectedRows() || isTransfersEnabled) &&
                    <MenuItem className={'snMenu-item'} onClick={clearSelections}><i
                        className="bi bi-x-circle"></i> &nbsp; Clear row selections ({selectedRows.current.length + getModalSelectedUuids().length})
                    </MenuItem>}


            </StyledMenu>
            {showTutorial && <AppTutorial name={'searchActions'} autoStart={true}/>}
        </div>
    );
}

SearchActions.propTypes = {
    children: PropTypes.node
}

export default SearchActions