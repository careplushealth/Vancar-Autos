import carsData from '../data/cars.json';
import blogsData from '../data/blogs.json';
import { normalizeMake } from '../utils/makeUtils';

const CARS_KEY = 'vancar_cars';
const BLOGS_KEY = 'vancar_blogs';
const EXPENSES_KEY = 'vancar_vehicle_expenses';
const GENERAL_EXPENSES_KEY = 'vancar_general_expenses';
const INVOICES_KEY = 'vancar_invoices';
const DEPOSIT_SLIPS_KEY = 'vancar_deposit_slips';
const DISTANCE_SALE_FORMS_KEY = 'vancar_distance_sale_forms';
const CUSTOMERS_KEY = 'vancar_customers';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const fetchWithTimeout = async (url, options = {}, timeoutMs = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (err) {
        clearTimeout(id);
        return { ok: false, error: err };
    }
};

const syncNeon = (endpoint, method, data = null) => {
    fetchWithTimeout(`${API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null
    }, 8000).catch(err => console.error("Neon DB Sync Error:", err));
};

export async function syncDataFromServer() {
    try {
        // Fast lightweight sync: only fetch public-facing inventory (cars and blogs)
        const [carsRes, blogsRes] = await Promise.all([
            fetchWithTimeout(`${API_URL}/cars`, {}, 6000),
            fetchWithTimeout(`${API_URL}/blogs`, {}, 6000)
        ]);

        if (carsRes.ok) {
            const cars = await carsRes.json();
            if (Array.isArray(cars) && cars.length > 0) {
                const normalizedCars = cars.map(car => ({
                    ...car,
                    images: normalizeCarImages(car.images, car.bodyType)
                }));
                saveData(CARS_KEY, normalizedCars);
                window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CARS_KEY } }));
            }
        }
        if (blogsRes.ok) {
            const blogs = await blogsRes.json();
            if (Array.isArray(blogs) && blogs.length > 0) {
                saveData(BLOGS_KEY, blogs);
                window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: BLOGS_KEY } }));
            }
        }
    } catch (err) {
        console.error("Public data sync notice:", err);
    }
}

export async function syncAdminDataFromServer() {
    try {
        const [expensesRes, invoicesRes, generalExpensesRes, depositSlipsRes, customersRes] = await Promise.all([
            fetchWithTimeout(`${API_URL}/vehicle-expenses`, {}, 10000),
            fetchWithTimeout(`${API_URL}/invoices`, {}, 10000),
            fetchWithTimeout(`${API_URL}/general-expenses`, {}, 10000),
            fetchWithTimeout(`${API_URL}/deposit-slips`, {}, 10000),
            fetchWithTimeout(`${API_URL}/customers`, {}, 10000)
        ]);

        if (expensesRes && expensesRes.ok) {
            const expenses = await expensesRes.json();
            if (Array.isArray(expenses)) saveData(EXPENSES_KEY, expenses);
        }
        if (invoicesRes && invoicesRes.ok) {
            const invoices = await invoicesRes.json();
            if (Array.isArray(invoices)) saveData(INVOICES_KEY, invoices);
        }
        if (generalExpensesRes && generalExpensesRes.ok) {
            const generalExpenses = await generalExpensesRes.json();
            if (Array.isArray(generalExpenses)) saveData(GENERAL_EXPENSES_KEY, generalExpenses);
        }
        if (depositSlipsRes && depositSlipsRes.ok) {
            const depositSlips = await depositSlipsRes.json();
            if (Array.isArray(depositSlips)) saveData(DEPOSIT_SLIPS_KEY, depositSlips);
        }
        if (customersRes && customersRes.ok) {
            const customers = await customersRes.json();
            if (Array.isArray(customers)) saveData(CUSTOMERS_KEY, customers);
        }
    } catch (err) {
        console.error("Admin data sync notice:", err);
    }
}

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
const DEFAULT_CAR_REGS = {
  'car-001': 'LO23 HSE',
  'car-002': 'BD72 AMX',
  'car-003': 'WP71 VXY',
  'car-004': 'RX23 POR',
  'car-005': 'EF72 AUD',
  'car-006': 'YG20 BEN',
  'car-007': 'LM23 AST',
  'car-008': 'FD73 FST',
  'car-009': 'EV21 TSL',
  'car-010': 'RS73 AUD',
  'car-011': 'VW22 VAN',
  'car-012': 'JG24 TYP'
};

export const normalizeCarImages = (images) => {
  let list = [];
  if (Array.isArray(images)) {
    list = images;
  } else if (typeof images === 'string') {
    const trimmed = images.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) list = parsed;
        else if (typeof parsed === 'string' && parsed.trim()) list = [parsed.trim()];
      } catch {
        // json parse fallback
      }
    } else if (trimmed) {
      list = [trimmed];
    }
  }

  // Filter out invalid items (like "[", "null", "", etc.)
  const cleaned = list
    .map(img => (typeof img === 'string' ? img.trim() : ''))
    .filter(img => img && img !== '[' && img !== ']' && img !== 'null' && img !== 'undefined' && img !== 'NaN');

  return cleaned;
};

export function getCars() {
  const cars = initData(CARS_KEY, carsData);
  return cars.map(car => {
    const reg = car.registration || DEFAULT_CAR_REGS[car.id] || (car.vrm ? car.vrm.toUpperCase() : '');
    const normalizedImages = normalizeCarImages(car.images, car.bodyType);
    return {
      ...car,
      registration: reg,
      images: normalizedImages,
      purchase_attribution: car.purchase_attribution || car.purchaseAttribution || null,
      purchaseAttribution: car.purchase_attribution || car.purchaseAttribution || null
    };
  });
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
  // Use all cars so we can display sold ones too
  let cars = getCars();

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

  // Always push sold cars to the bottom regardless of filters
  cars.sort((a, b) => {
    if (a.status === 'sold' && b.status !== 'sold') return 1;
    if (a.status !== 'sold' && b.status === 'sold') return -1;
    return 0; // maintain existing order
  });

  return cars;
}

export function createCar(carData) {
  const cars = getCars();
  const attr = carData.purchase_attribution || carData.purchaseAttribution || null;
  const newCar = { 
    ...carData, 
    images: normalizeCarImages(carData.images, carData.bodyType),
    purchase_attribution: attr,
    purchaseAttribution: attr,
    id: generateId() 
  };
  cars.push(newCar);
  saveData(CARS_KEY, cars);
  syncNeon('/cars', 'POST', newCar);
  return newCar;
}

export function updateCar(id, carData) {
  const cars = getCars();
  const idx = cars.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const attr = carData.purchase_attribution !== undefined ? carData.purchase_attribution : (carData.purchaseAttribution !== undefined ? carData.purchaseAttribution : cars[idx].purchase_attribution);
  const images = carData.images !== undefined ? normalizeCarImages(carData.images, carData.bodyType || cars[idx].bodyType) : cars[idx].images;
  cars[idx] = { 
    ...cars[idx], 
    ...carData, 
    images,
    purchase_attribution: attr || null,
    purchaseAttribution: attr || null,
    id 
  };
  saveData(CARS_KEY, cars);
  syncNeon(`/cars/${id}`, 'PUT', cars[idx]);

  if (carData.status === 'sold' && carData.customer_details && carData.customer_details.name) {
    const cd = carData.customer_details;
    const vName = `${cars[idx].year || ''} ${cars[idx].make || ''} ${cars[idx].model || ''} ${cars[idx].trim || ''}`.trim();
    recordCustomerFromSale({
      id: carData.customer_id || null,
      full_name: cd.name,
      phone: cd.phone,
      email: cd.email,
      address: cd.address,
      vehicle_id: id,
      vehicle_name: vName,
      sale_price: carData.price || cars[idx].price || null,
      sale_date: new Date().toISOString(),
      lead_source: carData.lead_source || carData.leadSource || cars[idx].lead_source || 'Forecourt Sale'
    });
  }

  return cars[idx];
}

export function deleteCar(id) {
  const cars = getCars().filter(c => c.id !== id);
  saveData(CARS_KEY, cars);
  syncNeon(`/cars/${id}`, 'DELETE');
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
  syncNeon('/blogs', 'POST', newBlog);
  return newBlog;
}

export function updateBlog(id, blogData) {
  const blogs = getBlogs();
  const idx = blogs.findIndex(b => b.id === id);
  if (idx === -1) return null;
  blogs[idx] = { ...blogs[idx], ...blogData, id };
  saveData(BLOGS_KEY, blogs);
  syncNeon(`/blogs/${id}`, 'PUT', blogs[idx]);
  return blogs[idx];
}

export function deleteBlog(id) {
  const blogs = getBlogs().filter(b => b.id !== id);
  saveData(BLOGS_KEY, blogs);
  syncNeon(`/blogs/${id}`, 'DELETE');
}

// === Vehicle Expenses ===
export function getVehicleExpenses() {
  const records = initData(EXPENSES_KEY, []);
  // Ensure existing data is normalized and has vat_scheme & purchase_attribution
  return records.map(r => ({
    ...r,
    make: normalizeMake(r.make),
    vat_scheme: r.vat_scheme || 'VAT Margin',
    purchase_attribution: r.purchase_attribution || r.purchaseAttribution || null,
    purchaseAttribution: r.purchase_attribution || r.purchaseAttribution || null,
    expenses: (r.expenses || []).map(e => ({
      ...e,
      date: e.date || (r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      description: e.description || '',
      calculateVat: !!e.calculateVat,
      vatAmount: e.vatAmount !== undefined ? e.vatAmount : (e.calculateVat ? parseFloat(e.amount || 0) * 0.20 : 0),
      netAmount: e.netAmount !== undefined ? e.netAmount : parseFloat(e.amount || 0),
      grossAmount: e.grossAmount !== undefined ? e.grossAmount : (e.calculateVat ? parseFloat(e.amount || 0) * 1.20 : parseFloat(e.amount || 0))
    }))
  }));
}

export function createVehicleExpense(expenseData) {
  const expenses = getVehicleExpenses();
  const nowStr = new Date().toISOString();
  const attr = expenseData.purchase_attribution || expenseData.purchaseAttribution || null;
  const newExpense = { 
    ...expenseData, 
    make: normalizeMake(expenseData.make),
    vat_scheme: expenseData.vat_scheme || 'VAT Margin',
    purchase_attribution: attr,
    purchaseAttribution: attr,
    id: generateId(),
    created_at: nowStr,
    updated_at: nowStr
  };
  expenses.push(newExpense);
  saveData(EXPENSES_KEY, expenses);
  syncNeon('/vehicle-expenses', 'POST', newExpense);
  return newExpense;
}

export function updateVehicleExpense(id, expenseData) {
  const expenses = getVehicleExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const nowStr = new Date().toISOString();
  const attr = expenseData.purchase_attribution !== undefined ? expenseData.purchase_attribution : (expenseData.purchaseAttribution !== undefined ? expenseData.purchaseAttribution : expenses[idx].purchase_attribution);
  expenses[idx] = { 
    ...expenses[idx], 
    ...expenseData, 
    make: normalizeMake(expenseData.make || expenses[idx].make),
    vat_scheme: expenseData.vat_scheme || expenses[idx].vat_scheme || 'VAT Margin',
    purchase_attribution: attr || null,
    purchaseAttribution: attr || null,
    id,
    updated_at: nowStr
  };
  saveData(EXPENSES_KEY, expenses);
  syncNeon(`/vehicle-expenses/${id}`, 'PUT', expenses[idx]);
  return expenses[idx];
}

export function deleteVehicleExpense(id) {
  const expenses = getVehicleExpenses().filter(e => e.id !== id);
  saveData(EXPENSES_KEY, expenses);
  syncNeon(`/vehicle-expenses/${id}`, 'DELETE');
}

export function getModelsByMake(make) {
  const cars = getCars();
  return [...new Set(cars.filter(c => c.make === make).map(c => c.model))].sort();
}

// === General Expenses ===
export function getGeneralExpenses() {
  const records = initData(GENERAL_EXPENSES_KEY, []);
  return records.map(r => ({
    ...r,
    purchase_attribution: r.purchase_attribution || r.purchaseAttribution || null,
    purchaseAttribution: r.purchase_attribution || r.purchaseAttribution || null
  }));
}

export function createGeneralExpense(data) {
  const expenses = getGeneralExpenses();
  const nowStr = new Date().toISOString();
  const attr = data.purchase_attribution || data.purchaseAttribution || null;
  const newExpense = {
    ...data,
    purchase_attribution: attr,
    purchaseAttribution: attr,
    id: generateId(),
    created_at: nowStr,
    updated_at: nowStr
  };
  expenses.push(newExpense);
  saveData(GENERAL_EXPENSES_KEY, expenses);
  syncNeon('/general-expenses', 'POST', newExpense);
  return newExpense;
}

export function updateGeneralExpense(id, data) {
  const expenses = getGeneralExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const nowStr = new Date().toISOString();
  const attr = data.purchase_attribution !== undefined ? data.purchase_attribution : (data.purchaseAttribution !== undefined ? data.purchaseAttribution : expenses[idx].purchase_attribution);
  expenses[idx] = {
    ...expenses[idx],
    ...data,
    purchase_attribution: attr || null,
    purchaseAttribution: attr || null,
    id,
    updated_at: nowStr
  };
  saveData(GENERAL_EXPENSES_KEY, expenses);
  syncNeon(`/general-expenses/${id}`, 'PUT', expenses[idx]);
  return expenses[idx];
}

export function deleteGeneralExpense(id) {
  const expenses = getGeneralExpenses().filter(e => e.id !== id);
  saveData(GENERAL_EXPENSES_KEY, expenses);
  syncNeon(`/general-expenses/${id}`, 'DELETE');
}

// === Contact Submissions ===
export async function submitInquiry(inquiryData) {
    try {
        const response = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inquiryData)
        });
        if (!response.ok) {
            throw new Error('Failed to submit enquiry');
        }
        return await response.json();
    } catch (err) {
        console.error('Error submitting enquiry:', err);
        throw err;
    }
}

export async function getInquiries() {
    try {
        const response = await fetch(`${API_URL}/contact-submissions`);
        if (!response.ok) {
            throw new Error('Failed to fetch enquiries');
        }
        return await response.json();
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        return [];
    }
}

export async function updateInquiryStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/contact-submissions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            throw new Error('Failed to update enquiry status');
        }
        return await response.json();
    } catch (err) {
        console.error('Error updating enquiry status:', err);
        throw err;
    }
}

export async function deleteInquiry(id) {
    try {
        const response = await fetch(`${API_URL}/contact-submissions/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete enquiry');
        }
        return await response.json();
    } catch (err) {
        console.error('Error deleting enquiry:', err);
        throw err;
    }
}

