import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import { styled, alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InsightsIcon from '@mui/icons-material/Insights';
import Divider from '@mui/material/Divider';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ListSubheader from '@mui/material/ListSubheader';

import {
    PagingInfo
} from "@elastic/react-search-ui";
import {autoBlobDownloader, eq} from "@/components/custom/js/functions";
import SenNetPopover from "@/components/SenNetPopover";

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        color: 'rgb(55, 65, 81)',
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
                ...theme.applyStyles('dark', {
                    color: 'inherit',
                }),
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
        },
        ...theme.applyStyles('dark', {
            color: theme.palette.grey[300],
        }),
    },
}));

function SearchActions({selectedRows, data = [], raw, columns, filters, exportKind, hiddenColumns, context = 'entities'}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

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

    const hasFileFilter = ()=> {
        if (filters.length) {
            for (let f of filters) {
                if (eq(f.field, 'file_extension')) {
                    return true
                }
            }
        }
        return document.getElementById('search')?.value.length > 0
    }

    const generateManifestData = (selected, isAll) => {
        let manifestData  = ''
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
        } catch (e) {
            console.error(e);
        }

        return manifestData
    }

    const atIndex = (index) => {
        return (data[index].props)  ? data[index].props.result : data[index]
    }

    const downloadData = (e, fileType, isAll) => {

        let selected = {}
        let results = []
        let fileName = raw(getId(atIndex(0))) + ' - ' + raw(getId(atIndex(data.length - 1)))
        let lastSelected, val


        if (!isAll) {
            for (let s of selectedRows) {
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
        switch(fileType) {
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
                if (eq(f.field, 'entity_type') && f.values.contains('dataset')) {
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
                <br />
                <small className={'text-muted'}>Note: In order to download the files that are included in the manifest file,&nbsp;
                    <a href="https://github.com/x-atlas-consortia/clt" target='_blank' className={'lnk--ic'}>install <i
                        className="bi bi-box-arrow-up-right"></i></a> the CLT and <a target='_blank' className={'lnk--ic'}
                                                                                     href="https://docs.sennetconsortium.org/libraries/clt/">follow the instructions<i
                        className="bi bi-box-arrow-up-right"></i></a> for how to use it with the manifest file.</small>
            </>
        }
    }

    const getMenuItems = (range) => {
        let results = []
        const isAll = range === 'all'
        const exportActions = getActions()
        let i = 1

        for (let action in exportActions) {
            results.push(
                <SenNetPopover key={`${range}-${action}`} text={popoverText(action)} className={`${range}-${action}`}>
                    <a onClick={(e) => downloadData(e, action, isAll)}><code>{exportActions[action]}</code></a>
                </SenNetPopover>
            )
            if (i !== Object.keys(exportActions).length) {
                results.push(<span key={`${range}-${action}-sep`}>&nbsp;|&nbsp;</span>)
            }
            i++
        }
        return results
    }

    const hasSelectedRows = () => {
        return totalSelected > 0
    }

    const [totalSelected, setTotalSelected] = useState(selectedRows?.length)

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

    return (
        <div>
            <Button
                id="demo-customized-button"
                aria-controls={open ? 'demo-customized-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="contained"
                disableElevation
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
            >
                <PagingInfo />
                {/*{selectedRows.length > 0 && <span>&nbsp; {selectedRows.length} selected</span>}*/}
            </Button>
            <StyledMenu
                id="sui-tbl-checkbox-actions"
                slotProps={{
                    list: {
                        'aria-labelledby': 'demo-customized-button',
                    },
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <ListSubheader>
                    <FileDownloadIcon />
                    Export</ListSubheader>
                <MenuItem className={'dropdown-item'} key={`export-all`}>All to&nbsp;
                    {getMenuItems('all')}
                </MenuItem>
                {hasSelectedRows() && <MenuItem className={'dropdown-item'}  key={`export-selected`} >Selected to&nbsp;
                    {getMenuItems()}
                </MenuItem>}

                {hasSelectedRows() &&<div>

                    <ListSubheader>
                        <InsightsIcon />
                        Visualize</ListSubheader>
                    <MenuItem className={'dropdown-item'} key={`export-all`}>Compare Datasets
                    </MenuItem>
                </div>}


            </StyledMenu>
        </div>
    );
}

SearchActions.propTypes = {
    children: PropTypes.node
}

export default SearchActions