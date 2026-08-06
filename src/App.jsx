import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, ScrollRestoration, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home/Home';
import Buy from './pages/Buy/Buy';
import CarDetails from './pages/CarDetails/CarDetails';
import Sell from './pages/Sell/Sell';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Blog from './pages/Blog/Blog';
import BlogArticle from './pages/BlogArticle/BlogArticle';

// Admin Pages
import Login from './pages/admin/Login/Login';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import ManageCars from './pages/admin/ManageCars/ManageCars';
import CarEditor from './pages/admin/CarEditor/CarEditor';
import ManageBlogs from './pages/admin/ManageBlogs/ManageBlogs';
import BlogEditor from './pages/admin/BlogEditor/BlogEditor';
import Settings from './pages/admin/Settings/Settings';
import ExpenseTracker from './pages/admin/ExpenseTracker/ExpenseTracker';
import GeneralExpenseTracker from './pages/admin/GeneralExpenseTracker/GeneralExpenseTracker';
import BusinessAnalytics from './pages/admin/BusinessAnalytics/BusinessAnalytics';
import Enquiries from './pages/admin/Enquiries/Enquiries';
import BannerGenerator from './pages/admin/BannerGenerator/BannerGenerator';
import InvoiceGenerator from './pages/admin/InvoiceGenerator/InvoiceGenerator';
import DepositSlipGenerator from './pages/admin/DepositSlipGenerator/DepositSlipGenerator';
import DistanceSaleGenerator from './pages/admin/DistanceSaleGenerator/DistanceSaleGenerator';
import { syncDataFromServer } from './services/dataService';

const CustomersPlaceholder = () => (
  <div className="p-8 min-h-[80vh] flex flex-col justify-center items-center text-center">
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-md">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(85,160,31,0.1)', color: '#55A01F' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Customers Directory</h2>
      <p className="text-slate-500 text-sm mb-0">Manage customer records, CRM profiles, and purchase history. This module is currently under development.</p>
    </div>
  </div>
);

const SalesPlaceholder = () => (
  <div className="p-8 min-h-[80vh] flex flex-col justify-center items-center text-center">
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-md">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(85,160,31,0.1)', color: '#55A01F' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Sales Analytics</h2>
      <p className="text-slate-500 text-sm mb-0">Track closed vehicle sales, commission records, and dealership revenue metrics. This module is currently under development.</p>
    </div>
  </div>
);

// Auth Guard
import { isAuthenticated } from './services/authService';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Root component to handle global app behavior like ScrollRestoration
const Root = () => {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="buy" element={<Buy />} />
        <Route path="buy/:id" element={<CarDetails />} />
        <Route path="sell" element={<Sell />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogArticle />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin/login" element={<Login />} />

      <Route path="admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="cars" element={<ManageCars />} />
        <Route path="cars/new" element={<CarEditor />} />
        <Route path="cars/:id/edit" element={<CarEditor />} />
        <Route path="blogs" element={<ManageBlogs />} />
        <Route path="blogs/new" element={<BlogEditor />} />
        <Route path="blogs/:id/edit" element={<BlogEditor />} />
        <Route path="expenses" element={<ExpenseTracker />} />
        <Route path="general-expenses" element={<GeneralExpenseTracker />} />
        <Route path="analytics" element={<BusinessAnalytics />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="banner-generator" element={<BannerGenerator />} />
        <Route path="customers" element={<CustomersPlaceholder />} />
        <Route path="sales" element={<SalesPlaceholder />} />
        <Route path="invoices" element={<InvoiceGenerator />} />
        <Route path="deposit-slips" element={<DepositSlipGenerator />} />
        <Route path="distance-sale" element={<DistanceSaleGenerator />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>The page you are looking for does not exist.</p>
          <a href="/" className="btn btn--primary">Go Home</a>
        </div>
      } />
    </Route>
  )
);

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncDataFromServer().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(85,160,31,0.2)', borderTop: '3px solid #55A01F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
