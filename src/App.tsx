import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { supabase } from './lib/supabase';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Public Components & Pages
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppBtn from './components/WhatsAppBtn';
import Preloader from './components/Preloader';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Events from './components/Events';
import FAQ from './components/FAQ';
import BlogPage from './components/BlogPage';
import BlogPost from './components/BlogPost';

// Auth & Dashboard
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Admin Pages (New)
import AdminOverview from './pages/admin/AdminOverview';
import ClientsPage from './pages/admin/ClientsPage';
import ClientDetails from './pages/admin/ClientDetails';
import CreatePlan from './pages/admin/CreatePlan';
import PlansPage from './pages/admin/PlansPage';

// Helper Components
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setUserRole(data?.role || 'client');
      }
      setCheckingRole(false);
    };
    if (!loading) {
      if (user) checkRole(); else setCheckingRole(false);
    }
  }, [user, loading]);

  if (loading || (user && checkingRole)) return <Preloader />;

  if (user) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Landing Page Composition
const HomePage = () => (
  <>
    <Hero /> <Marquee /> <Features /> <HowItWorks /> <Testimonials /> <Pricing /> <Events /> <FAQ />
  </>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideHeaderFooter = ['/dashboard', '/login', '/signup', '/admin'].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-cream selection:bg-orange selection:text-white" dir="rtl">
      <ScrollToTop />
      {!hideHeaderFooter && <Header />}
      
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />

          {/* Auth */}
          <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
          <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />

          {/* Client Dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Admin Dashboard System */}
          <Route element={<AdminRoute />}>
             <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetails />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="plans/new/:userId" element={<CreatePlan />} />
             </Route>
          </Route>
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <WhatsAppBtn />}
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 1200); }, []);

  return (
    <>{loading ? <Preloader /> : <AuthProvider><Router><AppContent /></Router></AuthProvider>}</>
  );
};

export default App;