// === Invoices ===
export function getInvoices() {
    return initData(INVOICES_KEY, []);
}

export function getInvoiceById(id) {
    const invoices = getInvoices();
    return invoices.find(inv => inv.id === id) || null;
}

export function createInvoice(invoiceData) {
    const invoices = getInvoices();
    const nowStr = new Date().toISOString();
    const newInvoice = { 
        ...invoiceData, 
        id: generateId(),
        created_at: nowStr,
        updated_at: nowStr
    };
    invoices.push(newInvoice);
    saveData(INVOICES_KEY, invoices);
    syncNeon('/invoices', 'POST', newInvoice);

    // Automatically record / update customer in Customer Directory
    if (newInvoice.customer_details && newInvoice.customer_details.name) {
        const c = newInvoice.customer_details;
        const fullAddr = [c.address1, c.address2, c.city, c.postcode].filter(Boolean).map(s => s.trim()).join(', ');
        const v = newInvoice.vehicle_details || {};
        const vTitle = `${v.make || ''} ${v.model || ''}${v.registration ? ` [${v.registration.toUpperCase()}]` : ''}`.trim();
        const sale = newInvoice.sale_details || {};
        recordCustomerFromSale({
            full_name: c.name,
            phone: c.phone,
            email: c.email,
            address: fullAddr || c.address || '',
            vehicle_id: v.id || null,
            vehicle_name: vTitle || null,
            sale_price: sale.cashPrice || sale.balanceDue || null,
            sale_date: newInvoice.invoice_date || nowStr,
            invoice_number: newInvoice.invoice_number || null,
            lead_source: 'Invoice Sale',
            notes: newInvoice.notes || `Invoice #${newInvoice.invoice_number || ''}`
        });
    }

    return newInvoice;
}

