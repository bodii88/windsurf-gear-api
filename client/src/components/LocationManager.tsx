import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

interface Location {
  id: number;
  name: string;
  description: string;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      setError('Failed to fetch locations');
    }
  };

  const handleAddLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3001/api/locations',
        newLocation,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Location added successfully');
      setNewLocation({ name: '', description: '' });
      fetchLocations();
    } catch (error) {
      setError('Failed to add location');
    }
  };

  const handleEditLocation = async () => {
    if (!editLocation) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/locations/${editLocation.id}`,
        editLocation,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Location updated successfully');
      setDialogOpen(false);
      fetchLocations();
    } catch (error) {
      setError('Failed to update location');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      setError('Failed to delete location');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Locations
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Location
          </Typography>
          <TextField
            fullWidth
            label="Location Name"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newLocation.description}
            onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <Button
            variant="contained"
            onClick={handleAddLocation}
            sx={{ mt: 2 }}
          >
            Add Location
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>
          Your Locations
        </Typography>
        <List>
          {locations.map((location) => (
            <ListItem key={location.id}>
              <ListItemText
                primary={location.name}
                secondary={location.description}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setEditLocation(location);
                    setDialogOpen(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteLocation(location.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Edit Location</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Location Name"
              value={editLocation?.name || ''}
              onChange={(e) => setEditLocation(editLocation ? {
                ...editLocation,
                name: e.target.value
              } : null)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editLocation?.description || ''}
              onChange={(e) => setEditLocation(editLocation ? {
                ...editLocation,
                description: e.target.value
              } : null)}
              margin="normal"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditLocation} color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
