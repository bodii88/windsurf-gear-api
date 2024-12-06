import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Fab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import GearDetails from './GearDetails';
import api from '../services/api';

interface GearItem {
  id: number;
  name: string;
  category: string;
  condition: string;
  purchase_date: string;
  notes: string;
}

export default function ItemsGrid() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await api.get('/api/items');
      setItems(response.data.items || []); // Extract items array from response
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/items/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div">
                    {item.name}
                  </Typography>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSelectedItem(item.id);
                        setIsDialogOpen(true);
                      }}
                      aria-label="edit item"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(item.id)}
                      aria-label="delete item"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="text.secondary">
                  Category: {item.category}
                </Typography>
                <Typography variant="body2">
                  Condition: {item.condition}
                </Typography>
                {item.purchase_date && (
                  <Typography variant="body2">
                    Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                  </Typography>
                )}
                {item.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Notes: {item.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Fab 
              color="primary" 
              onClick={() => {
                setSelectedItem(undefined);
                setIsDialogOpen(true);
              }}
              aria-label="add new item"
            >
              <AddIcon />
            </Fab>
          </Box>
        </Grid>
      </Grid>

      <GearDetails
        open={isDialogOpen}
        gearId={selectedItem}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedItem(undefined);
        }}
        onUpdate={fetchItems}
      />
    </Box>
  );
}