export function updateInvoice(id, invoiceData) {
    const invoices = getInvoices();
    const idx = invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return null;
    const nowStr = new Date().toISOString();
    invoices[idx] = { 
        ...invoices[idx], 
        ...invoiceData, 
        id,
        updated_at: nowStr
    };
    saveData(INVOICES_KEY, invoices);
    syncNeon(`/invoices/${id}`, 'PUT', invoices[idx]);

    // Automatically record / update customer in Customer Directory
    if (invoices[idx].customer_details && invoices[idx].customer_details.name) {
        const c = invoices[idx].customer_details;
        const fullAddr = [c.address1, c.address2, c.city, c.postcode].filter(Boolean).map(s => s.trim()).join(', ');
        const v = invoices[idx].vehicle_details || {};
        const vTitle = `${v.make || ''} ${v.model || ''}${v.registration ? ` [${v.registration.toUpperCase()}]` : ''}`.trim();
        const sale = invoices[idx].sale_details || {};
        recordCustomerFromSale({
            full_name: c.name,
            phone: c.phone,
            email: c.email,
            address: fullAddr || c.address || '',
            vehicle_id: v.id || null,
            vehicle_name: vTitle || null,
            sale_price: sale.cashPrice || sale.balanceDue || null,
            sale_date: invoices[idx].invoice_date || nowStr,
            invoice_number: invoices[idx].invoice_number || null,
            lead_source: 'Invoice Sale',
            notes: invoices[idx].notes || `Invoice #${invoices[idx].invoice_number || ''}`
        });
    }

    return invoices[idx];
}

