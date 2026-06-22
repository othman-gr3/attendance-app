import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, IconButton, useTheme } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { themeMode, setThemeMode } = useThemeMode();
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [hoveredLink, setHoveredLink] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(() => {
        return user?.userId ? localStorage.getItem(`avatar_${user.userId}`) : null;
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user?.userId) return;
        
        const saved = localStorage.getItem(`avatar_${user.userId}`);
        if (saved) setAvatarUrl(saved);

        const handleUpdate = () => {
            setAvatarUrl(localStorage.getItem(`avatar_${user.userId}`));
        };

        window.addEventListener('profile-pic-updated', handleUpdate);
        
        api.get('/users/me')
            .then(res => {
                if (res.data?.profilePic) {
                    localStorage.setItem(`avatar_${user.userId}`, res.data.profilePic);
                    setAvatarUrl(res.data.profilePic);
                } else {
                    localStorage.removeItem(`avatar_${user.userId}`);
                    setAvatarUrl(null);
                }
            })
            .catch(() => {});

        return () => {
            window.removeEventListener('profile-pic-updated', handleUpdate);
        };
    }, [user?.userId]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const isActive = (path) => location.pathname === path;

    // Get user initials for avatar
    const getInitials = () => {
        if (!user?.nom) return '?';
        return user.nom.charAt(0).toUpperCase();
    };

    // Get role display text
    const getRoleDisplay = () => {
        return user?.role === 'ROLE_ADMIN' ? t('sidebar.admin') : t('sidebar.employee');
    };

    const sidebarStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '240px',
        height: '100vh',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        zIndex: 100,
    };

    const profileSectionStyle = {
        padding: '24px 16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    };

    const avatarStyle = {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
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
        color: theme.palette.text.primary,
        textAlign: 'center',
    };

    const roleBadgeStyle = {
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: user?.role === 'ROLE_ADMIN' ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#1a2340') : theme.palette.primary.main,
        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#FFFFFF',
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
        backgroundColor: isActive(path) ? theme.palette.primary.main : 'transparent',
        color: isActive(path) ? '#FFFFFF' : hoveredLink === path ? theme.palette.primary.main : theme.palette.text.secondary,
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
            { path: '/dashboard', label: t('sidebar.dashboard'), icon: <DashboardIcon style={navIconStyle} /> },
            { path: '/admin/leaves', label: t('sidebar.approvals'), icon: <AssignmentTurnedInIcon style={navIconStyle} /> },
            { path: '/admin/anomalies', label: t('sidebar.anomalyReport'), icon: <WarningAmberIcon style={navIconStyle} /> },
            { path: '/admin/employees', label: t('sidebar.employees'), icon: <PeopleIcon style={navIconStyle} /> },
            { path: '/admin/borne', label: t('sidebar.qrKiosk'), icon: <QrCodeScannerIcon style={navIconStyle} /> },
            { path: '/profile', label: t('sidebar.myProfile'), icon: <PersonIcon style={navIconStyle} /> },
        ];

        const employeeLinks = [
            { path: '/checkin', label: t('sidebar.checkIn'), icon: <QrCodeScannerIcon style={navIconStyle} /> },
            { path: '/history', label: t('sidebar.history'), icon: <HistoryIcon style={navIconStyle} /> },
            { path: '/calendar', label: t('sidebar.calendar'), icon: <CalendarMonthIcon style={navIconStyle} /> },
            { path: '/leave', label: t('sidebar.myLeave'), icon: <EventNoteIcon style={navIconStyle} /> },
            { path: '/notifications', label: t('sidebar.notifications'), icon: <NotificationsIcon style={navIconStyle} /> },
            { path: '/profile', label: t('sidebar.myProfile'), icon: <PersonIcon style={navIconStyle} /> },
        ];

        return user?.role === 'ROLE_ADMIN' ? adminLinks : employeeLinks;
    };

    const mobileHeaderStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 1000,
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0, 0, 0, 0.04)',
    };

    const mobileTitleStyle = {
        fontSize: '18px',
        fontWeight: '700',
        color: theme.palette.text.primary,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    };

    const mobileAvatarContainerStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
    };

    const renderSidebarContent = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.palette.background.paper }}>
                {/* Profile Section */}
                <div style={profileSectionStyle}>
                    <div style={{ ...avatarStyle, overflow: 'hidden' }}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            getInitials()
                        )}
                    </div>
                    <div style={userNameStyle}>{user?.nom || t('sidebar.user')}</div>
                    <div style={roleBadgeStyle}>{getRoleDisplay()}</div>
                </div>

                {/* Navigation Links */}
                <div style={navSectionStyle}>
                    {getNavLinks().map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={navLinkStyle(link.path)}
                            onClick={() => {
                                setHoveredLink(null);
                                setMobileOpen(false);
                            }}
                            onMouseEnter={() => setHoveredLink(link.path)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>


                {/* Theme Switcher */}
                <div style={{
                    padding: '12px 16px',
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {t('sidebar.theme')}
                    </div>
                    <div style={{
                        display: 'flex',
                        background: theme.palette.mode === 'dark' ? '#1E293B' : '#F4F6F8',
                        borderRadius: '8px',
                        padding: '4px',
                    }}>
                        <button
                            onClick={() => setThemeMode('light')}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: themeMode === 'light' ? '#FFFFFF' : 'transparent',
                                color: themeMode === 'light' ? theme.palette.primary.main : theme.palette.text.secondary,
                                padding: '6px 0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: themeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {t('sidebar.themeLight')}
                        </button>
                        <button
                            onClick={() => setThemeMode('dark')}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: themeMode === 'dark' ? '#0F172A' : 'transparent',
                                color: themeMode === 'dark' ? theme.palette.primary.main : theme.palette.text.secondary,
                                padding: '6px 0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: themeMode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {t('sidebar.themeDark')}
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <div style={{ padding: '12px', borderTop: `1px solid ${theme.palette.divider}` }}>
                    <button
                        onClick={handleLogout}
                        style={logoutButtonStyle}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFE8E8';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        <LogoutIcon style={navIconStyle} />
                        <span>{t('sidebar.logout')}</span>
                    </button>
                </div>
            </div>
        );
    };

    if (isMobile) {
        return (
            <>
                {/* Mobile Header Bar */}
                <div style={mobileHeaderStyle}>
                    <IconButton onClick={() => setMobileOpen(true)} style={{ color: theme.palette.text.primary }}>
                        <MenuIcon />
                    </IconButton>
                    <div style={mobileTitleStyle}>{t('sidebar.appName')}</div>
                    <div style={mobileAvatarContainerStyle} onClick={() => navigate('/profile')}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            getInitials()
                        )}
                    </div>
                </div>

                {/* Drawer containing navigation */}
                <Drawer
                    anchor="left"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    PaperProps={{
                        sx: {
                            width: '240px',
                            border: 'none',
                        }
                    }}
                >
                    {renderSidebarContent()}
                </Drawer>
            </>
        );
    }

    return (
        <div style={sidebarStyle}>
            {renderSidebarContent()}
        </div>
    );
};

export default Sidebar;

