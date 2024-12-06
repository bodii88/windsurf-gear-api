const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = '';
let locationId = '';

const api = axios.create({
    baseURL: API_URL,
    validateStatus: () => true, // Don't throw on error status codes
    timeout: 10000 // 10 second timeout
});

// Generate a unique test user email
const timestamp = new Date().getTime();
const testUser = {
    email: `test${timestamp}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
};

// Increase Jest timeout
jest.setTimeout(30000);

describe('Location API Tests', () => {
    // Before all tests, register a test user
    beforeAll(async () => {
        try {
            const registerResponse = await api.post('/auth/register', testUser);
            expect(registerResponse.status).toBe(201);
            authToken = registerResponse.data.token;
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } catch (error) {
            console.error('Setup failed:', error.message);
            throw error;
        }
    });

    test('Complete location workflow', async () => {
        try {
            // Step 1: Create a location
            const createResponse = await api.post('/locations', {
                name: 'Lake Michigan',
                description: 'Great spot for windsurfing',
                coordinates: {
                    latitude: 43.9,
                    longitude: -86.4
                },
                type: 'Lake',
                windConditions: {
                    averageSpeed: 15,
                    direction: 'SW'
                }
            });
            expect(createResponse.status).toBe(201);
            locationId = createResponse.data.location._id;

            // Step 2: Get all locations
            const getAllResponse = await api.get('/locations');
            expect(getAllResponse.status).toBe(200);
            expect(getAllResponse.data.locations.length).toBeGreaterThan(0);

            // Step 3: Get single location
            const getOneResponse = await api.get(`/locations/${locationId}`);
            expect(getOneResponse.status).toBe(200);
            expect(getOneResponse.data.location.name).toBe('Lake Michigan');

            // Step 4: Update location with valid data
            const updateResponse = await api.put(`/locations/${locationId}`, {
                name: 'Lake Michigan - South Haven',
                description: 'Perfect for beginners and advanced riders',
                coordinates: {
                    latitude: 42.4,
                    longitude: -86.27
                },
                type: 'Lake',
                windConditions: {
                    averageSpeed: 18,
                    direction: 'NW'
                }
            });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.data.location.name).toBe('Lake Michigan - South Haven');

            // Step 5: Test duplicate name
            const duplicateResponse = await api.post('/locations', {
                name: 'Lake Michigan - South Haven',
                description: 'This should fail',
                coordinates: {
                    latitude: 43.9,
                    longitude: -86.4
                },
                type: 'Lake'
            });
            expect(duplicateResponse.status).toBe(400);

            // Step 6: Delete location
            const deleteResponse = await api.delete(`/locations/${locationId}`);
            expect(deleteResponse.status).toBe(200);

            // Step 7: Verify deletion
            const verifyResponse = await api.get(`/locations/${locationId}`);
            expect(verifyResponse.status).toBe(404);

        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    });

    test('Location validation', async () => {
        try {
            // Test missing required fields
            const missingFieldsResponse = await api.post('/locations', {
                description: 'Missing name and coordinates'
            });
            expect(missingFieldsResponse.status).toBe(400);

            // Test invalid coordinates
            const invalidCoordinatesResponse = await api.post('/locations', {
                name: 'Invalid Location',
                description: 'Testing invalid coordinates',
                coordinates: {
                    latitude: 91, // Invalid latitude (>90)
                    longitude: -180
                },
                type: 'Lake'
            });
            expect(invalidCoordinatesResponse.status).toBe(400);

            // Test invalid wind conditions
            const invalidWindResponse = await api.post('/locations', {
                name: 'Invalid Wind Data',
                description: 'Testing invalid wind data',
                coordinates: {
                    latitude: 43.9,
                    longitude: -86.4
                },
                type: 'Lake',
                windConditions: {
                    averageSpeed: -5, // Invalid negative speed
                    direction: 'INVALID'
                }
            });
            expect(invalidWindResponse.status).toBe(400);

            // Test invalid location type
            const invalidTypeResponse = await api.post('/locations', {
                name: 'Invalid Type',
                description: 'Testing invalid location type',
                coordinates: {
                    latitude: 43.9,
                    longitude: -86.4
                },
                type: 'InvalidType'
            });
            expect(invalidTypeResponse.status).toBe(400);

        } catch (error) {
            console.error('\n❌ Validation test failed:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    });

    // Cleanup after all tests
    afterAll(async () => {
        try {
            // Delete test user if needed
            if (authToken) {
                await api.delete('/auth/user');
            }
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    });
});
