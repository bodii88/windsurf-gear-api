import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import axios from 'axios';
import QRScanner from './QRScanner';
import GearDetails from './GearDetails';
import { exportQRCodes } from '../utils/qrExport';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface GearItem {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  locationId?: number;
  condition?: string;
  purchaseDate?: string | null;
}

interface GearFormData {
  name: string;
  description: string;
  categoryId: string;
  locationId: string;
  condition: string;
  purchaseDate: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function GearTracker() {
  const [openScanner, setOpenScanner] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedGearId, setSelectedGearId] = useState<number | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [gear, setGear] = useState<GearItem[]>([]);
  const [openGearDialog, setOpenGearDialog] = useState(false);
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const [gearForm, setGearForm] = useState<GearFormData>({
    name: '',
    description: '',
    categoryId: '',
    locationId: '',
    condition: '',
    purchaseDate: ''
  });

  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedQRGear, setSelectedQRGear] = useState<GearItem | null>(null);

  const handleOpenScanner = () => {
    setOpenScanner(true);
  };

  const handleCloseScanner = () => {
    setOpenScanner(false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDetails = (id?: number) => {
    setSelectedGearId(id || null);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedGearId(null);
    setOpenDetails(false);
  };

  const handleOpenGearDialog = (gear?: GearItem) => {
    if (gear) {
      setSelectedGear(gear);
      setGearForm({
        name: gear.name,
        description: gear.description || '',
        categoryId: gear.categoryId?.toString() || '',
        locationId: gear.locationId?.toString() || '',
        condition: gear.condition || '',
        purchaseDate: gear.purchaseDate || ''
      });
    } else {
      setSelectedGear(null);
      setGearForm({
        name: '',
        description: '',
        categoryId: '',
        locationId: '',
        condition: '',
        purchaseDate: ''
      });
    }
    setOpenGearDialog(true);
  };

  const handleCloseGearDialog = () => {
    setOpenGearDialog(false);
    setSelectedGear(null);
  };

  const handleSaveGear = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setSnackbar({
          open: true,
          message: 'Please log in to save gear',
          severity: 'error'
        });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (selectedGear) {
        await axios.put(`http://localhost:3001/api/items/${selectedGear.id}`, {
          ...gearForm,
          categoryId: gearForm.categoryId ? parseInt(gearForm.categoryId) : null,
          locationId: gearForm.locationId ? parseInt(gearForm.locationId) : null
        }, config);
      } else {
        await axios.post('http://localhost:3001/api/items', {
          ...gearForm,
          categoryId: gearForm.categoryId ? parseInt(gearForm.categoryId) : null,
          locationId: gearForm.locationId ? parseInt(gearForm.locationId) : null
        }, config);
      }

      fetchGear();
      handleCloseGearDialog();
      setSnackbar({
        open: true,
        message: `Gear ${selectedGear ? 'updated' : 'added'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving gear:', error);
      setSnackbar({
        open: true,
        message: `Error ${selectedGear ? 'updating' : 'adding'} gear`,
        severity: 'error'
      });
    }
  };

  const handleExportAllQRCodes = () => {
    if (gear.length === 0) {
      setSnackbar({
        open: true,
        message: 'No gear items to export',
        severity: 'warning'
      });
      return;
    }

    exportQRCodes(gear).catch(error => {
      console.error('Error exporting QR codes:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting QR codes',
        severity: 'error'
      });
    });
  };

  const handleDeleteGear = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setSnackbar({
          open: true,
          message: 'Please log in to delete gear',
          severity: 'error'
        });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.delete(`http://localhost:3001/api/items/${id}`, config);
      fetchGear();
      setSnackbar({
        open: true,
        message: 'Gear deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting gear:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting gear',
        severity: 'error'
      });
    }
  };

  const handleOpenQRDialog = (gear: GearItem) => {
    setSelectedQRGear(gear);
    setOpenQRDialog(true);
  };

  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
    setSelectedQRGear(null);
  };

  useEffect(() => {
    fetchGear();
  }, []);

  const fetchGear = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setSnackbar({
          open: true,
          message: 'Please log in to view gear items',
          severity: 'error'
        });
        return;
      }

      const response = await axios.get('http://localhost:3001/api/items', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setGear(response.data.items || []); 
    } catch (error) {
      console.error('Error fetching gear:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching gear items',
        severity: 'error'
      });
      setGear([]); 
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Windsurf Gear Tracker
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">My Gear</Typography>
          <Box>
            <Button
              variant="contained"
              onClick={() => handleOpenDetails()}
              sx={{ mr: 1 }}
            >
              Add Gear
            </Button>
            <IconButton
              onClick={() => setOpenScanner(true)}
              sx={{ mr: 1 }}
            >
              <QrCodeScannerIcon />
            </IconButton>
            <IconButton
              onClick={() => handleOpenGearDialog()}
              sx={{ 
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                p: 1
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Grid View" />
          <Tab label="List View" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {gear.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography color="textSecondary">{item.description}</Typography>
                    {item.condition && (
                      <Typography>Condition: {item.condition}</Typography>
                    )}
                    {item.purchaseDate && (
                      <Typography>Purchase Date: {item.purchaseDate}</Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handleOpenDetails(item.id)}
                    >
                      Details
                    </Button>
                    <IconButton
                      size="small" 
                      color="primary" 
                      onClick={() => handleOpenQRDialog(item)}
                    >
                      <QrCodeIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteGear(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            {gear.map((item) => (
              <ListItem key={item.id}>
                <ListItemText
                  primary={item.name}
                  secondary={item.description}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleOpenDetails(item.id)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteGear(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Gear Details Dialog */}
        <GearDetails
          gearId={selectedGearId || undefined}
          open={openDetails}
          onClose={handleCloseDetails}
          onUpdate={fetchGear}
        />

        {/* QR Code Scanner */}
        <QRScanner 
          open={openScanner} 
          onClose={handleCloseScanner}
          onScan={(data) => {
            if (data && data.includes('/gear/')) {
              const gearId = data.split('/gear/').pop();
              if (gearId) {
                // navigate(`/gear/${gearId}`);
              }
            }
            handleCloseScanner();
          }}
        />

        {/* Add/Edit Gear Dialog */}
        <Dialog open={openGearDialog} onClose={handleCloseGearDialog}>
          <DialogTitle>{selectedGear ? 'Edit' : 'Add'} Gear</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={gearForm.name}
                    onChange={(e) => setGearForm({ ...gearForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={gearForm.description}
                    onChange={(e) => setGearForm({ ...gearForm, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Condition"
                    value={gearForm.condition}
                    onChange={(e) => setGearForm({ ...gearForm, condition: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Purchase Date"
                    type="date"
                    value={gearForm.purchaseDate}
                    onChange={(e) => setGearForm({ ...gearForm, purchaseDate: e.target.value || '' })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGearDialog}>Cancel</Button>
            <Button onClick={handleSaveGear} variant="contained" color="primary">
              {selectedGear ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={openQRDialog} onClose={handleCloseQRDialog}>
          <DialogTitle>QR Code for {selectedQRGear?.name}</DialogTitle>
          <DialogContent>
            {selectedQRGear && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <QRCodeCanvas
                  value={`windsurf-gear://${selectedQRGear.id}`}
                  size={200}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseQRDialog}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (selectedQRGear) {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    canvas.toBlob((blob) => {
                      if (blob) {
                        saveAs(blob, `qr-${selectedQRGear.name}.png`);
                      }
                    });
                  }
                }
              }}
            >
              Save QR Code
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default GearTracker;
