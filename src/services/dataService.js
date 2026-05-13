import carsData from '../data/cars.json';
import blogsData from '../data/blogs.json';

const CARS_KEY = 'vancar_cars';
const BLOGS_KEY = 'vancar_blogs';

function initData(key, defaultData) {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(stored);
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// === Cars ===
export function getCars() {
  return initData(CARS_KEY, carsData);
}

export function getCarById(id) {
  const cars = getCars();
  return cars.find(car => car.id === id) || null;
}

export function getAvailableCars() {
  return getCars().filter(car => car.status === 'available');
}

export function getFeaturedCars() {
  return getCars().filter(car => car.featured && car.status === 'available');
}

export function getCarsByBodyType(bodyType) {
  return getAvailableCars().filter(car => car.bodyType === bodyType);
}

export function getSimilarCars(carId, limit = 4) {
  const car = getCarById(carId);
  if (!car) return [];
  return getAvailableCars()
    .filter(c => c.id !== carId && (c.bodyType === car.bodyType || c.make === car.make))
    .slice(0, limit);
}

export function searchCars(filters = {}) {
  let cars = getAvailableCars();

  if (filters.search) {
    const q = filters.search.toLowerCase();
    cars = cars.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
  }
  if (filters.bodyType && filters.bodyType !== 'All') {
    cars = cars.filter(c => c.bodyType === filters.bodyType);
  }
  if (filters.fuel && filters.fuel !== 'All') {
    cars = cars.filter(c => c.fuel === filters.fuel);
  }
  if (filters.transmission && filters.transmission !== 'All') {
    cars = cars.filter(c => c.transmission === filters.transmission);
  }
  if (filters.make) {
    cars = cars.filter(c => c.make === filters.make);
  }
  if (filters.minPrice) {
    cars = cars.filter(c => c.price >= filters.minPrice);
  }
  if (filters.maxPrice) {
    cars = cars.filter(c => c.price <= filters.maxPrice);
  }
  if (filters.minYear) {
    cars = cars.filter(c => c.year >= filters.minYear);
  }
  if (filters.maxYear) {
    cars = cars.filter(c => c.year <= filters.maxYear);
  }
  if (filters.maxMileage) {
    cars = cars.filter(c => c.mileage <= filters.maxMileage);
  }

  // Sorting
  if (filters.sort) {
    switch (filters.sort) {
      case 'price-low':
        cars.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        cars.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        cars.sort((a, b) => b.year - a.year);
        break;
      case 'mileage':
        cars.sort((a, b) => a.mileage - b.mileage);
        break;
      default:
        break;
    }
  }

  return cars;
}

export function createCar(carData) {
  const cars = getCars();
  const newCar = { ...carData, id: generateId() };
  cars.push(newCar);
  saveData(CARS_KEY, cars);
  return newCar;
}

export function updateCar(id, carData) {
  const cars = getCars();
  const idx = cars.findIndex(c => c.id === id);
  if (idx === -1) return null;
  cars[idx] = { ...cars[idx], ...carData, id };
  saveData(CARS_KEY, cars);
  return cars[idx];
}

export function deleteCar(id) {
  const cars = getCars().filter(c => c.id !== id);
  saveData(CARS_KEY, cars);
}

export function getBodyTypes() {
  const cars = getCars();
  const types = [...new Set(cars.map(c => c.bodyType))];
  return types;
}

export function getMakes() {
  const cars = getCars();
  return [...new Set(cars.map(c => c.make))].sort();
}

export function getCarStats() {
  const cars = getCars();
  return {
    total: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    sold: cars.filter(c => c.status === 'sold').length,
    bodyTypes: getBodyTypes().map(type => ({
      type,
      count: cars.filter(c => c.bodyType === type && c.status === 'available').length
    }))
  };
}

// === Blogs ===
export function getBlogs() {
  return initData(BLOGS_KEY, blogsData);
}

export function getPublishedBlogs() {
  return getBlogs().filter(b => b.published);
}

export function getBlogBySlug(slug) {
  return getBlogs().find(b => b.slug === slug) || null;
}

export function getBlogById(id) {
  return getBlogs().find(b => b.id === id) || null;
}

export function createBlog(blogData) {
  const blogs = getBlogs();
  const newBlog = { ...blogData, id: generateId() };
  blogs.push(newBlog);
  saveData(BLOGS_KEY, blogs);
  return newBlog;
}

export function updateBlog(id, blogData) {
  const blogs = getBlogs();
  const idx = blogs.findIndex(b => b.id === id);
  if (idx === -1) return null;
  blogs[idx] = { ...blogs[idx], ...blogData, id };
  saveData(BLOGS_KEY, blogs);
  return blogs[idx];
}

export function deleteBlog(id) {
  const blogs = getBlogs().filter(b => b.id !== id);
  saveData(BLOGS_KEY, blogs);
}