export function deleteInvoice(id) {
    const invoices = getInvoices().filter(inv => inv.id !== id);
    saveData(INVOICES_KEY, invoices);
    syncNeon(`/invoices/${id}`, 'DELETE');
}

// === Auto Trader API Services ===
export async function lookupVehicle(registration, odometerReadingMiles = 0) {
    try {
        const url = `${API_URL}/autotrader/vehicle-lookup?registration=${encodeURIComponent(registration)}&odometerReadingMiles=${odometerReadingMiles}`;
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Vehicle registration not found.');
            }
            throw new Error('Failed to retrieve vehicle details.');
        }
        return await response.json();
    } catch (err) {
        console.error('Error looking up vehicle:', err);
        throw err;
    }
}

export async function getConditionValuation(derivativeId, firstRegistrationDate, odometerReadingMiles, conditionRating) {
    try {
        const url = `${API_URL}/autotrader/valuation`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                derivativeId,
                firstRegistrationDate,
                odometerReadingMiles,
                conditionRating
            })
        });
        if (!response.ok) {
            throw new Error('Failed to retrieve adjusted valuation.');
        }
        return await response.json();
    } catch (err) {
        console.error('Error retrieving condition valuation:', err);
        throw err;
    }
}

export async function syncAutoTraderStock() {
    try {
        const url = `${API_URL}/autotrader/sync-stock`;
        const response = await fetch(url, {
            method: 'POST'
        });
        if (!response.ok) {
            let errorMsg = 'Failed to synchronize forecourt stock with Auto Trader.';
            try {
                const errData = await response.json();
                if (errData && errData.error) errorMsg = errData.error;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        const data = await response.json();
        await syncDataFromServer();
        return data;
    } catch (err) {
        console.error('Error syncing stock:', err);
        throw err;
    }
}

// === Deposit Slips ===
export function getDepositSlips() {
    return initData(DEPOSIT_SLIPS_KEY, []);
}

export function generateDepositSlipNumber() {
    const slips = getDepositSlips();
    const currentYear = new Date().getFullYear();
    const prefix = `VDS-${currentYear}-`;
    
    const existingNumbers = slips
        .map(s => s.receipt_number || '')
        .filter(n => n.startsWith(prefix))
        .map(n => parseInt(n.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
    
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(5, '0')}`;
}

export function createDepositSlip(data) {
    const slips = getDepositSlips();
    const nowStr = new Date().toISOString();
    const newSlip = {
        ...data,
        id: data.id || generateId(),
        receipt_number: data.receipt_number || generateDepositSlipNumber(),
        created_at: nowStr,
        updated_at: nowStr
    };
    slips.unshift(newSlip);
    saveData(DEPOSIT_SLIPS_KEY, slips);
    syncNeon('/deposit-slips', 'POST', newSlip);
    return newSlip;
}

export function updateDepositSlip(id, data) {
    const slips = getDepositSlips();
    const idx = slips.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const nowStr = new Date().toISOString();
    slips[idx] = {
        ...slips[idx],
        ...data,
        id,
        updated_at: nowStr
    };
    saveData(DEPOSIT_SLIPS_KEY, slips);
    syncNeon(`/deposit-slips/${id}`, 'PUT', slips[idx]);
    return slips[idx];
}

export function deleteDepositSlip(id) {
    const slips = getDepositSlips().filter(s => s.id !== id);
    saveData(DEPOSIT_SLIPS_KEY, slips);
    syncNeon(`/deposit-slips/${id}`, 'DELETE');
}

// === Distance Sale Right to Cancel Forms ===
export function getDistanceSaleForms() {
    return initData(DISTANCE_SALE_FORMS_KEY, []);
}

export function createDistanceSaleForm(data) {
    const forms = getDistanceSaleForms();
    const nowStr = new Date().toISOString();
    const newForm = {
        ...data,
        id: data.id || generateId(),
        created_at: nowStr,
        updated_at: nowStr
    };
    forms.unshift(newForm);
    saveData(DISTANCE_SALE_FORMS_KEY, forms);
    return newForm;
}

export function updateDistanceSaleForm(id, data) {
    const forms = getDistanceSaleForms();
    const idx = forms.findIndex(f => f.id === id);
    if (idx === -1) return null;
    const nowStr = new Date().toISOString();
    forms[idx] = {
        ...forms[idx],
        ...data,
        id,
        updated_at: nowStr
    };
    saveData(DISTANCE_SALE_FORMS_KEY, forms);
    return forms[idx];
}

export function deleteDistanceSaleForm(id) {
    const forms = getDistanceSaleForms().filter(f => f.id !== id);
    saveData(DISTANCE_SALE_FORMS_KEY, forms);
}

// === Customers ===
export function getCustomers() {
    syncCustomersFromSalesAndInvoices();
    return initData(CUSTOMERS_KEY, []);
}

export function syncCustomersFromSalesAndInvoices() {
    try {
        const invoices = initData(INVOICES_KEY, []);
        const cars = initData(CARS_KEY, carsData);
        let updatedAny = false;
        const customers = initData(CUSTOMERS_KEY, []);

        // 1. Sync from Invoices
        for (const inv of invoices) {
            const c = inv.customer_details;
            if (c && c.name && c.name.trim()) {
                const cleanName = c.name.trim();
                const cleanEmail = (c.email || '').trim().toLowerCase();
                const cleanPhone = (c.phone || '').trim().replace(/\s+/g, '');

                const found = customers.some(cust => {
                    if (cleanEmail && cust.email && cust.email.trim().toLowerCase() === cleanEmail) return true;
                    if (cleanPhone && cust.phone && cust.phone.trim().replace(/\s+/g, '') === cleanPhone) return true;
                    if (cleanName && cust.full_name && cust.full_name.trim().toLowerCase() === cleanName.toLowerCase()) return true;
                    return false;
                });

                if (!found) {
                    const fullAddr = [c.address1, c.address2, c.city, c.postcode].filter(Boolean).map(s => s.trim()).join(', ');
                    const v = inv.vehicle_details || {};
                    const vTitle = `${v.make || ''} ${v.model || ''}${v.registration ? ` [${v.registration.toUpperCase()}]` : ''}`.trim();
                    const sale = inv.sale_details || {};
                    const newCust = {
                        id: generateId(),
                        full_name: cleanName,
                        phone: (c.phone || '').trim(),
                        email: (c.email || '').trim(),
                        address: fullAddr || c.address || '',
                        vehicle_id: v.id || null,
                        vehicle_name: vTitle || null,
                        sale_price: sale.cashPrice || sale.balanceDue || null,
                        sale_date: inv.invoice_date || inv.created_at || new Date().toISOString(),
                        lead_source: 'Invoice Sale',
                        invoice_number: inv.invoice_number || null,
                        notes: inv.notes || `Generated from Invoice #${inv.invoice_number || ''}`,
                        created_at: inv.created_at || new Date().toISOString(),
                        updated_at: inv.updated_at || new Date().toISOString()
                    };
                    customers.unshift(newCust);
                    syncNeon('/customers', 'POST', newCust);
                    updatedAny = true;
                }
            }
        }

        // 2. Sync from Sold Cars
        for (const car of cars) {
            if (car.status === 'sold' && car.customer_details && car.customer_details.name) {
                const cd = car.customer_details;
                const cleanName = cd.name.trim();
                const cleanEmail = (cd.email || '').trim().toLowerCase();
                const cleanPhone = (cd.phone || '').trim().replace(/\s+/g, '');

                const found = customers.some(cust => {
                    if (car.customer_id && cust.id === car.customer_id) return true;
                    if (cleanEmail && cust.email && cust.email.trim().toLowerCase() === cleanEmail) return true;
                    if (cleanPhone && cust.phone && cust.phone.trim().replace(/\s+/g, '') === cleanPhone) return true;
                    if (cleanName && cust.full_name && cust.full_name.trim().toLowerCase() === cleanName.toLowerCase()) return true;
                    return false;
                });

                if (!found) {
                    const vName = `${car.year || ''} ${car.make || ''} ${car.model || ''}${car.registration ? ` [${car.registration}]` : ''}`.trim();
                    const newCust = {
                        id: car.customer_id || generateId(),
                        full_name: cleanName,
                        phone: (cd.phone || '').trim(),
                        email: (cd.email || '').trim(),
                        address: (cd.address || '').trim(),
                        vehicle_id: car.id,
                        vehicle_name: vName,
                        sale_price: car.price || null,
                        sale_date: new Date().toISOString(),
                        lead_source: car.lead_source || car.leadSource || 'Forecourt Sale',
                        notes: `Purchased ${vName}`,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    customers.unshift(newCust);
                    syncNeon('/customers', 'POST', newCust);
                    updatedAny = true;
                }
            }
        }

        if (updatedAny) {
            saveData(CUSTOMERS_KEY, customers);
        }
    } catch (e) {
        console.error('Error syncing customers from sales and invoices:', e);
    }
}

