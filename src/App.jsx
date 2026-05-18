import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, ScrollRestoration, Outlet } from 'react-router-dom';
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

import { useEffect, useState } from 'react';
import { syncDataFromServer } from './services/dataService';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncDataFromServer().then(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{color: 'white'}}>Loading...</div></div>;
  }

  return <RouterProvider router={router} />;
}
