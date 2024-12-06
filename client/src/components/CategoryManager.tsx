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
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#1976d2' });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
      setCategories([]);
    }
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3001/api/categories',
        newCategory,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Category added successfully');
      setNewCategory({ name: '', description: '', color: '#1976d2' });
      fetchCategories();
    } catch (error) {
      setError('Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!editCategory) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/categories/${editCategory.id}`,
        editCategory,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Category updated successfully');
      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      setError('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      setError('Failed to delete category');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Categories
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Category
          </Typography>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Color"
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            margin="normal"
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAddCategory}
            sx={{ mt: 2 }}
          >
            Add Category
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>
          Your Categories
        </Typography>
        <List>
          {categories.map((category) => (
            <ListItem key={category.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={category.name}
                      size="small"
                      style={{ backgroundColor: category.color }}
                    />
                    <Typography>{category.name}</Typography>
                  </Box>
                }
                secondary={category.description}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setEditCategory(category);
                    setDialogOpen(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Category Name"
              value={editCategory?.name || ''}
              onChange={(e) => setEditCategory(editCategory ? {
                ...editCategory,
                name: e.target.value
              } : null)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editCategory?.description || ''}
              onChange={(e) => setEditCategory(editCategory ? {
                ...editCategory,
                description: e.target.value
              } : null)}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={editCategory?.color || '#1976d2'}
              onChange={(e) => setEditCategory(editCategory ? {
                ...editCategory,
                color: e.target.value
              } : null)}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditCategory} color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