export function recordCustomerFromSale(data) {
    if (!data || !data.full_name || !data.full_name.trim()) return null;
    const customers = initData(CUSTOMERS_KEY, []);
    const cleanName = data.full_name.trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim().replace(/\s+/g, '');
    const nowStr = new Date().toISOString();

    const existingIdx = customers.findIndex(c => {
        if (data.id && c.id === data.id) return true;
        if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) return true;
        if (cleanPhone && c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone) return true;
        if (cleanName && c.full_name && c.full_name.trim().toLowerCase() === cleanName.toLowerCase()) return true;
        return false;
    });

    if (existingIdx !== -1) {
        const existing = customers[existingIdx];
        const updated = {
            ...existing,
            full_name: cleanName,
            phone: data.phone?.trim() || existing.phone,
            email: data.email?.trim() || existing.email,
            address: data.address?.trim() || existing.address,
            vehicle_id: data.vehicle_id || existing.vehicle_id,
            vehicle_name: data.vehicle_name || existing.vehicle_name,
            sale_price: (data.sale_price !== undefined && data.sale_price !== null) ? data.sale_price : existing.sale_price,
            sale_date: data.sale_date || existing.sale_date || nowStr,
            lead_source: data.lead_source || existing.lead_source,
            invoice_number: data.invoice_number || existing.invoice_number,
            notes: data.notes ? (existing.notes && !existing.notes.includes(data.notes) ? `${existing.notes}\n${data.notes}` : data.notes) : existing.notes,
            updated_at: nowStr
        };
        customers[existingIdx] = updated;
        saveData(CUSTOMERS_KEY, customers);
        syncNeon(`/customers/${updated.id}`, 'PUT', updated);
        window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CUSTOMERS_KEY } }));
        return updated;
    } else {
        const newCustomer = {
            id: data.id || generateId(),
            full_name: cleanName,
            phone: (data.phone || '').trim(),
            email: (data.email || '').trim(),
            address: (data.address || '').trim(),
            vehicle_id: data.vehicle_id || null,
            vehicle_name: data.vehicle_name || null,
            sale_price: data.sale_price || null,
            sale_date: data.sale_date || nowStr,
            lead_source: data.lead_source || null,
            invoice_number: data.invoice_number || null,
            notes: data.notes || '',
            created_at: nowStr,
            updated_at: nowStr
        };
        customers.unshift(newCustomer);
        saveData(CUSTOMERS_KEY, customers);
        syncNeon('/customers', 'POST', newCustomer);
        window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CUSTOMERS_KEY } }));
        return newCustomer;
    }
}

