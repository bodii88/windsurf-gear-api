import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface UserProfile {
  name: string;
  email: string;
  mobile: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    mobile: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      setError('Failed to fetch profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/api/profile',
        profile,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Mobile"
            name="mobile"
            value={profile.mobile}
            onChange={handleChange}
            disabled={!isEditing}
            margin="normal"
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
