import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { Customers } from '@/pages/Customers';
import { Invoices } from '@/pages/Invoices';
import { Shipments } from '@/pages/Shipments';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { useAppStore } from '@/store/appStore';
import { initializeDatabase } from '@/db/database';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Protected Route Component
function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) {
  const { isAuthenticated, hasRole } = useAppStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Main Layout Component
function MainLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, loadCompany } = useAppStore();

  useEffect(() => {
    loadCompany();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          isSidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header />
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize database on app load
    initializeDatabase();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Inventory />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Customers />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <ProtectedRoute requiredRoles={['admin', 'master', 'sales']}>
              <MainLayout>
                <Invoices />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Shipments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRoles={['admin', 'master']}>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRoles={['admin', 'master']}>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
