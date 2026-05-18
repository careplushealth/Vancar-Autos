const db = require('./db');
const carsData = require('../src/data/cars.json');
const blogsData = require('../src/data/blogs.json');

const seedData = async () => {
    try {
        console.log("Seeding Cars...");
        for (const car of carsData) {
            await db.query(
                `INSERT INTO cars (id, title, make, model, trim, year, price, mileage, fuel, transmission, "bodyType", colour, engine, doors, seats, description, features, images, status, featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                 ON CONFLICT (id) DO NOTHING`,
                [car.id, car.title, car.make, car.model, car.trim, car.year, car.price, car.mileage, car.fuel, car.transmission, car.bodyType, car.colour, car.engine, car.doors, car.seats, car.description, JSON.stringify(car.features), JSON.stringify(car.images), car.status, car.featured]
            );
        }
        console.log("Seeding Blogs...");
        for (const blog of blogsData) {
            await db.query(
                `INSERT INTO blogs (id, title, slug, excerpt, content, "coverImage", author, tags, status, "publishedDate", published)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO NOTHING`,
                [blog.id, blog.title, blog.slug, blog.excerpt, blog.content, blog.coverImage, blog.author, JSON.stringify(blog.tags), blog.status, blog.publishedDate, blog.published]
            );
        }
        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
};

seedData();
