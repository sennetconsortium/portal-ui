import {Box, Divider, Drawer, List, ListItemButton, ListItemText, ListSubheader, Typography} from '@mui/material'
import PropTypes from "prop-types";

export default function NavbarDrawer({
                                         open,
                                         onClose,
                                         anchor = "left",
                                         title,
                                         sections = []
                                     }) {
    const handleItemClick = item => {
        onClose()

        if (item.onClick) {
            item.onClick()
            return
        }

        if (item.href) {
            window.location.href = item.href
        }
    }

    return (
        <Drawer
            anchor={anchor}
            open={open}
            onClose={onClose}
        >
            <Box sx={{width: 350}}>
                <Box sx={{p: 2}}>
                    <Typography variant="h6">
                        {title}
                    </Typography>
                </Box>

                <Divider/>

                {sections.map((section, index) => {
                    const items =
                        typeof section.items === 'function'
                            ? section.items() || []
                            : section.items || []

                    return (
                        <Box key={section.title}>
                            <List
                                subheader={
                                    <ListSubheader>
                                        {section.title}
                                    </ListSubheader>
                                }
                            >
                                {items.map(item => (
                                    <ListItemButton
                                        disabled={item.disabled}
                                        key={item.label}
                                        onClick={() =>
                                            handleItemClick(item)
                                        }
                                    >
                                        <ListItemText
                                            primary={item.label}
                                            sx={{
                                                textTransform: 'capitalize'
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>

                            {index < sections.length - 1 && (
                                <Divider/>
                            )}
                        </Box>
                    )
                })}
            </Box>
        </Drawer>
    )
}

NavbarDrawer.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    anchor: PropTypes.string,
    title: PropTypes.string,
    sections: PropTypes.array
}