import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider, DataProvider } from './utils/store';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';

// Lazy Load Pages
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const AuthPages = lazy(() => import('./pages/AuthPages'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const DashboardDay = lazy(() => import('./pages/DashboardDay'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
import Chatbot from './components/Chatbot';

// Loading Component
const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#000',
    color: '#fff',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255,255,255,0.3)',
      borderTop: '4px solid #4ade80',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p>Loading...</p>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/auth" element={<AuthPages />} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardHome />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/:date"
                    element={
                      <ProtectedRoute>
                        <DashboardDay />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </Suspense>
              <Chatbot />
            </Router>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
