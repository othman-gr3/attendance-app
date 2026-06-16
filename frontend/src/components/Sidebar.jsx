import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [hoveredLink, setHoveredLink] = useState(null);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    // Get user initials for avatar
    const getInitials = () => {
        if (!user?.nom) return '?';
        return user.nom.charAt(0).toUpperCase();
    };

    // Get role display text
    const getRoleDisplay = () => {
        return user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee';
    };

    const sidebarStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '240px',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E8EAED',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        zIndex: 100,
    };

    const profileSectionStyle = {
        padding: '24px 16px',
        borderBottom: '1px solid #E8EAED',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    };

    const avatarStyle = {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#1976D2',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '700',
    };

    const userNameStyle = {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1a2340',
        textAlign: 'center',
    };

    const roleBadgeStyle = {
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: user?.role === 'ROLE_ADMIN' ? '#1a2340' : '#1976D2',
        color: '#FFFFFF',
        textAlign: 'center',
    };

    const navSectionStyle = {
        flex: 1,
        padding: '20px 12px',
        overflowY: 'auto',
    };

    const navLinkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        marginBottom: '8px',
        borderRadius: '10px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '15px',
        fontWeight: '500',
        backgroundColor: isActive(path) ? '#1976D2' : 'transparent',
        color: isActive(path) ? '#FFFFFF' : hoveredLink === path ? '#1976D2' : '#555555',
    });

    const navIconStyle = {
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const logoutButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        margin: '12px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#CF3B3B',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    // Define navigation links based on role
    const getNavLinks = () => {
        const adminLinks = [
            { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon style={navIconStyle} /> },
            { path: '/admin/leaves', label: 'Leave Approval', icon: <AssignmentTurnedInIcon style={navIconStyle} /> },
            { path: '/admin/anomalies', label: 'Anomaly Report', icon: <WarningAmberIcon style={navIconStyle} /> },
            { path: '/admin/employees', label: 'Employees', icon: <PeopleIcon style={navIconStyle} /> },
        ];

        const employeeLinks = [
            { path: '/leave', label: 'My Leave Requests', icon: <EventNoteIcon style={navIconStyle} /> },
        ];

        return user?.role === 'ROLE_ADMIN' ? adminLinks : employeeLinks;
    };

    return (
        <div style={sidebarStyle}>
            {/* Profile Section */}
            <div style={profileSectionStyle}>
                <div style={avatarStyle}>{getInitials()}</div>
                <div style={userNameStyle}>{user?.nom || 'User'}</div>
                <div style={roleBadgeStyle}>{getRoleDisplay()}</div>
            </div>

            {/* Navigation Links */}
            <div style={navSectionStyle}>
                {getNavLinks().map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        style={navLinkStyle(link.path)}
                        onMouseEnter={() => setHoveredLink(link.path)}
                        onMouseLeave={() => setHoveredLink(null)}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Logout Button */}
            <div style={{ padding: '12px', borderTop: '1px solid #E8EAED' }}>
                <button
                    onClick={handleLogout}
                    style={logoutButtonStyle}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#FFE8E8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <LogoutIcon style={navIconStyle} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

