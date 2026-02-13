import { APP_ROUTES } from "@/config/constants";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import {useEffect, useState} from "react";
import {eq} from "@/components/custom/js/functions";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import StyledMenu from '@/components/custom/layout/StyledMenu';

const SearchTypeButton = ({ title }) => {
    const { filters } = useSearchUIContext()
    const [links, setLinks] = useState(<></>)

    const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)
    const openMoreMenu = Boolean(moreMenuAnchorEl)
    const handleMoreMenuClick = (event) => {
        setMoreMenuAnchorEl(event.currentTarget)
    };

    const handleMoreMenuClose = () => {
        setMoreMenuAnchorEl(null)
    }

    const validButtons = {
        Entities: APP_ROUTES.search,
        Metadata: APP_ROUTES.search + "/metadata",
        Files: APP_ROUTES.search + "/files",
        more: {
            cellTypes: APP_ROUTES.search + "/cell-types"
        }
    }

    const onCondition = (b) => {
        let entity
        let canShow = eq(title, 'entities') ? false : true
        if (eq(b, 'metadata')) {

            for (let i = 0; i < filters.length; i++) {
                if (eq(filters[i].field, 'entity_type') && ['Dataset', 'Sample', 'Source'].contains(filters[i].values[0])) {
                    entity = filters[i].values[0]
                    canShow = true
                }

                if (eq(filters[i].field, 'sample_category') && eq(filters[i].values[0], 'organ')) {
                    canShow = false
                    return {entity, canShow}
                }
            }
        }
        if (eq(b, 'files')) {
            for (let i = 0; i < filters.length; i++) {
                if (eq(filters[i].field, 'entity_type') && ['Dataset'].contains(filters[i].values[0])) {
                    entity = filters[i].values[0]
                    canShow = true
                }
            }
        }

        if (eq(b, 'more')) {
            let canShowPoints = 0
            for (let i = 0; i < filters.length; i++) {
                if (eq(filters[i].field, 'entity_type') && ['Dataset'].contains(filters[i].values[0])) {
                    canShowPoints++
                }

                if (eq(filters[i].field, 'sources.source_type') && eq(filters[i].values[0], 'human')) {
                     canShowPoints++
                }
       
                if (eq(filters[i].field, 'dataset_type') && ['transcriptomics', 'rnaseq'].contains(filters[i].values[0])) {
                    canShowPoints++
                }
            }
            canShow = canShowPoints === 3
        }
        return {canShow}
    }

  

    const getMoreMenu = () => {

        return (
        <StyledMenu
                id="searchTypes-more-menu"
                slotProps={{
                    list: {
                        'aria-labelledby': 'searchTypes-more-menu',
                    },
                    paper: {
                        elevation: 0,
                        sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                        },
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
                anchorEl={moreMenuAnchorEl}
                open={openMoreMenu}
                onClose={handleMoreMenuClose}
                onClick={handleMoreMenuClose}
            >
                
        <MenuItem onClick={() => window.location = validButtons.more.cellTypes}>
          Search Cell Types
        </MenuItem>
        </StyledMenu>)
    }

    const buildLinks = () => {
        let res = []
        let className
        for (let b in validButtons) {
            let condition = onCondition(b)
            if (!eq(title, b) && condition.canShow) {
                className = eq(b, 'files') && onCondition('more').canShow ? 'w-65' : 'w-100'
                res.push (
                    <div key={b} className="searchType__wrap">
                    {!eq(b, 'more') && <a key={b} className={`btn btn-outline-primary rounded-0 ${className} js-searchType mt-2`}
                       href={`${validButtons[b]}${condition.entity ? `?addFilters=entity_type=${condition.entity}` : ''}`}>
                        Search {b}
                    </a>}
                    {eq(className, 'w-65') && <span 
                        role="button"
                        onClick={handleMoreMenuClick}
                        aria-controls={'searchTypes-more-menu'}
                        aria-haspopup="true"
                        aria-expanded={openMoreMenu ? 'true' : undefined}
                        className="btn mt-2 mx-2"><MoreVertIcon /></span>}
                   
                    </div>
                );
            }

        }

        setLinks(res)
    };

    useEffect(() => {
        buildLinks()
    }, [filters]);

    return (
        <>{links}
        {getMoreMenu()}</>
    );
};

export default SearchTypeButton;
