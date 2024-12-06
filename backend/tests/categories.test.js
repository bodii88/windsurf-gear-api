const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = '';
let categoryId = '';

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

describe('Category API Tests', () => {
    test('Complete category workflow', async () => {
        try {
            // Step 1: Register and login to get token
            const registerResponse = await api.post('/auth/register', testUser);
            if (registerResponse.status !== 201) {
                console.error('Registration failed:', registerResponse.data);
                throw new Error(`Registration failed with status ${registerResponse.status}: ${JSON.stringify(registerResponse.data)}`);
            }
            expect(registerResponse.status).toBe(201);
            
            // For testing purposes, we'll use the registration token
            authToken = registerResponse.data.token;
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

            // Step 2: Create a category
            const createResponse = await api.post('/categories', {
                name: 'Sails',
                description: 'All types of windsurfing sails',
                color: '#FF5733'
            });
            if (createResponse.status !== 201) {
                console.error('Create category failed:', createResponse.data);
                throw new Error(`Create category failed with status ${createResponse.status}: ${JSON.stringify(createResponse.data)}`);
            }
            expect(createResponse.status).toBe(201);
            categoryId = createResponse.data.category._id;

            // Step 3: Get all categories
            const getAllResponse = await api.get('/categories');
            if (getAllResponse.status !== 200) {
                console.error('Get categories failed:', getAllResponse.data);
                throw new Error(`Get categories failed with status ${getAllResponse.status}: ${JSON.stringify(getAllResponse.data)}`);
            }
            expect(getAllResponse.status).toBe(200);
            expect(getAllResponse.data.categories.length).toBeGreaterThan(0);

            // Step 4: Get single category
            const getOneResponse = await api.get(`/categories/${categoryId}`);
            if (getOneResponse.status !== 200) {
                console.error('Get category failed:', getOneResponse.data);
                throw new Error(`Get category failed with status ${getOneResponse.status}: ${JSON.stringify(getOneResponse.data)}`);
            }
            expect(getOneResponse.status).toBe(200);

            // Step 5: Update category
            const updateResponse = await api.put(`/categories/${categoryId}`, {
                name: 'Racing Sails',
                description: 'High-performance racing sails'
            });
            if (updateResponse.status !== 200) {
                console.error('Update category failed:', updateResponse.data);
                throw new Error(`Update category failed with status ${updateResponse.status}: ${JSON.stringify(updateResponse.data)}`);
            }
            expect(updateResponse.status).toBe(200);

            // Step 6: Test duplicate name
            const duplicateResponse = await api.post('/categories', {
                name: 'Racing Sails',
                description: 'This should fail'
            });
            expect(duplicateResponse.status).not.toBe(201);

            // Step 7: Delete category
            const deleteResponse = await api.delete(`/categories/${categoryId}`);
            if (deleteResponse.status !== 200) {
                console.error('Delete category failed:', deleteResponse.data);
                throw new Error(`Delete category failed with status ${deleteResponse.status}: ${JSON.stringify(deleteResponse.data)}`);
            }
            expect(deleteResponse.status).toBe(200);

            // Step 8: Verify deletion
            const verifyResponse = await api.get(`/categories/${categoryId}`);
            expect(verifyResponse.status).toBe(404);

        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
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
