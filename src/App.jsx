import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Dashboard from './pages/Dashboard';
import PatientManagement from './pages/PatientManagement';
import PatientProfile from './pages/PatientProfile';
import Invoice from './pages/Invoice';
import ManualInvoice from './pages/ManualInvoice';
import Settings from './pages/Settings';
import Login from './pages/Login';
import DueManagement from './pages/DueManagement';
import DailyRecords from './pages/DailyRecords';
import Therapy from './pages/Therapy';
import DiagnosisDebug from './pages/DiagnosisDebug';
import MedicalNotes from './pages/MedicalNotes';

// Components
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Layout Component
const Layout = ({ children }) => {
  const { user, role } = useAuth();

  if (!user) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Only show Navbar for admin users */}
      {role === 'admin' && <Navbar />}
      <div className={`flex-1 overflow-x-hidden overflow-y-auto ${role === 'viewer' ? 'ml-0' : ''}`}>
        <div className="max-w-[2000px] mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard - accessible by both admin and viewer */}
          <Route 
            path="/dashboard" 
            element={<PrivateRoute component={Dashboard} />} 
          />

          {/* Admin-only routes */}
          <Route
            path="/patients"
            element={<PrivateRoute component={PatientManagement} requiredRole="admin" />}
          />
          <Route
            path="/patients/:id"
            element={<PrivateRoute component={PatientProfile} requiredRole="admin" />}
          />
          <Route
            path="/diagnosis-debug/:id"
            element={<DiagnosisDebug />}
          />
          <Route
            path="/invoice"
            element={<PrivateRoute component={Invoice} requiredRole="admin" />}
          />
          <Route
            path="/settings"
            element={<PrivateRoute component={Settings} requiredRole="admin" />}
          />
          <Route
            path="/due-management"
            element={<PrivateRoute component={DueManagement} requiredRole="admin" />}
          />
          <Route
            path="/daily-records"
            element={<PrivateRoute component={DailyRecords} requiredRole="admin" />}
          />
          <Route
            path="/therapy"
            element={<PrivateRoute component={Therapy} requiredRole="admin" />}
          />
          <Route
            path="/medical-notes"
            element={<PrivateRoute component={MedicalNotes} requiredRole="admin" />}
          />
          <Route
            path="/manual-invoice"
            element={<PrivateRoute component={ManualInvoice} requiredRole="admin" />}
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
      </Layout>
    </AuthProvider>
  );
}

export default App;
