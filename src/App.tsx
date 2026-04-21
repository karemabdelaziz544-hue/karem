import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import ProtectedRoute from './components/ProtectedRoute';
import { getDefaultRouteForRole, isAppRole } from './lib/authRedirect';
import ErrorBoundary from './components/ErrorBoundary';

// 🟢 1. المكونات الأساسية والهيكلية (بنحملها فوراً عشان ميتأخرش شكل الموقع)
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import DoctorLayout from './layouts/DoctorLayout';
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
import MainAccountOnly from './components/MainAccountOnly';

// 🚀 2. التحميل الذكي (Lazy Loading) لباقي الصفحات (تحميل عند الحاجة فقط)
const BlogPage = React.lazy(() => import('./components/BlogPage'));
const BlogPost = React.lazy(() => import('./components/BlogPost'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));

// -- صفحات العميل --
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const History = React.lazy(() => import('./pages/History'));
const MedicalRecords = React.lazy(() => import('./pages/MedicalRecords'));
const Support = React.lazy(() => import('./pages/Support'));
const Subscriptions = React.lazy(() => import('./pages/Subscriptions'));
const FamilyMembers = React.lazy(() => import('./pages/FamilyMembers'));
const Settings = React.lazy(() => import('./pages/Settings'));

// -- صفحات الدكتور --
const DoctorDashboard = React.lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorClientDetails = React.lazy(() => import('./pages/doctor/DoctorClientDetails'));
const DoctorClients = React.lazy(() => import('./pages/doctor/DoctorClients'));
const DoctorPerformance = React.lazy(() => import('./pages/doctor/DoctorPerformance'));
const DoctorChat = React.lazy(() => import('./pages/doctor/DoctorChat'));

// -- صفحات الإدارة --
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const ClientsPage = React.lazy(() => import('./pages/admin/ClientsPage'));
const ClientDetails = React.lazy(() => import('./pages/admin/ClientDetails'));
const CreatePlan = React.lazy(() => import('./pages/admin/CreatePlan'));
const PlansPage = React.lazy(() => import('./pages/admin/PlansPage'));
const AdminChat = React.lazy(() => import('./pages/admin/AdminChat'));
const TransactionReview = React.lazy(() => import('./pages/admin/TransactionReview'));
const EditPlan = React.lazy(() => import('./pages/admin/EditPlan'));
const ManageEvents = React.lazy(() => import('./pages/admin/ManageEvents'));
const EventBookings = React.lazy(() => import('./pages/admin/EventBookings'));
const EventDetailsPage = React.lazy(() => import('./pages/admin/EventDetailsPage'));
const ManageBlog = React.lazy(() => import('./pages/admin/ManageBlog'));
const WriteArticle = React.lazy(() => import('./pages/admin/WriteArticle'));
const ManagePromoCodes = React.lazy(() => import('./pages/admin/ManagePromoCodes'));
const ManageFeedback = React.lazy(() => import('./pages/admin/ManageFeedback'));
const ClientPerformance = React.lazy(() => import('./pages/admin/ClientPerformance'));
const HomeEditor = React.lazy(() => import('./pages/admin/HomeEditor'));


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
        {/* 🛡️ درع الحماية ضد انهيار الموقع */}
        <ErrorBoundary>
          <Suspense fallback={<Preloader />}>
            <Routes>
              {/* صفحات عامة */}
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
              <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />

              {/* نظام العميل */}
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

              {/* نظام الطبيب */}
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

              {/* نظام الإدارة */}
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

              {/* صفحة 404 بديلة */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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