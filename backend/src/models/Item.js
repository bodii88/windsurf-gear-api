const store = require('../db/store');
const QRCode = require('qrcode');

class Item {
    static async create(itemData) {
        const qrCode = await QRCode.toDataURL(JSON.stringify({
            name: itemData.name,
            brand: itemData.brand
        }));

        return store.createItem({
            ...itemData,
            qrCode
        });
    }

    static async findByUser(userId) {
        return store.findItemsByUser(userId);
    }

    static async findById(id) {
        return store.findItemById(id);
    }

    static async update(id, updates) {
        return store.updateItem(id, updates);
    }

    static async delete(id) {
        return store.deleteItem(id);
    }
}

module.exports = Item;
