import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import api from '../services/api';

interface Item {
  id: string;
  name: string;
  description: string;
  locationId: string;
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  qrCode?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function ItemManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    locationId: '',
    categoryId: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: ''
  });
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchItems();
    fetchLocations();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/api/items');
      setItems(response.data);
    } catch (error: any) {
      setError('Failed to fetch items');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/locations');
      setLocations(response.data);
    } catch (error: any) {
      setError('Failed to fetch locations');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error: any) {
      setError('Failed to fetch categories');
    }
  };

  const handleAddItem = async () => {
    try {
      await api.post('/api/items', newItem);
      setSuccess('Item added successfully');
      setNewItem({ name: '', description: '', locationId: '', categoryId: '', brand: '', model: '', serialNumber: '', purchaseDate: '' });
      fetchItems();
    } catch (error: any) {
      setError('Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;

    try {
      await api.patch(`/api/items/${editItem.id}`, editItem);
      setSuccess('Item updated successfully');
      setDialogOpen(false);
      fetchItems();
    } catch (error: any) {
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.delete(`/api/items/${id}`);
      setSuccess('Item deleted successfully');
      fetchItems();
    } catch (error: any) {
      setError('Failed to delete item');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Items
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Item
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={newItem.model}
                onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={newItem.serialNumber}
                onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Purchase Date"
                value={newItem.purchaseDate}
                onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={newItem.locationId}
                  label="Location"
                  onChange={(e) => setNewItem({ ...newItem, locationId: e.target.value })}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newItem.categoryId}
                  label="Category"
                  onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleAddItem}>
                Add Item
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">{item.name}</Typography>
                <Typography color="textSecondary">Description: {item.description}</Typography>
                <Typography>Brand: {item.brand}</Typography>
                <Typography>Model: {item.model}</Typography>
                <Typography>Serial Number: {item.serialNumber}</Typography>
                <Typography>Purchase Date: {item.purchaseDate}</Typography>
                <Typography>
                  Location: {locations.find(l => l.id === item.locationId)?.name}
                </Typography>
                <Typography>
                  Category: {categories.find(c => c.id === item.categoryId)?.name}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditItem(item);
                      setDialogOpen(true);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editItem?.name || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, name: e.target.value } : null)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editItem?.description || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, description: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Brand"
                value={editItem?.brand || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, brand: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model"
                value={editItem?.model || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, model: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Serial Number"
                value={editItem?.serialNumber || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, serialNumber: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Purchase Date"
                value={editItem?.purchaseDate || ''}
                onChange={(e) => setEditItem(editItem ? { ...editItem, purchaseDate: e.target.value } : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={editItem?.locationId || ''}
                  label="Location"
                  onChange={(e) => setEditItem(editItem ? { ...editItem, locationId: e.target.value } : null)}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editItem?.categoryId || ''}
                  label="Category"
                  onChange={(e) => setEditItem(editItem ? { ...editItem, categoryId: e.target.value } : null)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateItem} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
