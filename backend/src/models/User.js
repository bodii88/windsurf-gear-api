const bcrypt = require('bcryptjs');
const store = require('../db/store');

class User {
    static async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return store.createUser({
            ...userData,
            password: hashedPassword,
            isVerified: false
        });
    }

    static async findByEmail(email) {
        return store.findUserByEmail(email);
    }

    static async findById(id) {
        return store.findUserById(id);
    }

    static async verifyPassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
}

module.exports = User;
