import React from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle,
  Menu as MenuIcon,
  Sports,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

export default function Layout() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token') !== null;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const getTabValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/locations':
        return 1;
      case '/categories':
        return 2;
      default:
        return 0;
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/locations');
        break;
      case 2:
        navigate('/categories');
        break;
    }
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Windsurf Gear Tracker
          </Typography>
          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <List>
          <ListItemButton component={Link} to="/">
            <ListItemIcon>
              <Sports />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton component={Link} to="/locations">
            <ListItemIcon>
              <LocationOnIcon />
            </ListItemIcon>
            <ListItemText primary="Locations" />
          </ListItemButton>
          <ListItemButton component={Link} to="/categories">
            <ListItemIcon>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Categories" />
          </ListItemButton>
          <ListItemButton component={Link} to="/items">
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="Items" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={getTabValue()}
          onChange={handleTabChange}
          centered
        >
          <Tab icon={<Sports />} label="Items" />
          <Tab icon={<LocationOnIcon />} label="Locations" />
          <Tab icon={<CategoryIcon />} label="Categories" />
        </Tabs>
      </Box>

      <Container sx={{ flexGrow: 1, mt: 3, mb: 3, overflowY: 'auto' }}>
        <Outlet />
      </Container>
    </Box>
  );
}
