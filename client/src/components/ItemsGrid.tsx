import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Fab,
  Dialog,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import GearDetails from './GearDetails';

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
      const token = localStorage.getItem('token');
      const response = await fetch('https://crayfish-endless-stork.ngrok-free.app/api/gear', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://crayfish-endless-stork.ngrok-free.app/api/gear/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = (id: number) => {
    setSelectedItem(id);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedItem(undefined);
    fetchItems();
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                    {item.name}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(item.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Category: {item.category}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Condition: {item.condition}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                </Typography>
                {item.notes && (
                  <Typography variant="body2" color="text.secondary">
                    Notes: {item.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Fab
        color="primary"
        onClick={handleAdd}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <GearDetails
          open={isDialogOpen}
          gearId={selectedItem}
          onClose={handleDialogClose}
          onUpdate={fetchItems}
        />
      </Dialog>
    </Box>
  );
}
