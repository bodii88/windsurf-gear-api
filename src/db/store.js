const fs = require('fs').promises;
const path = require('path');

class Store {
    constructor(filename) {
        this.filename = filename;
        this.data = {
            users: [],
            items: [],
            locations: [],
            categories: []
        };
    }

    async load() {
        try {
            const data = await fs.readFile(this.filename, 'utf8');
            this.data = JSON.parse(data);
            // Initialize arrays if they don't exist
            this.data.locations = this.data.locations || [];
            this.data.categories = this.data.categories || [];
        } catch (error) {
            // If file doesn't exist, create it with empty data
            await this.save();
        }
    }

    async save() {
        await fs.writeFile(this.filename, JSON.stringify(this.data, null, 2));
    }

    // Location methods
    async findLocations(userId) {
        return this.data.locations.filter(location => location.userId === userId);
    }

    async findLocationById(id) {
        return this.data.locations.find(location => location.id === id);
    }

    async createLocation(location) {
        const newLocation = { ...location, id: Date.now().toString() };
        this.data.locations.push(newLocation);
        await this.save();
        return newLocation;
    }

    async updateLocation(id, updates) {
        const index = this.data.locations.findIndex(location => location.id === id);
        if (index === -1) return null;
        
        this.data.locations[index] = { ...this.data.locations[index], ...updates };
        await this.save();
        return this.data.locations[index];
    }

    async deleteLocation(id) {
        const index = this.data.locations.findIndex(location => location.id === id);
        if (index === -1) return false;
        
        this.data.locations.splice(index, 1);
        await this.save();
        return true;
    }

    // Category methods
    async findCategories(userId) {
        return this.data.categories.filter(category => category.userId === userId);
    }

    async findCategoryById(id) {
        return this.data.categories.find(category => category.id === id);
    }

    async createCategory(category) {
        const newCategory = { ...category, id: Date.now().toString() };
        this.data.categories.push(newCategory);
        await this.save();
        return newCategory;
    }

    async updateCategory(id, updates) {
        const index = this.data.categories.findIndex(category => category.id === id);
        if (index === -1) return null;
        
        this.data.categories[index] = { ...this.data.categories[index], ...updates };
        await this.save();
        return this.data.categories[index];
    }

    async deleteCategory(id) {
        const index = this.data.categories.findIndex(category => category.id === id);
        if (index === -1) return false;
        
        this.data.categories.splice(index, 1);
        await this.save();
        return true;
    }

    // User methods
    async createUser(user) {
        const newUser = { ...user, id: Date.now().toString() };
        this.data.users.push(newUser);
        await this.save();
        return newUser;
    }

    async findUserByEmail(email) {
        return this.data.users.find(user => user.email === email);
    }

    async findUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    // Item methods
    async createItem(item) {
        const newItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() };
        this.data.items.push(newItem);
        await this.save();
        return newItem;
    }

    async findItemsByUser(userId) {
        return this.data.items.filter(item => item.userId === userId);
    }

    async findItemById(id) {
        return this.data.items.find(item => item.id === id);
    }

    async updateItem(id, updates) {
        const index = this.data.items.findIndex(item => item.id === id);
        if (index === -1) return null;
        
        this.data.items[index] = { ...this.data.items[index], ...updates };
        await this.save();
        return this.data.items[index];
    }

    async deleteItem(id) {
        const index = this.data.items.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        this.data.items.splice(index, 1);
        await this.save();
        return true;
    }
}

const store = new Store(path.join(__dirname, 'data.json'));
store.load(); // Load initial data

module.exports = store;
