"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';
let db;
function setupDatabase() {
    console.log('Setting up database connection...');
    if (db) {
        console.log('Closing existing database connection...');
        db.close();
    }
    db = new sqlite3_1.default.Database('gear.db', (err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            process.exit(1);
        }
        console.log('Connected to database successfully');
        initializeDatabase();
    });
    db.on('error', (err) => {
        console.error('Database error:', err);
        setTimeout(setupDatabase, 5000);
    });
}
async function initializeDatabase() {
    console.log('Initializing database tables...');
    const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gear (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      purchaseDate TEXT,
      condition TEXT,
      locationId INTEGER,
      categoryId INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (locationId) REFERENCES locations(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#1976d2',
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      gearId INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (gearId) REFERENCES gear (id)
    );
  `;
    try {
        await new Promise((resolve, reject) => {
            db.exec(createTables, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                }
                else {
                    console.log('Database tables initialized successfully');
                    resolve();
                }
            });
        });
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}
setupDatabase();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((_req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
const clientBuildPath = path_1.default.join(__dirname, '../../client/build');
const publicPath = path_1.default.join(__dirname, '../../client/public');
console.log('Build path:', clientBuildPath);
console.log('Public path:', publicPath);
app.use('/static', express_1.default.static(path_1.default.join(clientBuildPath, 'static'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
        else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));
app.get('/manifest.json', (_req, res) => {
    const buildManifestPath = path_1.default.join(clientBuildPath, 'manifest.json');
    const publicManifestPath = path_1.default.join(publicPath, 'manifest.json');
    console.log('Checking manifest paths:');
    console.log('- Build:', buildManifestPath);
    console.log('- Public:', publicManifestPath);
    let manifestPath = fs_1.default.existsSync(buildManifestPath) ? buildManifestPath : publicManifestPath;
    try {
        const manifestContent = fs_1.default.readFileSync(manifestPath, 'utf8');
        const parsedManifest = JSON.parse(manifestContent);
        console.log('Successfully loaded manifest from:', manifestPath);
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        res.json(parsedManifest);
    }
    catch (err) {
        console.error('Error serving manifest:', err);
        res.status(500).json({
            name: "Windsurf Gear Tracker",
            short_name: "Gear Tracker",
            start_url: "/",
            display: "standalone",
            theme_color: "#000000",
            background_color: "#ffffff",
            icons: [
                {
                    src: "/favicon.ico",
                    sizes: "64x64 32x32 24x24 16x16",
                    type: "image/x-icon"
                }
            ]
        });
    }
});
app.use(express_1.default.static(clientBuildPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        else if (filePath.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
        }
        else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Origin:', req.headers.origin);
    if (req.method !== 'GET' && NODE_ENV === 'development') {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/api/register', async (req, res) => {
    console.log('Registration endpoint hit');
    try {
        const { email, password, name, phone } = req.body;
        console.log('Processing registration for:', email);
        if (!email || !password) {
            console.log('Registration failed: Missing required fields');
            return res.status(400).json({
                error: 'Missing required fields',
                details: {
                    email: !email,
                    password: !password
                }
            });
        }
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    console.error('Database error checking existing user:', err);
                    reject(err);
                }
                resolve(row);
            });
        });
        if (existingUser) {
            console.log('Registration failed: User already exists');
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await new Promise((resolve, reject) => {
            const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
            const params = [email, hashedPassword, name || null, phone || null];
            console.log('Executing query:', query);
            db.run(query, params, function (err) {
                if (err) {
                    console.error('Database error creating user:', err);
                    reject(err);
                }
                else {
                    console.log('User created successfully. ID:', this.lastID);
                    resolve();
                }
            });
        });
        console.log('Registration successful for:', email);
        res.status(201).json({
            message: 'User registered successfully',
            email: email
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/test', (req, res) => {
    console.log('Test endpoint hit:', req.body);
    res.json({ message: 'Test endpoint working', receivedData: req.body });
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Server error' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const validPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET);
            res.json({ token });
        });
    }
    catch (error) {
        console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
function authenticateToken(_, res, next) {
    const authHeader = _.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        _.user = user;
        next();
    });
}
;
app.use('/api', authenticateToken);
app.get('/api/gear', (req, res) => {
    const userId = req.user.id;
    db.all(`
    SELECT g.*, l.name as locationName, c.name as categoryName, c.color as categoryColor
    FROM gear g
    LEFT JOIN locations l ON g.locationId = l.id
    LEFT JOIN categories c ON g.categoryId = c.id
    WHERE g.userId = ?
  `, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching gear:', err);
            return res.status(500).json({ message: 'Error fetching gear' });
        }
        res.json(rows);
    });
});
app.get('/api/gear/:id', (req, res) => {
    const userId = req.user.id;
    const gearId = req.params.id;
    db.get(`
    SELECT g.*, l.name as locationName, c.name as categoryName, c.color as categoryColor
    FROM gear g
    LEFT JOIN locations l ON g.locationId = l.id
    LEFT JOIN categories c ON g.categoryId = c.id
    WHERE g.id = ? AND g.userId = ?
  `, [gearId, userId], (err, row) => {
        if (err) {
            console.error('Error fetching gear:', err);
            return res.status(500).json({ message: 'Error fetching gear' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Gear not found' });
        }
        res.json(row);
    });
});
app.post('/api/gear', async (req, res) => {
    console.log('Creating new gear:', req.body);
    const { name, description, purchaseDate, condition, locationId, categoryId } = req.body;
    const userId = req.user.id;
    if (!name) {
        console.log('Missing required field name:', { name });
        return res.status(400).json({ message: 'Name is required' });
    }
    try {
        if (locationId) {
            const locationExists = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM locations WHERE id = ? AND userId = ?', [locationId, userId], (err, row) => {
                    if (err)
                        reject(err);
                    resolve(!!row);
                });
            });
            if (!locationExists) {
                console.error('Invalid locationId:', locationId);
                return res.status(400).json({ message: 'Invalid location ID' });
            }
        }
        if (categoryId) {
            const categoryExists = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM categories WHERE id = ? AND userId = ?', [categoryId, userId], (err, row) => {
                    if (err)
                        reject(err);
                    resolve(!!row);
                });
            });
            if (!categoryExists) {
                console.error('Invalid categoryId:', categoryId);
                return res.status(400).json({ message: 'Invalid category ID' });
            }
        }
        const result = await new Promise((resolve, reject) => {
            console.log('Inserting gear with values:', {
                userId,
                name,
                description,
                purchaseDate,
                condition,
                locationId: locationId || null,
                categoryId: categoryId || null
            });
            db.run(`INSERT INTO gear (userId, name, description, purchaseDate, condition, locationId, categoryId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, name, description, purchaseDate, condition, locationId || null, categoryId || null], function (err) {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                }
                else {
                    resolve({ id: this.lastID });
                }
            });
        });
        console.log('Gear created successfully:', result);
        res.status(201).json({
            id: result.id,
            userId,
            name,
            description,
            purchaseDate,
            condition,
            locationId,
            categoryId
        });
    }
    catch (error) {
        console.error('Error in gear creation:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            message: 'Error creating gear',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.put('/api/gear/:id', (req, res) => {
    const { name, description, purchaseDate, condition, locationId, categoryId } = req.body;
    const gearId = req.params.id;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    db.run(`UPDATE gear 
     SET name = ?, description = ?, purchaseDate = ?, condition = ?, locationId = ?, categoryId = ?
     WHERE id = ? AND userId = ?`, [name, description, purchaseDate, condition, locationId || null, categoryId || null, gearId, userId], function (err) {
        if (err) {
            console.error('Error updating gear:', err);
            return res.status(500).json({ message: 'Error updating gear' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Gear not found or unauthorized' });
        }
        res.json({
            id: gearId,
            name,
            description,
            purchaseDate,
            condition,
            locationId,
            categoryId
        });
    });
});
app.delete('/api/gear/:id', (req, res) => {
    const gearId = req.params.id;
    const userId = req.user.id;
    db.run('DELETE FROM gear WHERE id = ? AND userId = ?', [gearId, userId], function (err) {
        if (err) {
            console.error('Error deleting gear:', err);
            return res.status(500).json({ message: 'Error deleting gear' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Gear not found or unauthorized' });
        }
        res.json({ message: 'Gear deleted successfully' });
    });
});
app.get('/api/gear/:gearId/boxes', (req, res) => {
    const { gearId } = req.params;
    const userId = req.user.id;
    db.get('SELECT id FROM gear WHERE id = ? AND userId = ?', [gearId, userId], (err, gear) => {
        if (err) {
            console.error('Error checking gear ownership:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!gear) {
            return res.status(404).json({ message: 'Gear not found or unauthorized' });
        }
        db.all('SELECT * FROM boxes WHERE gearId = ?', [gearId], (err, boxes) => {
            if (err) {
                console.error('Error fetching boxes:', err);
                return res.status(500).json({ message: 'Error fetching boxes' });
            }
            res.json(boxes);
        });
    });
});
app.post('/api/gear/:gearId/boxes', (req, res) => {
    const { gearId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Box name is required' });
    }
    db.get('SELECT id FROM gear WHERE id = ? AND userId = ?', [gearId, userId], (err, gear) => {
        if (err) {
            console.error('Error checking gear ownership:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!gear) {
            return res.status(404).json({ message: 'Gear not found or unauthorized' });
        }
        const boxId = crypto_1.default.randomUUID();
        db.run('INSERT INTO boxes (id, gearId, name, description) VALUES (?, ?, ?, ?)', [boxId, gearId, name, description], (err) => {
            if (err) {
                console.error('Error creating box:', err);
                return res.status(500).json({ message: 'Error creating box' });
            }
            res.status(201).json({
                id: boxId,
                gearId,
                name,
                description,
            });
        });
    });
});
app.delete('/api/gear/:gearId/boxes/:boxId', (req, res) => {
    const { gearId, boxId } = req.params;
    const userId = req.user.id;
    db.get('SELECT id FROM gear WHERE id = ? AND userId = ?', [gearId, userId], (err, gear) => {
        if (err) {
            console.error('Error checking gear ownership:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!gear) {
            return res.status(404).json({ message: 'Gear not found or unauthorized' });
        }
        db.run('DELETE FROM boxes WHERE id = ? AND gearId = ?', [boxId, gearId], function (err) {
            if (err) {
                console.error('Error deleting box:', err);
                return res.status(500).json({ message: 'Error deleting box' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Box not found' });
            }
            res.json({ message: 'Box deleted successfully' });
        });
    });
});
app.get('/api/locations', (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM locations WHERE userId = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching locations:', err);
            return res.status(500).json({ message: 'Error fetching locations' });
        }
        res.json(rows);
    });
});
app.post('/api/locations', (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    console.log('Creating location with:', { userId, name, description });
    db.run('INSERT INTO locations (user_id, name, description) VALUES (?, ?, ?)', [userId, name, description], function (err) {
        if (err) {
            console.error('Error creating location:', err);
            return res.status(500).json({ message: 'Error creating location' });
        }
        res.status(201).json({ id: this.lastID, name, description });
    });
});
app.put('/api/locations/:id', (req, res) => {
    const { name, description } = req.body;
    const locationId = req.params.id;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    db.run('UPDATE locations SET name = ?, description = ? WHERE id = ? AND userId = ?', [name, description, locationId, userId], function (err) {
        if (err) {
            console.error('Error updating location:', err);
            return res.status(500).json({ message: 'Error updating location' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Location not found or unauthorized' });
        }
        res.json({ id: locationId, name, description });
    });
});
app.delete('/api/locations/:id', (req, res) => {
    const locationId = req.params.id;
    const userId = req.user.id;
    db.run('DELETE FROM locations WHERE id = ? AND userId = ?', [locationId, userId], function (err) {
        if (err) {
            console.error('Error deleting location:', err);
            return res.status(500).json({ message: 'Error deleting location' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Location not found or unauthorized' });
        }
        res.json({ message: 'Location deleted successfully' });
    });
});
app.get('/api/categories', (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM categories WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ message: 'Error fetching categories' });
        }
        res.json(rows);
    });
});
app.post('/api/categories', (req, res) => {
    const { name, description, color } = req.body;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    console.log('Creating category with:', { userId, name, description, color });
    db.run('INSERT INTO categories (user_id, name, description, color) VALUES (?, ?, ?, ?)', [userId, name, description, color || '#1976d2'], function (err) {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ message: 'Error creating category' });
        }
        res.status(201).json({ id: this.lastID, name, description, color });
    });
});
app.put('/api/categories/:id', (req, res) => {
    const { name, description, color } = req.body;
    const categoryId = req.params.id;
    const userId = req.user.id;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    db.run('UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ? AND user_id = ?', [name, description, color || '#1976d2', categoryId, userId], function (err) {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ message: 'Error updating category' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }
        res.json({ id: categoryId, name, description, color });
    });
});
app.delete('/api/categories/:id', (req, res) => {
    const categoryId = req.params.id;
    const userId = req.user.id;
    db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId], function (err) {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ message: 'Error deleting category' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }
        res.json({ message: 'Category deleted successfully' });
    });
});
app.post('/api/dev/restart', (_, res) => {
    console.log('Restarting server and reinitializing database...');
    initializeDatabase();
    res.json({ message: 'Server restarted and database reinitialized' });
});
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    console.log('Serving index.html for path:', req.path);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path_1.default.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error loading page');
        }
    });
});
const server = app.listen(PORT, () => {
    console.log(`Server environment: ${NODE_ENV}`);
    console.log(`CORS origin: ${CORS_ORIGIN}`);
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        db.close(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});
