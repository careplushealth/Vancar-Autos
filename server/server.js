const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const { sendInquiryEmail } = require('./email');
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
                vat_scheme VARCHAR(50) DEFAULT 'VAT Margin',
                expenses JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration query to add registration & vat_scheme columns if the table already exists
        await db.query(`
            ALTER TABLE vehicle_expenses ADD COLUMN IF NOT EXISTS registration VARCHAR(50);
            ALTER TABLE vehicle_expenses ADD COLUMN IF NOT EXISTS vat_scheme VARCHAR(50) DEFAULT 'VAT Margin';
        `);

        // Create contact submissions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id VARCHAR(50) PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(255),
                message TEXT,
                vehicle_details JSONB,
                status VARCHAR(50) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create invoices table
        await db.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id VARCHAR(50) PRIMARY KEY,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                invoice_date VARCHAR(50) NOT NULL,
                due_date VARCHAR(50) NOT NULL,
                customer_details JSONB NOT NULL,
                vehicle_details JSONB NOT NULL,
                sale_details JSONB NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create general expenses table
        await db.query(`
            CREATE TABLE IF NOT EXISTS general_expenses (
                id VARCHAR(50) PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                amount NUMERIC NOT NULL,
                date VARCHAR(50) NOT NULL,
                description TEXT,
                notes TEXT,
                receipt_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create deposit slips table
        await db.query(`
            CREATE TABLE IF NOT EXISTS deposit_slips (
                id VARCHAR(50) PRIMARY KEY,
                receipt_number VARCHAR(50) UNIQUE NOT NULL,
                receipt_date VARCHAR(50) NOT NULL,
                order_number VARCHAR(50),
                stock_book_number VARCHAR(50),
                seller_details JSONB NOT NULL,
                vehicle_details JSONB NOT NULL,
                deposit_details JSONB NOT NULL,
                buyer_details JSONB NOT NULL,
                signature_data TEXT,
                signature_type VARCHAR(20) DEFAULT 'blank',
                vehicle_id VARCHAR(50),
                created_by VARCHAR(100) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
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
    const { id, make, model, registration, buying_price, status, selling_price, profit_loss, vat_scheme, expenses } = req.body;
    const scheme = vat_scheme || 'VAT Margin';
    try {
        const result = await db.query(
            `INSERT INTO vehicle_expenses (id, make, model, registration, buying_price, status, selling_price, profit_loss, vat_scheme, expenses, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
            [id, make, model, registration, buying_price, status, selling_price, profit_loss, scheme, JSON.stringify(expenses)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/vehicle-expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { make, model, registration, buying_price, status, selling_price, profit_loss, vat_scheme, expenses } = req.body;
    const scheme = vat_scheme || 'VAT Margin';
    try {
        const result = await db.query(
            `UPDATE vehicle_expenses 
             SET make=$1, model=$2, registration=$3, buying_price=$4, status=$5, selling_price=$6, profit_loss=$7, vat_scheme=$8, expenses=$9, updated_at=NOW()
             WHERE id=$10 RETURNING *`,
            [make, model, registration, buying_price, status, selling_price, profit_loss, scheme, JSON.stringify(expenses), id]
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

// --- CONTACT SUBMISSIONS API ---

app.post('/api/contact', async (req, res) => {
    const { id, type, name, email, phone, subject, message, vehicle_details } = req.body;
    try {
        const queryId = id || 'inq-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const result = await db.query(
            `INSERT INTO contact_submissions (id, type, name, email, phone, subject, message, vehicle_details, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', NOW()) RETURNING *`,
            [queryId, type, name, email, phone, subject, message, JSON.stringify(vehicle_details)]
        );
        const submission = result.rows[0];
        
        // Trigger email notification asynchronously
        sendInquiryEmail(submission).catch(err => {
            console.error('Asynchronous email send failed:', err);
        });

        res.json({ success: true, submission });
    } catch (err) {
        console.error('Error inserting contact submission:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/contact-submissions', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/contact-submissions/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await db.query(
            `UPDATE contact_submissions SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/contact-submissions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM contact_submissions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
        res.json({ message: 'Submission deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- INVOICES API ---

app.get('/api/invoices', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/invoices', async (req, res) => {
    const { id, invoice_number, invoice_date, due_date, customer_details, vehicle_details, sale_details, notes } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO invoices (id, invoice_number, invoice_date, due_date, customer_details, vehicle_details, sale_details, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
            [id, invoice_number, invoice_date, due_date, JSON.stringify(customer_details), JSON.stringify(vehicle_details), JSON.stringify(sale_details), notes]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const { invoice_number, invoice_date, due_date, customer_details, vehicle_details, sale_details, notes } = req.body;
    try {
        const result = await db.query(
            `UPDATE invoices 
             SET invoice_number=$1, invoice_date=$2, due_date=$3, customer_details=$4, vehicle_details=$5, sale_details=$6, notes=$7, updated_at=NOW()
             WHERE id=$8 RETURNING *`,
            [invoice_number, invoice_date, due_date, JSON.stringify(customer_details), JSON.stringify(vehicle_details), JSON.stringify(sale_details), notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM invoices WHERE id=$1', [id]);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- DEPOSIT SLIPS API ---

app.get('/api/deposit-slips', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM deposit_slips ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/deposit-slips', async (req, res) => {
    const { id, receipt_number, receipt_date, order_number, stock_book_number, seller_details, vehicle_details, deposit_details, buyer_details, signature_data, signature_type, vehicle_id, created_by } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO deposit_slips (id, receipt_number, receipt_date, order_number, stock_book_number, seller_details, vehicle_details, deposit_details, buyer_details, signature_data, signature_type, vehicle_id, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
            [id, receipt_number, receipt_date, order_number || '', stock_book_number || '', JSON.stringify(seller_details), JSON.stringify(vehicle_details), JSON.stringify(deposit_details), JSON.stringify(buyer_details), signature_data || '', signature_type || 'blank', vehicle_id || null, created_by || 'admin']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/deposit-slips/:id', async (req, res) => {
    const { id } = req.params;
    const { receipt_number, receipt_date, order_number, stock_book_number, seller_details, vehicle_details, deposit_details, buyer_details, signature_data, signature_type, vehicle_id } = req.body;
    try {
        const result = await db.query(
            `UPDATE deposit_slips 
             SET receipt_number=$1, receipt_date=$2, order_number=$3, stock_book_number=$4, seller_details=$5, vehicle_details=$6, deposit_details=$7, buyer_details=$8, signature_data=$9, signature_type=$10, vehicle_id=$11, updated_at=NOW()
             WHERE id=$12 RETURNING *`,
            [receipt_number, receipt_date, order_number || '', stock_book_number || '', JSON.stringify(seller_details), JSON.stringify(vehicle_details), JSON.stringify(deposit_details), JSON.stringify(buyer_details), signature_data || '', signature_type || 'blank', vehicle_id || null, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/deposit-slips/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM deposit_slips WHERE id=$1', [id]);
        res.json({ message: 'Deposit slip deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- AUTO TRADER API INTEGRATION ---
let autoTraderTokenCache = {
    token: null,
    expiresAt: null
};

// Check if credentials are mock/missing
const isAutoTraderMock = () => {
    const key = process.env.AUTOTRADER_KEY;
    const secret = process.env.AUTOTRADER_SECRET;
    return !key || !secret || key.includes('your-') || secret.includes('your-');
};

const getAutoTraderToken = async () => {
    if (isAutoTraderMock()) {
        return "mock-token-12345";
    }

    const now = new Date();
    if (autoTraderTokenCache.token && autoTraderTokenCache.expiresAt && new Date(autoTraderTokenCache.expiresAt) > now) {
        return autoTraderTokenCache.token;
    }

    console.log("Fetching new Auto Trader Access Token...");
    try {
        const response = await fetch("https://api-sandbox.autotrader.co.uk/authenticate", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                key: process.env.AUTOTRADER_KEY,
                secret: process.env.AUTOTRADER_SECRET
            })
        });

        if (!response.ok) {
            throw new Error(`Auth failed with status ${response.status}`);
        }

        const data = await response.json();
        autoTraderTokenCache.token = data.access_token;
        // Expire token 1 minute early to be safe
        const expiresAt = new Date(data.expires_at || (Date.now() + 15 * 60 * 1000));
        expiresAt.setMinutes(expiresAt.getMinutes() - 1);
        autoTraderTokenCache.expiresAt = expiresAt;

        return autoTraderTokenCache.token;
    } catch (err) {
        console.error("Auto Trader Authentication Error:", err);
        throw err;
    }
};

const getMockVehicleDetails = (registration, mileage) => {
    const regClean = registration.replace(/\s+/g, '').toUpperCase();
    
    // Pick standard vehicle details based on registration or default
    let make = "Ford";
    let model = "Focus";
    let derivative = "1.0 EcoBoost Hybrid mHEV 125 Titanium Edition 5dr Petrol Manual";
    let derivativeId = "mock-deriv-ford-focus";
    let firstRegistrationDate = "2020-09-15";
    let year = 2020;
    let fuelType = "Petrol";
    let transmissionType = "Manual";
    let colour = "Grey";
    let baseRetailValue = 14500;
    
    if (regClean.includes("WT17TZH") || regClean === "WT17TZH") {
        make = "MINI";
        model = "Convertible";
        derivative = "1.5 Cooper Convertible 2dr Petrol Manual (s/s) (136 ps)";
        derivativeId = "5b746c3a24974b8fa1048b0141356a34";
        firstRegistrationDate = "2017-07-19";
        year = 2017;
        fuelType = "Petrol";
        transmissionType = "Manual";
        colour = "Midnight Black";
        baseRetailValue = 11800;
    } else if (regClean.includes("KN20FZG") || regClean === "KN20FZG") {
        make = "Volkswagen";
        model = "Passat";
        derivative = "2.0 TDI EVO SCR SEL Estate 5dr Diesel Manual Euro 6 (s/s) (150 ps)";
        derivativeId = "vw-passat-2020-sel-mock";
        firstRegistrationDate = "2020-03-30";
        year = 2020;
        fuelType = "Diesel";
        transmissionType = "Manual";
        colour = "Urano Grey";
        baseRetailValue = 18900;
    } else if (regClean.startsWith("GY") || regClean.startsWith("LD")) {
        make = "BMW";
        model = "3 Series";
        derivative = "2.0 320i M Sport Auto Euro 6 (s/s) 4dr Petrol Automatic";
        derivativeId = "bmw-3series-mock";
        firstRegistrationDate = "2019-05-12";
        year = 2019;
        fuelType = "Petrol";
        transmissionType = "Automatic";
        colour = "Portimao Blue";
        baseRetailValue = 21500;
    } else if (regClean.length > 0) {
        // Deterministic generation based on plate hash
        let hash = 0;
        for (let i = 0; i < regClean.length; i++) {
            hash = regClean.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        
        const makes = ["Ford", "Vauxhall", "Volkswagen", "Audi", "Nissan", "Toyota", "Mercedes-Benz"];
        const modelsMap = {
            "Ford": ["Fiesta", "Puma", "Kuga"],
            "Vauxhall": ["Corsa", "Astra", "Mokka"],
            "Volkswagen": ["Golf", "Polo", "Tiguan"],
            "Audi": ["A3", "A4", "Q3"],
            "Nissan": ["Qashqai", "Juke", "Micra"],
            "Toyota": ["Yaris", "Corolla", "RAV4"],
            "Mercedes-Benz": ["A Class", "C Class", "GLA"]
        };
        
        make = makes[hash % makes.length];
        const models = modelsMap[make];
        model = models[hash % models.length];
        year = 2015 + (hash % 9); // years 2015 to 2023
        firstRegistrationDate = `${year}-06-${10 + (hash % 15)}`;
        
        const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"];
        fuelType = fuelTypes[hash % fuelTypes.length];
        transmissionType = (hash % 2 === 0) ? "Manual" : "Automatic";
        
        const colours = ["Frozen White", "Shadow Black", "Race Red", "Deep Impact Blue", "Moondust Silver"];
        colour = colours[hash % colours.length];
        
        derivative = `1.6 ${model} Sport 5dr ${fuelType} ${transmissionType}`;
        derivativeId = `mock-deriv-${make.toLowerCase()}-${model.toLowerCase()}-${hash % 1000}`;
        baseRetailValue = 9000 + (hash % 15000);
    }

    // Depreciate based on year and mileage
    const yearsOld = new Date().getFullYear() - year;
    const mileFactor = Math.pow(0.99, (mileage || 20000) / 1000);
    const yearFactor = Math.pow(0.92, yearsOld);
    
    const retail = Math.round(baseRetailValue * yearFactor * mileFactor);
    const privateVal = Math.round(retail * 0.88);
    const trade = Math.round(retail * 0.78);
    const partExchange = Math.round(retail * 0.75);

    return {
        vehicle: {
            ownershipCondition: "Used",
            registration: registration.toUpperCase(),
            vin: "MOCKVIN" + registration.toUpperCase() + "12345",
            make,
            model,
            derivative,
            derivativeId,
            vehicleType: "Car",
            year,
            firstRegistrationDate,
            fuelType,
            transmissionType,
            colour,
            doors: 5,
            seats: 5,
            engineCapacityCC: 1598
        },
        valuations: {
            trade: { amountGBP: trade },
            partExchange: { amountGBP: partExchange },
            retail: { amountGBP: retail },
            private: { amountGBP: privateVal }
        }
    };
};

const calculateMockConditionValuation = (derivativeId, mileage, conditionRating, registrationDate) => {
    let baseRetailValue = 15000;
    let year = 2020;
    
    if (derivativeId.includes("5b746c3a24974b8fa")) {
        baseRetailValue = 11800;
        year = 2017;
    } else if (derivativeId.includes("passat")) {
        baseRetailValue = 18900;
        year = 2020;
    } else if (derivativeId.includes("3series")) {
        baseRetailValue = 21500;
        year = 2019;
    }
    
    if (registrationDate) {
        year = new Date(registrationDate).getFullYear();
    }
    
    const yearsOld = new Date().getFullYear() - year;
    const mileFactor = Math.pow(0.99, mileage / 1000);
    const yearFactor = Math.pow(0.92, yearsOld);
    
    let retail = Math.round(baseRetailValue * yearFactor * mileFactor);
    
    let conditionMultiplier = 1.0;
    const cond = (conditionRating || "").toUpperCase();
    if (cond === "EXCELLENT") conditionMultiplier = 1.05;
    else if (cond === "GREAT") conditionMultiplier = 1.02;
    else if (cond === "GOOD") conditionMultiplier = 1.0;
    else if (cond === "FAIR") conditionMultiplier = 0.90;
    else if (cond === "POOR") conditionMultiplier = 0.78;
    
    const trade = Math.round(retail * 0.78 * conditionMultiplier);
    const partExchange = Math.round(retail * 0.75 * conditionMultiplier);
    const privateVal = Math.round(retail * 0.88 * conditionMultiplier);
    
    return {
        valuations: {
            trade: { amountGBP: trade },
            partExchange: { amountGBP: partExchange },
            retail: { amountGBP: retail },
            private: { amountGBP: privateVal }
        }
    };
};

app.get('/api/autotrader/vehicle-lookup', async (req, res) => {
    const { registration, odometerReadingMiles } = req.query;
    if (!registration) {
        return res.status(400).json({ error: 'Registration number is required' });
    }
    
    const mileage = parseInt(odometerReadingMiles) || 0;
    
    try {
        if (isAutoTraderMock()) {
            await new Promise(resolve => setTimeout(resolve, 600));
            const mockData = getMockVehicleDetails(registration, mileage);
            return res.json(mockData);
        }
        
        const token = await getAutoTraderToken();
        const advertiserId = process.env.AUTOTRADER_ADVERTISER_ID || '';
        
        let url = `https://api-sandbox.autotrader.co.uk/vehicles?registration=${encodeURIComponent(registration)}`;
        if (advertiserId) {
            url += `&advertiserId=${encodeURIComponent(advertiserId)}`;
        }
        if (mileage > 0) {
            url += `&valuations=true&odometerReadingMiles=${mileage}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            throw new Error(`Auto Trader API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Auto Trader vehicle lookup error:', err);
        res.status(500).json({ error: 'Failed to look up vehicle from Auto Trader' });
    }
});

app.post('/api/autotrader/valuation', async (req, res) => {
    const { derivativeId, firstRegistrationDate, odometerReadingMiles, conditionRating } = req.body;
    
    if (!derivativeId || !odometerReadingMiles) {
        return res.status(400).json({ error: 'derivativeId and odometerReadingMiles are required' });
    }
    
    const mileage = parseInt(odometerReadingMiles) || 0;
    
    try {
        if (isAutoTraderMock()) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockValuation = calculateMockConditionValuation(derivativeId, mileage, conditionRating, firstRegistrationDate);
            return res.json(mockValuation);
        }
        
        const token = await getAutoTraderToken();
        const advertiserId = process.env.AUTOTRADER_ADVERTISER_ID || '';
        
        let url = `https://api-sandbox.autotrader.co.uk/valuations`;
        if (advertiserId) {
            url += `?advertiserId=${encodeURIComponent(advertiserId)}`;
        }
        
        const payload = {
            vehicle: {
                derivativeId,
                firstRegistrationDate,
                odometerReadingMiles: mileage
            },
            conditionRating: conditionRating || 'Good'
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Auto Trader Valuation API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Auto Trader valuation adjustment error:', err);
        res.status(500).json({ error: 'Failed to retrieve valuation from Auto Trader' });
    }
});

const handleMockSyncStock = async () => {
    const mockCars = [
        {
            id: "at-mock-mini-2017",
            title: "2017 MINI Convertible Cooper",
            make: "MINI",
            model: "Convertible",
            trim: "Cooper",
            year: 2017,
            price: 11800,
            mileage: 25000,
            fuel: "Petrol",
            transmission: "Manual",
            bodyType: "Convertible",
            colour: "Midnight Black",
            engine: "1.5L",
            doors: 2,
            seats: 4,
            description: "Stunning MINI Convertible Cooper in Midnight Black. Excellent fuel economy, manual transmission, and standard equipment includes rear parking sensors, Bluetooth connectivity, and air conditioning. Fun to drive, premium look, and full service history.",
            features: JSON.stringify(["Bluetooth", "Parking Sensors", "Air Conditioning", "Alloy Wheels", "Start/Stop Technology"]),
            images: JSON.stringify(["/images/car-hatchback.png"]),
            status: "available",
            featured: false
        },
        {
            id: "at-mock-vw-passat-2020",
            title: "2020 Volkswagen Passat Estate SEL",
            make: "Volkswagen",
            model: "Passat",
            trim: "SEL",
            year: 2020,
            price: 18900,
            mileage: 35000,
            fuel: "Diesel",
            transmission: "Manual",
            bodyType: "Estate",
            colour: "Urano Grey",
            engine: "2.0L",
            doors: 5,
            seats: 5,
            description: "Spacious and highly economical VW Passat Estate in Urano Grey SEL trim. Perfect family or executive motorway cruiser. Standard features include adaptive cruise control, leather seats, satellite navigation, and active info display.",
            features: JSON.stringify(["Sat Nav", "Leather Seats", "Adaptive Cruise Control", "Apple CarPlay", "Heated Seats"]),
            images: JSON.stringify(["/images/car-estate.png"]),
            status: "available",
            featured: false
        },
        {
            id: "at-mock-bmw-3series-2019",
            title: "2019 BMW 3 Series M Sport",
            make: "BMW",
            model: "3 Series",
            trim: "M Sport",
            year: 2019,
            price: 21500,
            mileage: 42000,
            fuel: "Petrol",
            transmission: "Automatic",
            bodyType: "Saloon",
            colour: "Portimao Blue",
            engine: "2.0L",
            doors: 4,
            seats: 5,
            description: "Premium BMW 3 Series 320i M Sport in beautiful Portimao Blue. Automatic gearbox, full leather, M Sport styling package, live cockpit professional, front and rear parking assistant, and ambient lighting.",
            features: JSON.stringify(["M Sport Styling", "Live Cockpit Professional", "Leather Interior", "Ambient Lighting", "Reverse Camera"]),
            images: JSON.stringify(["/images/car-sedan.png"]),
            status: "available",
            featured: false
        }
    ];

    let syncedCount = 0;
    for (const car of mockCars) {
        const check = await db.query('SELECT id FROM cars WHERE id = $1', [car.id]);
        if (check.rows.length > 0) {
            await db.query(
                `UPDATE cars SET title=$1, make=$2, model=$3, trim=$4, year=$5, price=$6, mileage=$7, fuel=$8, transmission=$9, "bodyType"=$10, colour=$11, engine=$12, doors=$13, seats=$14, description=$15, features=$16, images=$17, status=$18, featured=$19 WHERE id=$20`,
                [car.title, car.make, car.model, car.trim, car.year, car.price, car.mileage, car.fuel, car.transmission, car.bodyType, car.colour, car.engine, car.doors, car.seats, car.description, car.features, car.images, car.status, car.featured, car.id]
            );
        } else {
            await db.query(
                `INSERT INTO cars (id, title, make, model, trim, year, price, mileage, fuel, transmission, "bodyType", colour, engine, doors, seats, description, features, images, status, featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                [car.id, car.title, car.make, car.model, car.trim, car.year, car.price, car.mileage, car.fuel, car.transmission, car.bodyType, car.colour, car.engine, car.doors, car.seats, car.description, car.features, car.images, car.status, car.featured]
            );
        }
        syncedCount++;
    }

    return syncedCount;
};

app.post('/api/autotrader/sync-stock', async (req, res) => {
    try {
        if (isAutoTraderMock()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const syncedCount = await handleMockSyncStock();
            return res.json({ success: true, count: syncedCount, mock: true });
        }
        
        const token = await getAutoTraderToken();
        const advertiserId = process.env.AUTOTRADER_ADVERTISER_ID || '';
        
        if (!advertiserId) {
            return res.status(400).json({ error: 'AUTOTRADER_ADVERTISER_ID is required to sync stock' });
        }
        
        let results = [];
        let page = 1;
        const pageSize = 50; // Use a reasonable page size to minimize requests
        let totalResults = 0;
        let hasMore = true;

        while (hasMore) {
            const url = `https://api-sandbox.autotrader.co.uk/stock?advertiserId=${encodeURIComponent(advertiserId)}&page=${page}&pageSize=${pageSize}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Auto Trader Stock API responded with status ${response.status} on page ${page}`);
            }
            
            const data = await response.json();
            const pageResults = data.results || [];
            results = results.concat(pageResults);
            
            totalResults = data.totalResults || 0;
            
            if (pageResults.length === 0 || results.length >= totalResults) {
                hasMore = false;
            } else {
                page++;
            }
        }
        
        let syncedCount = 0;
        const activeIds = [];
        const seenKeys = new Set();
        
        const formatBrand = (str) => {
            if (!str) return '';
            const upper = str.toUpperCase().trim();
            if (upper === 'BMW') return 'BMW';
            if (upper === 'VW') return 'VW';
            if (upper === 'MINI') return 'MINI';
            return upper.split(/\s+/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
        };
        
        const formatModel = (str) => {
            if (!str) return '';
            if (str === str.toUpperCase()) {
                return str.split(/\s+/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
            }
            return str;
        };
        
        for (const item of results) {
            const stockId = item.metadata?.stockId;
            if (!stockId) continue;
            
            const standard = item.vehicle?.standard || {};
            let make = item.vehicle?.make || standard.make || 'Unknown';
            let model = item.vehicle?.model || standard.model || 'Unknown';
            
            if ((!make || make === 'Unknown' || make.toLowerCase() === 'null') && model) {
                const words = model.split(' ');
                if (words.length > 1) {
                    make = words[0];
                    model = words.slice(1).join(' ');
                }
            }
            
            make = formatBrand(make);
            model = formatModel(model);
            const trim = item.vehicle?.trim || standard.trim || '';
            
            const year = parseInt(item.vehicle?.year) || 
                         (item.vehicle?.firstRegistrationDate ? new Date(item.vehicle.firstRegistrationDate).getFullYear() : 
                         (item.vehicle?.yearOfManufacture ? parseInt(item.vehicle.yearOfManufacture) : new Date().getFullYear()));
            const price = parseInt(item.adverts?.forecourtPrice?.amountGBP) || parseInt(item.adverts?.retailAdverts?.totalPrice?.amountGBP) || 0;
            
            const uniqueKey = `${make}-${model}-${trim}-${year}-${price}`.toLowerCase().replace(/\s+/g, '');
            if (seenKeys.has(uniqueKey)) {
                continue;
            }
            seenKeys.add(uniqueKey);
            
            const dbId = `at-${stockId}`;
            activeIds.push(dbId);
            
            const derivative = item.vehicle?.derivative || standard.derivative || '';
            const title = `${year} ${make} ${model} ${trim}`.trim() || 'Vehicle';
            const mileage = parseInt(item.vehicle?.odometerReadingMiles) || 0;
            const fuel = item.vehicle?.fuelType || standard.fuelType || 'Petrol';
            const transmission = item.vehicle?.transmissionType || standard.transmissionType || 'Manual';
            const bodyType = item.vehicle?.bodyType || standard.bodyType || 'Coupe';
            const colour = item.vehicle?.colour || standard.colour || 'Unlisted';
            const engine = item.vehicle?.badgeEngineSizeLitres ? `${item.vehicle.badgeEngineSizeLitres}L` : '';
            const doors = parseInt(item.vehicle?.doors) || 5;
            const seats = parseInt(item.vehicle?.seats) || 5;
            const description = item.adverts?.retailAdverts?.description || item.adverts?.retailAdverts?.description2 || derivative || '';
            
            let featuresArr = [];
            if (item.features && Array.isArray(item.features)) {
                featuresArr = item.features.map(f => f.name || f.standardName).filter(Boolean);
            } else if (item.vehicle?.features && Array.isArray(item.vehicle.features)) {
                featuresArr = item.vehicle.features;
            }
            const features = JSON.stringify(featuresArr);
            
            let imagesArr = [];
            if (item.media?.images && Array.isArray(item.media.images)) {
                imagesArr = item.media.images.map(img => {
                    const href = img.href || '';
                    return href.replace('{resize}', 'w800');
                });
            } else if (item.vehicle?.images && Array.isArray(item.vehicle.images)) {
                imagesArr = item.vehicle.images.map(img => {
                    const href = img.href || '';
                    return href.replace('{resize}', 'w800');
                });
            } else if (item.images && Array.isArray(item.images)) {
                imagesArr = item.images.map(img => {
                    const href = img.href || '';
                    return href.replace('{resize}', 'w800');
                });
            }
            const images = JSON.stringify(imagesArr);
            
            const status = 'available';
            const featured = false;
            
            const check = await db.query('SELECT id FROM cars WHERE id = $1', [dbId]);
            if (check.rows.length > 0) {
                await db.query(
                    `UPDATE cars SET title=$1, make=$2, model=$3, trim=$4, year=$5, price=$6, mileage=$7, fuel=$8, transmission=$9, "bodyType"=$10, colour=$11, engine=$12, doors=$13, seats=$14, description=$15, features=$16, images=$17, status=$18, featured=$19 WHERE id=$20`,
                    [title, make, model, trim, year, price, mileage, fuel, transmission, bodyType, colour, engine, doors, seats, description, features, images, status, featured, dbId]
                );
            } else {
                await db.query(
                    `INSERT INTO cars (id, title, make, model, trim, year, price, mileage, fuel, transmission, "bodyType", colour, engine, doors, seats, description, features, images, status, featured)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                    [dbId, title, make, model, trim, year, price, mileage, fuel, transmission, bodyType, colour, engine, doors, seats, description, features, images, status, featured]
                );
            }
            syncedCount++;
        }
        
        if (activeIds.length > 0) {
            await db.query(
                `UPDATE cars SET status = 'sold' WHERE id LIKE 'at-%' AND id NOT IN (${activeIds.map((_, i) => `$${i + 1}`).join(',')})`,
                activeIds
            );
        } else {
            await db.query(`UPDATE cars SET status = 'sold' WHERE id LIKE 'at-%'`);
        }
        
        res.json({ success: true, count: syncedCount });
    } catch (err) {
        console.error('Auto Trader stock sync error:', err);
        res.status(500).json({ error: 'Failed to sync forecourt stock from Auto Trader' });
    }
});


// --- GENERAL EXPENSES API ---

app.get('/api/general-expenses', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM general_expenses ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/general-expenses', async (req, res) => {
    const { id, category, amount, date, description, notes, receipt_url, created_at, updated_at } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO general_expenses (id, category, amount, date, description, notes, receipt_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [id, category, amount, date, description || '', notes || '', receipt_url || '', created_at, updated_at]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/general-expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { category, amount, date, description, notes, receipt_url, updated_at } = req.body;
    try {
        const result = await db.query(
            `UPDATE general_expenses SET category=$1, amount=$2, date=$3, description=$4, notes=$5, receipt_url=$6, updated_at=$7 WHERE id=$8 RETURNING *`,
            [category, amount, date, description || '', notes || '', receipt_url || '', updated_at, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/general-expenses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM general_expenses WHERE id=$1', [req.params.id]);
        res.json({ message: 'General expense deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`API Backend running securely on port ${PORT}`);
});
