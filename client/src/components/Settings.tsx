import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import axios from 'axios';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/api/settings/notifications',
        { enabled: !emailNotifications },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailNotifications(!emailNotifications);
      setSuccess('Notification settings updated');
    } catch (error) {
      setError('Failed to update notification settings');
    }
  };

  const handleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add logic to change theme
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3001/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    } catch (error) {
      setError('Failed to delete account');
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive updates about your gear"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={emailNotifications}
                onChange={handleEmailNotifications}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Dark Mode"
              secondary="Toggle dark/light theme"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={darkMode}
                onChange={handleDarkMode}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Delete Account"
              secondary="Permanently delete your account and all data"
            />
            <ListItemSecondaryAction>
              <Button
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action cannot be undone.
              All your gear data will be permanently deleted.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAccount} color="error">
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
