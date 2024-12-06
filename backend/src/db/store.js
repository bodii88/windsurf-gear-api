const fs = require('fs').promises;
const path = require('path');

class Store {
    constructor(filename) {
        this.filename = filename;
        this.data = {
            users: [],
            items: []
        };
    }

    async load() {
        try {
            const data = await fs.readFile(this.filename, 'utf8');
            this.data = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create it with empty data
            await this.save();
        }
    }

    async save() {
        await fs.writeFile(this.filename, JSON.stringify(this.data, null, 2));
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
