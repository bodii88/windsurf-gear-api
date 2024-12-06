import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Container,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SportsIcon from '@mui/icons-material/Sports';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import Login from './components/Login';
import Register from './components/Register';
import ItemsGrid from './components/ItemsGrid';
import LocationManager from './components/LocationManager';
import CategoryManager from './components/CategoryManager';

function App() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currentTab, setCurrentTab] = React.useState(0);
  const isAuthenticated = localStorage.getItem('token') !== null;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
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
        
        <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            centered
          >
            <Tab icon={<SportsIcon />} label="Items" />
            <Tab icon={<LocationOnIcon />} label="Locations" />
            <Tab icon={<CategoryIcon />} label="Categories" />
          </Tabs>
        </Box>

        <Container sx={{ flexGrow: 1, mt: 3, mb: 3, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={
              <>
                {currentTab === 0 && <ItemsGrid />}
                {currentTab === 1 && <LocationManager />}
                {currentTab === 2 && <CategoryManager />}
              </>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
