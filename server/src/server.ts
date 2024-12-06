// Type declaration for Request with user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';  // Allow all origins in development
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database setup with reconnection logic
let db: sqlite3.Database;

function setupDatabase() {
  console.log('Setting up database connection...');
  
  // Close existing connection if it exists
  if (db) {
    console.log('Closing existing database connection...');
    db.close();
  }

  // Create new connection
  db = new sqlite3.Database('gear.db', (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      process.exit(1);
    }
    console.log('Connected to database successfully');
    initializeDatabase();
  });

  // Set up error handler
  db.on('error', (err) => {
    console.error('Database error:', err);
    // Attempt to reconnect
    setTimeout(setupDatabase, 5000);
  });
}

// Initialize database tables
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
    await new Promise<void>((resolve, reject) => {
      db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables initialized successfully');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Call setup on startup
setupDatabase();

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: true, // This allows all origins but maintains CORS protection
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic security headers without Permissions-Policy
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configure paths
const clientBuildPath = path.join(__dirname, '../../client/build');
const publicPath = path.join(__dirname, '../../client/public');
console.log('Build path:', clientBuildPath);
console.log('Public path:', publicPath);

// Serve static files with proper content types
app.use('/static', express.static(path.join(clientBuildPath, 'static'), {
  setHeaders: (res: Response, filePath: string) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Serve manifest.json with fallback
app.get('/manifest.json', (_req: Request, res: Response) => {
  const buildManifestPath = path.join(clientBuildPath, 'manifest.json');
  const publicManifestPath = path.join(publicPath, 'manifest.json');
  
  console.log('Checking manifest paths:');
  console.log('- Build:', buildManifestPath);
  console.log('- Public:', publicManifestPath);
  
  let manifestPath = fs.existsSync(buildManifestPath) ? buildManifestPath : publicManifestPath;
  
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const parsedManifest = JSON.parse(manifestContent);
    console.log('Successfully loaded manifest from:', manifestPath);
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.json(parsedManifest);
  } catch (err) {
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

// Serve other static files from build directory
app.use(express.static(clientBuildPath, {
  setHeaders: (res: Response, filePath: string) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Request logging middleware with more details
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  if (req.method !== 'GET' && NODE_ENV === 'development') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// API Routes - these need to come BEFORE static file serving
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registration endpoint
app.post('/api/register', async (req: Request, res: Response) => {
  console.log('Registration endpoint hit');
  try {
    const { email, password, name, phone } = req.body;
    console.log('Processing registration for:', email);

    // Validate required fields
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

    // Check if user exists
    const existingUser = await new Promise<any>((resolve, reject) => {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await new Promise<void>((resolve, reject) => {
      const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
      const params = [email, hashedPassword, name || null, phone || null];
      
      console.log('Executing query:', query);
      db.run(query, params, function(err) {
        if (err) {
          console.error('Database error creating user:', err);
          reject(err);
        } else {
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint
app.post('/api/test', (req: Request, res: Response) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ message: 'Test endpoint working', receivedData: req.body });
});

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err: Error | null, user: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      res.json({ token });
    });
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Authentication middleware
function authenticateToken(_: Request, res: Response, next: NextFunction) {
  const authHeader = _.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    _.user = user;
    next();
  });
};

// All other API routes
app.use('/api', authenticateToken);

// Gear endpoints
app.get('/api/gear', (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT g.*, l.name as locationName, c.name as categoryName, c.color as categoryColor
    FROM gear g
    LEFT JOIN locations l ON g.locationId = l.id
    LEFT JOIN categories c ON g.categoryId = c.id
    WHERE g.userId = ?
  `, [userId], (err: Error | null, rows: any[]) => {
    if (err) {
      console.error('Error fetching gear:', err);
      return res.status(500).json({ message: 'Error fetching gear' });
    }
    res.json(rows);
  });
});

app.get('/api/gear/:id', (req: Request, res: Response) => {
  const userId = req.user.id;
  const gearId = req.params.id;
  
  db.get(`
    SELECT g.*, l.name as locationName, c.name as categoryName, c.color as categoryColor
    FROM gear g
    LEFT JOIN locations l ON g.locationId = l.id
    LEFT JOIN categories c ON g.categoryId = c.id
    WHERE g.id = ? AND g.userId = ?
  `, [gearId, userId], (err: Error | null, row: any) => {
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

app.post('/api/gear', async (req: Request, res: Response) => {
  console.log('Creating new gear:', req.body); // Debug log
  const { name, description, purchaseDate, condition, locationId, categoryId } = req.body;
  const userId = req.user.id;

  if (!name) {
    console.log('Missing required field name:', { name }); // Debug log
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    // Validate locationId if provided
    if (locationId) {
      const locationExists = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM locations WHERE id = ? AND userId = ?',
          [locationId, userId],
          (err: Error | null, row: any) => {
            if (err) reject(err);
            resolve(!!row);
          }
        );
      });

      if (!locationExists) {
        console.error('Invalid locationId:', locationId);
        return res.status(400).json({ message: 'Invalid location ID' });
      }
    }

    // Validate categoryId if provided
    if (categoryId) {
      const categoryExists = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM categories WHERE id = ? AND userId = ?',
          [categoryId, userId],
          (err: Error | null, row: any) => {
            if (err) reject(err);
            resolve(!!row);
          }
        );
      });

      if (!categoryExists) {
        console.error('Invalid categoryId:', categoryId);
        return res.status(400).json({ message: 'Invalid category ID' });
      }
    }

    // Insert gear
    const result: any = await new Promise((resolve, reject) => {
      console.log('Inserting gear with values:', {
        userId,
        name,
        description,
        purchaseDate,
        condition,
        locationId: locationId || null,
        categoryId: categoryId || null
      });

      db.run(
        `INSERT INTO gear (userId, name, description, purchaseDate, condition, locationId, categoryId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, description, purchaseDate, condition, locationId || null, categoryId || null],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
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
  } catch (error) {
    console.error('Error in gear creation:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ 
      message: 'Error creating gear',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/gear/:id', (req: Request, res: Response) => {
  const { name, description, purchaseDate, condition, locationId, categoryId } = req.body;
  const gearId = req.params.id;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    `UPDATE gear 
     SET name = ?, description = ?, purchaseDate = ?, condition = ?, locationId = ?, categoryId = ?
     WHERE id = ? AND userId = ?`,
    [name, description, purchaseDate, condition, locationId || null, categoryId || null, gearId, userId],
    function(err: Error | null) {
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
    }
  );
});

app.delete('/api/gear/:id', (req: Request, res: Response) => {
  const gearId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM gear WHERE id = ? AND userId = ?',
    [gearId, userId],
    function(err: Error | null) {
      if (err) {
        console.error('Error deleting gear:', err);
        return res.status(500).json({ message: 'Error deleting gear' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Gear not found or unauthorized' });
      }
      res.json({ message: 'Gear deleted successfully' });
    }
  );
});

// Boxes endpoints
app.get('/api/gear/:gearId/boxes', (req: Request, res: Response) => {
  const { gearId } = req.params;
  const userId = req.user.id;

  // First verify the gear belongs to the user
  db.get(
    'SELECT id FROM gear WHERE id = ? AND userId = ?',
    [gearId, userId],
    (err: Error | null, gear: any) => {
      if (err) {
        console.error('Error checking gear ownership:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!gear) {
        return res.status(404).json({ message: 'Gear not found or unauthorized' });
      }

      // Fetch boxes for the gear
      db.all(
        'SELECT * FROM boxes WHERE gearId = ?',
        [gearId],
        (err: Error | null, boxes: any[]) => {
          if (err) {
            console.error('Error fetching boxes:', err);
            return res.status(500).json({ message: 'Error fetching boxes' });
          }
          res.json(boxes);
        }
      );
    }
  );
});

app.post('/api/gear/:gearId/boxes', (req: Request, res: Response) => {
  const { gearId } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Box name is required' });
  }

  // First verify the gear belongs to the user
  db.get(
    'SELECT id FROM gear WHERE id = ? AND userId = ?',
    [gearId, userId],
    (err: Error | null, gear: any) => {
      if (err) {
        console.error('Error checking gear ownership:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!gear) {
        return res.status(404).json({ message: 'Gear not found or unauthorized' });
      }

      const boxId = crypto.randomUUID();

      // Create the box
      db.run(
        'INSERT INTO boxes (id, gearId, name, description) VALUES (?, ?, ?, ?)',
        [boxId, gearId, name, description],
        (err: Error | null) => {
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
        }
      );
    }
  );
});

app.delete('/api/gear/:gearId/boxes/:boxId', (req: Request, res: Response) => {
  const { gearId, boxId } = req.params;
  const userId = req.user.id;

  // First verify the gear belongs to the user
  db.get(
    'SELECT id FROM gear WHERE id = ? AND userId = ?',
    [gearId, userId],
    (err: Error | null, gear: any) => {
      if (err) {
        console.error('Error checking gear ownership:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!gear) {
        return res.status(404).json({ message: 'Gear not found or unauthorized' });
      }

      // Delete the box
      db.run(
        'DELETE FROM boxes WHERE id = ? AND gearId = ?',
        [boxId, gearId],
        function(err: Error | null) {
          if (err) {
            console.error('Error deleting box:', err);
            return res.status(500).json({ message: 'Error deleting box' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'Box not found' });
          }

          res.json({ message: 'Box deleted successfully' });
        }
      );
    }
  );
});

// Locations endpoints
app.get('/api/locations', (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM locations WHERE userId = ?', [userId], (err: Error | null, rows: any[]) => {
    if (err) {
      console.error('Error fetching locations:', err);
      return res.status(500).json({ message: 'Error fetching locations' });
    }
    res.json(rows);
  });
});

app.post('/api/locations', (req: Request, res: Response) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  console.log('Creating location with:', { userId, name, description });

  db.run(
    'INSERT INTO locations (user_id, name, description) VALUES (?, ?, ?)',
    [userId, name, description],
    function(err: Error | null) {
      if (err) {
        console.error('Error creating location:', err);
        return res.status(500).json({ message: 'Error creating location' });
      }
      res.status(201).json({ id: this.lastID, name, description });
    }
  );
});

app.put('/api/locations/:id', (req: Request, res: Response) => {
  const { name, description } = req.body;
  const locationId = req.params.id;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'UPDATE locations SET name = ?, description = ? WHERE id = ? AND userId = ?',
    [name, description, locationId, userId],
    function(err: Error | null) {
      if (err) {
        console.error('Error updating location:', err);
        return res.status(500).json({ message: 'Error updating location' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Location not found or unauthorized' });
      }
      res.json({ id: locationId, name, description });
    }
  );
});

app.delete('/api/locations/:id', (req: Request, res: Response) => {
  const locationId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM locations WHERE id = ? AND userId = ?',
    [locationId, userId],
    function(err: Error | null) {
      if (err) {
        console.error('Error deleting location:', err);
        return res.status(500).json({ message: 'Error deleting location' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Location not found or unauthorized' });
      }
      res.json({ message: 'Location deleted successfully' });
    }
  );
});

// Categories endpoints
app.get('/api/categories', (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM categories WHERE user_id = ?', [userId], (err: Error | null, rows: any[]) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ message: 'Error fetching categories' });
    }
    res.json(rows);
  });
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  console.log('Creating category with:', { userId, name, description, color });

  db.run(
    'INSERT INTO categories (user_id, name, description, color) VALUES (?, ?, ?, ?)',
    [userId, name, description, color || '#1976d2'],
    function(err: Error | null) {
      if (err) {
        console.error('Error creating category:', err);
        return res.status(500).json({ message: 'Error creating category' });
      }
      res.status(201).json({ id: this.lastID, name, description, color });
    }
  );
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const categoryId = req.params.id;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ? AND user_id = ?',
    [name, description, color || '#1976d2', categoryId, userId],
    function(err: Error | null) {
      if (err) {
        console.error('Error updating category:', err);
        return res.status(500).json({ message: 'Error updating category' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Category not found or unauthorized' });
      }
      res.json({ id: categoryId, name, description, color });
    }
  );
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId],
    function(err: Error | null) {
      if (err) {
        console.error('Error deleting category:', err);
        return res.status(500).json({ message: 'Error deleting category' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Category not found or unauthorized' });
      }
      res.json({ message: 'Category deleted successfully' });
    }
  );
});

// Add restart endpoint for development
app.post('/api/dev/restart', (_: Request, res: Response) => {
  console.log('Restarting server and reinitializing database...');
  initializeDatabase();
  res.json({ message: 'Server restarted and database reinitialized' });
});

// Catch-all route for React app - this must be the LAST route
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Log the request path
  console.log('Serving index.html for path:', req.path);
  
  // Set proper content type for HTML
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Start server with proper error handling
const server = app.listen(PORT, () => {
  console.log(`Server environment: ${NODE_ENV}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

// Handle graceful shutdown
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
