const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database Tables
const initDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS cars (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255),
                make VARCHAR(100),
                model VARCHAR(100),
                trim VARCHAR(100),
                year INTEGER,
                price INTEGER,
                mileage INTEGER,
                fuel VARCHAR(50),
                transmission VARCHAR(50),
                "bodyType" VARCHAR(50),
                colour VARCHAR(50),
                engine VARCHAR(50),
                doors INTEGER,
                seats INTEGER,
                description TEXT,
                features JSONB,
                images JSONB,
                status VARCHAR(50) DEFAULT 'available',
                featured BOOLEAN DEFAULT false
            );
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255),
                slug VARCHAR(255) UNIQUE,
                excerpt TEXT,
                content TEXT,
                "coverImage" VARCHAR(255),
                author VARCHAR(100),
                tags JSONB,
                status VARCHAR(50) DEFAULT 'draft',
                "publishedDate" TIMESTAMP,
                published BOOLEAN DEFAULT false
            );
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE,
                password VARCHAR(255)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS vehicle_expenses (
                id VARCHAR(50) PRIMARY KEY,
                make VARCHAR(100) NOT NULL,
                model VARCHAR(100) NOT NULL,
                registration VARCHAR(50),
                buying_price NUMERIC NOT NULL,
                status VARCHAR(50) NOT NULL,
                selling_price NUMERIC DEFAULT 0,
                profit_loss NUMERIC NOT NULL,
                expenses JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration query to add registration column if the table already exists
        await db.query(`
            ALTER TABLE vehicle_expenses ADD COLUMN IF NOT EXISTS registration VARCHAR(50);
        `);
        
        const adminCheck = await db.query(`SELECT * FROM admins WHERE username = 'admin'`);
        if (adminCheck.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash('Mehraan@7658', salt);
            await db.query(`INSERT INTO admins (username, password) VALUES ('admin', $1)`, [hashed]);
        }
        
        console.log('Neon Database Tables Initialized Successfully!');
    } catch (err) {
        console.error('Error initializing DB tables:', err);
    }
};

initDB();

// --- CARS API ---

app.get('/api/cars', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cars');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/cars', async (req, res) => {
    const car = req.body;
    try {
        const result = await db.query(
            `INSERT INTO cars (id, title, make, model, trim, year, price, mileage, fuel, transmission, "bodyType", colour, engine, doors, seats, description, features, images, status, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
            [car.id, car.title, car.make, car.model, car.trim, car.year, car.price, car.mileage, car.fuel, car.transmission, car.bodyType, car.colour, car.engine, car.doors, car.seats, car.description, JSON.stringify(car.features), JSON.stringify(car.images), car.status, car.featured]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    const car = req.body;
    try {
        const result = await db.query(
            `UPDATE cars SET title=$1, make=$2, model=$3, trim=$4, year=$5, price=$6, mileage=$7, fuel=$8, transmission=$9, "bodyType"=$10, colour=$11, engine=$12, doors=$13, seats=$14, description=$15, features=$16, images=$17, status=$18, featured=$19
             WHERE id=$20 RETURNING *`,
            [car.title, car.make, car.model, car.trim, car.year, car.price, car.mileage, car.fuel, car.transmission, car.bodyType, car.colour, car.engine, car.doors, car.seats, car.description, JSON.stringify(car.features), JSON.stringify(car.images), car.status, car.featured, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM cars WHERE id=$1', [req.params.id]);
        res.json({ message: 'Car deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- BLOGS API ---

app.get('/api/blogs', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM blogs');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/blogs', async (req, res) => {
    const blog = req.body;
    try {
        const result = await db.query(
            `INSERT INTO blogs (id, title, slug, excerpt, content, "coverImage", author, tags, status, "publishedDate", published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [blog.id, blog.title, blog.slug, blog.excerpt, blog.content, blog.coverImage, blog.author, JSON.stringify(blog.tags), blog.status, blog.publishedDate, blog.published]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/blogs/:id', async (req, res) => {
    const { id } = req.params;
    const blog = req.body;
    try {
        const result = await db.query(
            `UPDATE blogs SET title=$1, slug=$2, excerpt=$3, content=$4, "coverImage"=$5, author=$6, tags=$7, status=$8, "publishedDate"=$9, published=$10
             WHERE id=$11 RETURNING *`,
            [blog.title, blog.slug, blog.excerpt, blog.content, blog.coverImage, blog.author, JSON.stringify(blog.tags), blog.status, blog.publishedDate, blog.published, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/blogs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM blogs WHERE id=$1', [req.params.id]);
        res.json({ message: 'Blog deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN AUTH ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const valid = await bcrypt.compare(password, result.rows[0].password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        
        res.json({ success: true, user: username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- VEHICLE EXPENSES API ---

app.get('/api/vehicle-expenses', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vehicle_expenses ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/vehicle-expenses', async (req, res) => {
    const { id, make, model, registration, buying_price, status, selling_price, profit_loss, expenses } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO vehicle_expenses (id, make, model, registration, buying_price, status, selling_price, profit_loss, expenses, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
            [id, make, model, registration, buying_price, status, selling_price, profit_loss, JSON.stringify(expenses)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/vehicle-expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { make, model, registration, buying_price, status, selling_price, profit_loss, expenses } = req.body;
    try {
        const result = await db.query(
            `UPDATE vehicle_expenses 
             SET make=$1, model=$2, registration=$3, buying_price=$4, status=$5, selling_price=$6, profit_loss=$7, expenses=$8, updated_at=NOW()
             WHERE id=$9 RETURNING *`,
            [make, model, registration, buying_price, status, selling_price, profit_loss, JSON.stringify(expenses), id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/vehicle-expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM vehicle_expenses WHERE id=$1', [id]);
        res.json({ message: 'Vehicle expense record deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`API Backend running securely on port ${PORT}`);
});
