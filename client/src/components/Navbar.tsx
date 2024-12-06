import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SurfingOutlined, ExitToApp } from '@mui/icons-material';

interface NavbarProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Navbar({ setIsAuthenticated }: NavbarProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={() => navigate('/')}
        >
          <SurfingOutlined />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Windsurf Gear Tracker
        </Typography>

        <Box>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<ExitToApp />}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
