import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import EmployeeListPage from './pages/Admin/EmployeeListPage';
import LeaveRequestForm from './pages/Leave/LeaveRequestForm';
import AdminLeaveApproval from './pages/Leave/AdminLeaveApproval';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AnomalyReport from './pages/Dashboard/AnomalyReport';
import ChatBot from './components/Chatbot/ChatBot';

const theme = createTheme({
  palette: {
    primary: { main: '#0F2942' },
    secondary: { main: '#2563EB' },
    background: { default: '#F4F6F8', paper: '#FFFFFF' },
    text: { primary: '#0D1B2A', secondary: '#4A5568' },
    success: { main: '#1B6B45' },
    error: { main: '#9B2335' },
    warning: { main: '#92600A' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #DDE1E7',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0F2942, #1A4A6B)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1A4A6B, #0F2942)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: '#2563EB' },
            '&.Mui-focused fieldset': { borderColor: '#0F2942' },
          }
        }
      }
    }
  }
});

export default function App() {
  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/admin/employees" element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Sidebar />
                  <EmployeeListPage />
                </ProtectedRoute>
              } />

              <Route path="/leave" element={
                <ProtectedRoute>
                  <Sidebar />
                  <LeaveRequestForm />
                </ProtectedRoute>
              } />

              <Route path="/admin/leaves" element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Sidebar />
                  <AdminLeaveApproval />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Sidebar />
                  <DashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/anomalies" element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Sidebar />
                  <AnomalyReport />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
          <ChatBot />
        </AuthProvider>
      </ThemeProvider>
  );
}