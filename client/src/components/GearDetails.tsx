import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QRCodeSVG } from 'qrcode.react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format } from 'date-fns';
import api from '../services/api';

interface GearDetailsProps {
  open: boolean;
  gearId?: number;
  onClose: () => void;
  onUpdate: () => void;
}

interface GearItem {
  id: number;
  name: string;
  type: string;
  description: string;
  purchaseDate: string;
  condition: string;
  locationId?: number;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
}

interface Location {
  id: number;
  name: string;
  description: string;
}

interface MaintenanceRecord {
  id: number;
  gear_id: number;
  date: string;
  type: string;
  description: string;
  cost: number;
}

interface Box {
  id: string;
  name: string;
  description: string;
}

export default function GearDetails({ open, gearId, onClose, onUpdate }: GearDetailsProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    purchaseDate: string;
    condition: string;
    locationId: number | null;
    categoryId: number | null;
  }>({
    name: '',
    description: '',
    purchaseDate: '',
    condition: '',
    locationId: null,
    categoryId: null
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [defaultTypes] = useState(['Board', 'Sail', 'Mast', 'Boom', 'Fin', 'Other']);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxDescription, setNewBoxDescription] = useState('');
  const [boxesExpanded, setBoxesExpanded] = useState(true);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [newMaintenanceDate, setNewMaintenanceDate] = useState<Date | null>(new Date());
  const [newMaintenanceType, setNewMaintenanceType] = useState('');
  const [newMaintenanceDescription, setNewMaintenanceDescription] = useState('');
  const [newMaintenanceCost, setNewMaintenanceCost] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchLocations();
    if (gearId) {
      fetchGearDetails();
      fetchBoxes();
      fetchMaintenanceRecords();
    } else {
      resetForm();
    }
  }, [gearId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/locations');
      if (response.data && response.data.locations) {
        setLocations(response.data.locations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchGearDetails = async () => {
    try {
      const response = await api.get(`/api/items/${gearId}`);
      if (response.data) {
        setFormData(response.data);
        if (response.data.purchaseDate) {
          setSelectedDate(new Date(response.data.purchaseDate));
        }
      }
    } catch (error) {
      console.error('Error fetching gear details:', error);
    }
  };

  const fetchBoxes = async () => {
    if (!gearId) return;
    try {
      const response = await api.get(`/api/items/${gearId}/boxes`);
      if (response.data) {
        setBoxes(response.data);
      }
    } catch (error) {
      console.error('Error fetching boxes:', error);
    }
  };

  const fetchMaintenanceRecords = async () => {
    if (!gearId) return;
    
    try {
      const response = await api.get(`/api/maintenance/${gearId}`);
      if (response.data) {
        setMaintenanceRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      purchaseDate: '',
      condition: '',
      locationId: null,
      categoryId: null
    });
    setSelectedDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      console.error('Name is required');
      return;
    }

    console.log('Submitting form data:', formData); // Debug log
    
    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        purchaseDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        condition: formData.condition?.trim() || '',
        locationId: formData.locationId,
        categoryId: formData.categoryId
      };

      console.log('Sending request:', requestData); // Debug log
      
      let response;
      if (gearId) {
        response = await api.put(`/api/items/${gearId}`, requestData);
      } else {
        response = await api.post('/api/items', requestData);
      }

      console.log('Server response:', response.data); // Debug log

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving gear:', error);
    }
  };

  const handleAddBox = async () => {
    if (!gearId || !newBoxName) return;

    try {
      const response = await api.post(`/api/items/${gearId}/boxes`, {
        name: newBoxName,
        description: newBoxDescription,
      });

      if (response.data) {
        setBoxes([...boxes, response.data]);
        setNewBoxName('');
        setNewBoxDescription('');
      }
    } catch (error) {
      console.error('Error adding box:', error);
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    try {
      await api.delete(`/api/items/${gearId}/boxes/${boxId}`);
      setBoxes(boxes.filter(box => box.id !== boxId));
    } catch (error) {
      console.error('Error deleting box:', error);
    }
  };

  const handleAddMaintenanceRecord = async () => {
    if (!gearId || !newMaintenanceDate) return;

    try {
      const response = await api.post('/api/maintenance', {
        gear_id: gearId,
        date: format(newMaintenanceDate, 'yyyy-MM-dd'),
        type: newMaintenanceType,
        description: newMaintenanceDescription,
        cost: parseFloat(newMaintenanceCost) || 0
      });

      if (response.data) {
        setNewMaintenanceDate(new Date());
        setNewMaintenanceType('');
        setNewMaintenanceDescription('');
        setNewMaintenanceCost('');
        fetchMaintenanceRecords();
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
    }
  };

  const handleDeleteMaintenanceRecord = async (id: number) => {
    try {
      await api.delete(`/api/maintenance/${id}`);
      fetchMaintenanceRecords();
      onUpdate();
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
    }
  };

  const getTypeOptions = () => {
    const typeOptions = [...defaultTypes];
    categories.forEach(category => {
      if (!typeOptions.includes(category.name)) {
        typeOptions.push(category.name);
      }
    });
    return typeOptions;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={false}
        keepMounted={false}
        onBackdropClick={onClose}
        aria-labelledby="gear-details-dialog-title"
      >
        <DialogTitle id="gear-details-dialog-title">
          {gearId ? 'Edit Gear' : 'Add New Gear'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              select
              label="Location"
              value={formData.locationId || ''}
              onChange={(e) => setFormData({
                ...formData,
                locationId: e.target.value ? parseInt(e.target.value, 10) : null
              })}
              margin="normal"
            >
              <MenuItem value="">None</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Category"
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({
                ...formData,
                categoryId: e.target.value ? parseInt(e.target.value, 10) : null
              })}
              margin="normal"
            >
              <MenuItem value="">None</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />

            <DatePicker
              label="Purchase Date"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal"
                }
              }}
            />

            <TextField
              fullWidth
              select
              label="Condition"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              margin="normal"
            >
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </TextField>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {gearId ? 'Update' : 'Add'}
              </Button>
            </Box>
          </form>

          {gearId && (
            <>
              {/* Boxes Section */}
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Boxes
                  </Typography>
                  <IconButton onClick={() => setBoxesExpanded(!boxesExpanded)}>
                    {boxesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={boxesExpanded}>
                  <Grid container spacing={2}>
                    {/* Add New Box Form */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              label="Box Name"
                              value={newBoxName}
                              onChange={(e) => setNewBoxName(e.target.value)}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              label="Description"
                              value={newBoxDescription}
                              onChange={(e) => setNewBoxDescription(e.target.value)}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={handleAddBox}
                              startIcon={<AddIcon />}
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Boxes List */}
                    {boxes.map((box) => (
                      <Grid item xs={12} sm={6} key={box.id}>
                        <Paper sx={{ p: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={8}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {box.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {box.description}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <QRCodeSVG
                                value={`${window.location.origin}/box/${box.id}`}
                                size={80}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteBox(box.id)}
                                sx={{ mt: 1 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </Box>

              {/* Maintenance Records Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Maintenance Records
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date"
                      value={newMaintenanceDate}
                      onChange={(date) => setNewMaintenanceDate(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: "normal"
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Type"
                      value={newMaintenanceType}
                      onChange={(e) => setNewMaintenanceType(e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={newMaintenanceDescription}
                      onChange={(e) => setNewMaintenanceDescription(e.target.value)}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cost"
                      type="number"
                      value={newMaintenanceCost}
                      onChange={(e) => setNewMaintenanceCost(e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMaintenanceRecord}
                      disabled={!newMaintenanceDate || !newMaintenanceType || !newMaintenanceDescription}
                    >
                      Add Record
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      {maintenanceRecords.map((record) => (
                        <ListItem key={record.id}>
                          <ListItemText
                            primary={`${record.type} - ${format(new Date(record.date), 'MM/dd/yyyy')}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  {record.description}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                  Cost: ${record.cost}
                                </Typography>
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteMaintenanceRecord(record.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}
