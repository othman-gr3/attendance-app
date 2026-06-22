import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { Box, CircularProgress } from '@mui/material';
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
import CheckInPage from "./checkin/CheckInPage";
import AttendanceHistory from "./checkin/AttendanceHistory";
import QRCodeDisplay from "./checkin/QRCodeDisplay";
import ProfilePage from "./pages/Profile/ProfilePage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import CalendarPage from "./pages/Calendar/CalendarPage";

const RootRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'ROLE_ADMIN' ? '/dashboard' : '/checkin'} replace />;
};

export default function App() {
    return (
        <ThemeModeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login"    element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* Walid's routes */}
                            <Route path="/checkin" element={
                                <ProtectedRoute>
                                    <Sidebar />
                                    <CheckInPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/history" element={
                                <ProtectedRoute>
                                    <Sidebar />
                                    <AttendanceHistory />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/borne" element={
                                <ProtectedRoute role="ROLE_ADMIN">
                                    <Sidebar />
                                    <QRCodeDisplay />
                                </ProtectedRoute>
                            } />

                            {/* Othmane's routes */}
                            <Route path="/admin/employees" element={
                                <ProtectedRoute role="ROLE_ADMIN">
                                    <Sidebar />
                                    <EmployeeListPage />
                                </ProtectedRoute>
                            } />

                            {/* Hiba's routes */}
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

                            {/* Employee pages */}
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Sidebar />
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/notifications" element={
                                <ProtectedRoute>
                                    <Sidebar />
                                    <NotificationsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/calendar" element={
                                <ProtectedRoute>
                                    <Sidebar />
                                    <CalendarPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/"  element={<RootRedirect />} />
                            <Route path="*"  element={<RootRedirect />} />
                        </Routes>

                        {/* ChatBot inside BrowserRouter so it can use router hooks */}
                        <ChatBot />
                    </BrowserRouter>
                </AuthProvider>
            </LanguageProvider>
        </ThemeModeProvider>
    );
}