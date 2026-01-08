import React, { useEffect, useRef, useState, useContext } from 'react'

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import StyledMenu from '@/components/custom/layout/StyledMenu';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';


function NestedMenuItem({ children, idPrefix, parentLabel, parentClassName }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)


  const handleClick = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const menuId = idPrefix + '--subMenu'
  const parentId = idPrefix + '--parent'

  return (
    <>
      <MenuItem
        onClick={handleClick}
        aria-controls={menuId}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        id={parentId} className={parentClassName} key={idPrefix}>
        
        <ListItemText>{parentLabel}</ListItemText>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <i class="bi bi-chevron-right"></i>
          </Typography>
      </MenuItem>
      <StyledMenu
        id={menuId}
        slotProps={{
          list: {
            'aria-labelledby': parentId,
          },
        }}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 50,
            horizontal: 0,
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {children}
      </StyledMenu>
    </>
  )
}

export default NestedMenuItem