export function getCustomerById(id) {
    const customers = getCustomers();
    return customers.find(c => c.id === id) || null;
}

export function createCustomer(data) {
    const customers = getCustomers();
    const nowStr = new Date().toISOString();
    const newCustomer = {
        ...data,
        id: data.id || generateId(),
        full_name: data.full_name || data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        vehicle_id: data.vehicle_id || data.vehicleId || null,
        vehicle_name: data.vehicle_name || data.vehicleName || null,
        sale_price: data.sale_price || data.salePrice || null,
        sale_date: data.sale_date || data.saleDate || nowStr,
        lead_source: data.lead_source || data.leadSource || null,
        invoice_number: data.invoice_number || data.invoiceNumber || null,
        notes: data.notes || '',
        created_at: nowStr,
        updated_at: nowStr
    };
    customers.unshift(newCustomer);
    saveData(CUSTOMERS_KEY, customers);
    syncNeon('/customers', 'POST', newCustomer);
    window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CUSTOMERS_KEY } }));
    return newCustomer;
}

export function updateCustomer(id, data) {
    const customers = getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const nowStr = new Date().toISOString();
    customers[idx] = {
        ...customers[idx],
        ...data,
        full_name: data.full_name || data.fullName || customers[idx].full_name,
        phone: data.phone !== undefined ? data.phone : customers[idx].phone,
        email: data.email !== undefined ? data.email : customers[idx].email,
        address: data.address !== undefined ? data.address : customers[idx].address,
        invoice_number: data.invoice_number !== undefined ? data.invoice_number : customers[idx].invoice_number,
        id,
        updated_at: nowStr
    };
    saveData(CUSTOMERS_KEY, customers);
    syncNeon(`/customers/${id}`, 'PUT', customers[idx]);
    window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CUSTOMERS_KEY } }));
    return customers[idx];
}

export function deleteCustomer(id) {
    const customers = getCustomers().filter(c => c.id !== id);
    saveData(CUSTOMERS_KEY, customers);
    syncNeon(`/customers/${id}`, 'DELETE');
    window.dispatchEvent(new CustomEvent('vancar_data_updated', { detail: { key: CUSTOMERS_KEY } }));
}



