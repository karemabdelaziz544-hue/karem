import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import ProtectedRoute from './components/ProtectedRoute';
import { getDefaultRouteForRole, isAppRole } from './lib/authRedirect';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import DoctorLayout from './layouts/DoctorLayout';

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

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import ClientsPage from './pages/admin/ClientsPage';
import ClientDetails from './pages/admin/ClientDetails';
import CreatePlan from './pages/admin/CreatePlan';
import PlansPage from './pages/admin/PlansPage';
import AdminChat from './pages/admin/AdminChat';
import TransactionReview from './pages/admin/TransactionReview';
import EditPlan from './pages/admin/EditPlan';
import ManageEvents from './pages/admin/ManageEvents';
import EventBookings from './pages/admin/EventBookings';
import EventDetailsPage from './pages/admin/EventDetailsPage';
import ManageBlog from './pages/admin/ManageBlog';
import WriteArticle from './pages/admin/WriteArticle';
import ManagePromoCodes from './pages/admin/ManagePromoCodes';
import ManageFeedback from './pages/admin/ManageFeedback';
import ClientPerformance from './pages/admin/ClientPerformance';
import HomeEditor from './pages/admin/HomeEditor';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorClientDetails from './pages/doctor/DoctorClientDetails';
import DoctorClients from './pages/doctor/DoctorClients';
import DoctorPerformance from './pages/doctor/DoctorPerformance';
import DoctorChat from './pages/doctor/DoctorChat';

// Client Pages
import History from './pages/History';
import Subscriptions from './pages/Subscriptions';
import Support from './pages/Support';
import MedicalRecords from './pages/MedicalRecords';
import FamilyMembers from './pages/FamilyMembers';
import MainAccountOnly from './components/MainAccountOnly';

// Shared Pages
import Settings from './pages/Settings';

const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <Preloader />;

  const role = profile?.role;
  const hasValidRole = isAppRole(role);

  if (user && hasValidRole) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return <>{children}</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const HomePage = () => (
  <>
    <Hero />
    <Marquee />
    <Features />
    <HowItWorks />
    <Testimonials />
    <Pricing />
    <Events />
    <FAQ />
  </>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideHeaderFooter = ['/dashboard', '/login', '/signup', '/admin', '/doctor-dashboard'].some(
    (path) => location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen bg-cream selection:bg-orange selection:text-white" dir="rtl">
      <ScrollToTop />
      {!hideHeaderFooter && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
          <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />

          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/dashboard" element={<ClientLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="history" element={<History />} />
              <Route path="medical-records" element={<MedicalRecords />} />
              <Route path="support" element={<Support />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="family" element={<MainAccountOnly><FamilyMembers /></MainAccountOnly>} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor-dashboard" element={<DoctorLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="clients" element={<DoctorClients />} />
              <Route path="client/:id" element={<DoctorClientDetails />} />
              <Route path="performance" element={<DoctorPerformance />} />
              <Route path="chat" element={<DoctorChat />} />
              <Route path="plans/new/:userId" element={<CreatePlan />} />
              <Route path="plans/edit/:planId" element={<EditPlan />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="performance" element={<ClientPerformance />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="plans/new/:userId" element={<CreatePlan />} />
              <Route path="plans/edit/:planId" element={<EditPlan />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="transactions" element={<TransactionReview />} />
              <Route path="feedback" element={<ManageFeedback />} />
              <Route path="events" element={<ManageEvents />} />
              <Route path="home-editor" element={<HomeEditor />} />
              <Route path="events/:id" element={<EventDetailsPage />} />
              <Route path="event-bookings" element={<EventBookings />} />
              <Route path="blog" element={<ManageBlog />} />
              <Route path="blog/new" element={<WriteArticle />} />
              <Route path="promocodes" element={<ManagePromoCodes />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <WhatsAppBtn />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <AuthProvider>
        <FamilyProvider>
          <Router>
            <AppContent />
          </Router>
        </FamilyProvider>
      </AuthProvider>
    </>
  );
};

export default App;
