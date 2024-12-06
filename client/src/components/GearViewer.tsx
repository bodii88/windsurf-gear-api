import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

interface GearItem {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  location_id?: number;
  quantity: number;
  condition?: string;
  category_name?: string;
  location_name?: string;
}

function GearViewer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<GearItem | null>(null);

  useEffect(() => {
    const fetchGearItem = async () => {
      try {
        // Get the gear ID from the URL
        const gearId = window.location.pathname.split('/').pop();
        if (!gearId) {
          setError('Invalid gear ID');
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:3001/api/gear/${gearId}`);
        setItem(response.data);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to load gear item');
      } finally {
        setLoading(false);
      }
    };

    fetchGearItem();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error || 'Item not found'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom>
              {item.name}
            </Typography>
            
            <Typography color="textSecondary" gutterBottom>
              Category: {item.category_name || 'Uncategorized'}
            </Typography>
            
            <Typography color="textSecondary" gutterBottom>
              Location: {item.location_name || 'Unspecified'}
            </Typography>
            
            {item.description && (
              <Typography variant="body1" paragraph>
                {item.description}
              </Typography>
            )}
            
            <Typography variant="body2" gutterBottom>
              Quantity: {item.quantity}
            </Typography>
            
            {item.condition && (
              <Typography variant="body2" gutterBottom>
                Condition: {item.condition}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default GearViewer;
