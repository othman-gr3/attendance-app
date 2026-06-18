import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import AttendanceChart from './AttendanceChart';
import AnomalyReport from './AnomalyReport';
import { useLanguage } from '../../context/LanguageContext';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { Drawer, Box, IconButton, Typography, Divider, useTheme } from '@mui/material';

const DashboardPage = () => {
    const { t, language } = useLanguage();
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [openAnomalyDrawer, setOpenAnomalyDrawer] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleLoadStats = async () => {
        if (!selectedUserId) {
            setError(t('dashboard.errorSelectUser'));
            return;
        }

        setLoading(true);
        setError('');
        setStats(null);

        try {
            const response = await api.get('/stats', {
                params: {
                    userId: selectedUserId,
                    month: month,
                    year: year,
                },
            });
            setStats(response.data);
        } catch (err) {
            setError(t('dashboard.errorLoad'));
            console.error('Error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (selectedUserId) {
            handleLoadStats();
        }
        // eslint-disable-next-line
    }, [selectedUserId, month, year]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchUsers();
            if (selectedUserId) {
                handleLoadStats();
            }
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
    }, [selectedUserId, month, year]);

    const getInitials = (nom) => {
        if (!nom) return '?';
        return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const pageStyle = {
        marginLeft: '240px',
        padding: '32px 40px',
        backgroundColor: theme.palette.background.default,
        height: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    };

    const headerStyle = {
        marginBottom: '40px',
    };

    const titleStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: theme.palette.text.primary,
        margin: '0 0 8px 0',
    };

    const subtitleStyle = {
        fontSize: '14px',
        color: theme.palette.text.secondary,
        margin: '0',
    };

    const filterBarStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        padding: '24px',
        marginBottom: '40px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '16px',
        alignItems: 'flex-end',
    };

    const selectStyle = {
        padding: '10px 12px',
        fontSize: '14px',
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
        color: theme.palette.text.primary,
        borderRadius: '8px',
        fontFamily: 'inherit',
        outline: 'none',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: theme.palette.text.primary,
        marginBottom: '8px',
    };

    const buttonStyle = {
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    };

    const statCardsContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '40px',
    };

    const statCardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        padding: '24px',
    };

    const statLabelStyle = {
        fontSize: '12px',
        color: theme.palette.text.secondary,
        fontWeight: '500',
        marginBottom: '12px',
    };

    const statValueStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: theme.palette.text.primary,
    };

    const chartContainerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '40px',
    };

    const errorStyle = {
        backgroundColor: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE',
        color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828',
        border: theme.palette.mode === 'dark' ? '1px solid #ef444433' : 'none',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
    };

    return (
        <div className="page-container" style={pageStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={titleStyle}>{t('dashboard.title')}</h1>
                    <p style={subtitleStyle}>{t('dashboard.subtitle')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className="pulse-live-indicator" style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#4CAF50',
                            display: 'inline-block',
                        }} />
                        <span style={{ fontSize: '12px', color: theme.palette.text.secondary, fontWeight: '500' }}>
                            {t('dashboard.liveAutoRefresh')}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Role Filter Pills */}
                    <div style={{ display: 'flex', border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: theme.palette.background.paper }}>
                        {[
                            { value: 'ALL', label: t('dashboard.pillAll') },
                            { value: 'ROLE_EMPLOYE', label: t('dashboard.pillEmployees') },
                            { value: 'ROLE_ADMIN', label: t('dashboard.pillAdmins') }
                        ].map(opt => {
                            const isActive = roleFilter === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setRoleFilter(opt.value)}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        border: 'none',
                                        backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
                                        color: isActive ? '#FFFFFF' : theme.palette.text.secondary,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '260px' }}>
                        <SearchIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.palette.text.secondary, fontSize: '18px' }} />
                        <input
                            type="text"
                            placeholder={t('dashboard.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                fontSize: '13px',
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px',
                                outline: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
                                color: theme.palette.text.primary,
                            }}
                            onFocus={(e) => e.target.style.borderColor = theme.palette.primary.main}
                            onBlur={(e) => e.target.style.borderColor = theme.palette.divider}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: theme.palette.text.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                            >
                                <CloseIcon style={{ fontSize: '16px' }} />
                            </button>
                        )}
                    </div>

                    {selectedUserId && (
                        <button
                            onClick={() => setSelectedUserId('')}
                            style={{
                                ...buttonStyle,
                                backgroundColor: '#FFFFFF',
                                color: '#1976D2',
                                border: '1px solid #1976D2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E3F2FD';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                            }}
                        >
                            <ArrowBackIcon style={{ fontSize: '16px' }} /> {t('dashboard.btnAll')}
                        </button>
                    )}
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '4px' }}>
                {!selectedUserId ? (
                /* Full Page Grid of Big Employee Cards */
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: theme.palette.text.primary, marginBottom: '24px' }}>
                        {t('dashboard.selectHeader')}
                    </h2>
                    {filteredUsers.length === 0 ? (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: '12px',
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.secondary,
                            fontSize: '14px',
                            marginBottom: '24px',
                        }}>
                            {t('dashboard.noEmployees', { searchTerm })}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '24px',
                            padding: '8px 4px',
                        }}>
                            {filteredUsers.map((u) => {
                                const avatarUrl = u.profilePic || localStorage.getItem(`avatar_${u.id}`);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        style={{
                                            backgroundColor: theme.palette.background.paper,
                                            borderRadius: '16px',
                                            border: `1px solid ${theme.palette.divider}`,
                                            padding: '32px 24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.03)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.borderColor = theme.palette.primary.main;
                                            e.currentTarget.style.boxShadow = theme.palette.mode === 'dark'
                                                ? '0 8px 24px rgba(38, 115, 221, 0.3)'
                                                : '0 8px 24px rgba(38, 115, 221, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = theme.palette.divider;
                                            e.currentTarget.style.boxShadow = theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.03)';
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#E0E0E0',
                                            color: theme.palette.text.secondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700',
                                            fontSize: '26px',
                                            overflow: 'hidden',
                                            marginBottom: '16px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                        }}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={u.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                getInitials(u.nom)
                                            )}
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: theme.palette.text.primary, margin: '0 0 6px 0' }}>
                                            {u.nom}
                                        </h3>
                                        <p style={{ fontSize: '13px', color: theme.palette.text.secondary, margin: '0 0 16px 0' }}>
                                            {u.email}
                                        </p>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            backgroundColor: u.role === 'ROLE_ADMIN' 
                                                ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FFE2E2') 
                                                : (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.2)' : '#E0F2FE'),
                                            color: u.role === 'ROLE_ADMIN' 
                                                ? (theme.palette.mode === 'dark' ? '#F87171' : '#C62828') 
                                                : (theme.palette.mode === 'dark' ? '#60A5FA' : '#0369A1')
                                        }}>
                                            {u.role === 'ROLE_ADMIN' ? t('employees.roleAdmin') : t('employees.roleEmployee')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Selected Mode: Compact Top List + Stats */
                <div>
                    {/* Horizontal Scrollbar of User Cards */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            overflowX: 'auto',
                            padding: '8px 4px',
                            whiteSpace: 'nowrap',
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {filteredUsers.map((u) => {
                                const isSelected = u.id === selectedUserId;
                                const avatarUrl = u.profilePic || localStorage.getItem(`avatar_${u.id}`);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        style={{
                                            flex: '0 0 auto',
                                            backgroundColor: isSelected 
                                                ? (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.2)' : '#E3F2FD') 
                                                : theme.palette.background.paper,
                                            borderRadius: '10px',
                                            border: isSelected 
                                                ? `2px solid ${theme.palette.primary.main}` 
                                                : `1px solid ${theme.palette.divider}`,
                                            padding: '10px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            width: '240px',
                                            boxSizing: 'border-box',
                                            boxShadow: isSelected ? '0 4px 10px rgba(38, 115, 221, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = theme.palette.primary.main;
                                                e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.08)' : '#F5F9FC';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = theme.palette.divider;
                                                e.currentTarget.style.backgroundColor = theme.palette.background.paper;
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: isSelected 
                                                ? theme.palette.primary.main 
                                                : (theme.palette.mode === 'dark' ? '#1E293B' : '#E0E0E0'),
                                            color: isSelected ? '#FFFFFF' : theme.palette.text.secondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700',
                                            fontSize: '12px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                        }}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={u.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                getInitials(u.nom)
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                color: theme.palette.text.primary,
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {u.nom}
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                color: theme.palette.text.secondary,
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {u.role === 'ROLE_ADMIN' ? t('employees.roleAdmin') : t('employees.roleEmployee')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ ...filterBarStyle, gridTemplateColumns: '1fr 1fr 1fr 1.2fr' }}>
                        <div>
                            <label style={labelStyle}>{t('dashboard.fieldMonth')}</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                style={{ ...selectStyle, width: '100%' }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>
                                        {new Date(2024, m - 1).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>{t('dashboard.fieldYear')}</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                style={{ ...selectStyle, width: '100%' }}
                            >
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>

                        <button
                            onClick={handleLoadStats}
                            style={buttonStyle}
                            disabled={loading}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = '#1565C0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#1976D2';
                            }}
                        >
                            {loading ? t('dashboard.btnLoading') : t('dashboard.btnRefresh')}
                        </button>

                        <button
                            onClick={() => setOpenAnomalyDrawer(true)}
                            style={{
                                ...buttonStyle,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(229, 62, 62, 0.15)' : '#FFF5F5',
                                color: theme.palette.mode === 'dark' ? '#F87171' : '#E53E3E',
                                border: theme.palette.mode === 'dark' ? '1px solid rgba(229, 62, 62, 0.3)' : '1px solid #FED7D7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E53E3E';
                                e.currentTarget.style.color = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#E53E3E';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(229, 62, 62, 0.15)' : '#FFF5F5';
                                e.currentTarget.style.color = theme.palette.mode === 'dark' ? '#F87171' : '#E53E3E';
                                e.currentTarget.style.borderColor = theme.palette.mode === 'dark' ? 'rgba(229, 62, 62, 0.3)' : '#FED7D7';
                            }}
                        >
                            {t('dashboard.btnAnomalyBoard')}
                        </button>
                    </div>

                    {/* Stats & Charts */}
                    {stats && (
                        <>
                            <div style={statCardsContainerStyle}>
                                <div style={statCardStyle}>
                                    <div style={statLabelStyle}>{t('dashboard.statHours')}</div>
                                    <div style={statValueStyle}>{stats.heuresTravaillees.toFixed(1)}h</div>
                                </div>
                                <div 
                                    onClick={() => setOpenAnomalyDrawer(true)}
                                    style={{ 
                                        ...statCardStyle, 
                                        cursor: 'pointer', 
                                        border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent'}`,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#FF9500';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent';
                                        e.currentTarget.style.boxShadow = theme.palette.mode === 'dark'
                                            ? '0 4px 20px rgba(0,0,0,0.25)'
                                            : '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <div style={{ ...statLabelStyle, color: '#FF9500' }}>{t('dashboard.statLates')}</div>
                                    <div style={{ ...statValueStyle, color: '#FF9500' }}>{stats.retards}</div>
                                </div>
                                <div 
                                    onClick={() => setOpenAnomalyDrawer(true)}
                                    style={{ 
                                        ...statCardStyle, 
                                        cursor: 'pointer', 
                                        border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent'}`,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#F44336';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent';
                                        e.currentTarget.style.boxShadow = theme.palette.mode === 'dark'
                                            ? '0 4px 20px rgba(0,0,0,0.25)'
                                            : '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <div style={{ ...statLabelStyle, color: '#F44336' }}>{t('dashboard.statAbsences')}</div>
                                    <div style={{ ...statValueStyle, color: '#F44336' }}>{stats.absences}</div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={{ ...statLabelStyle, color: '#4CAF50' }}>{t('dashboard.statLeavesLeft')}</div>
                                    <div style={{ ...statValueStyle, color: '#4CAF50' }}>{stats.congesRestants}</div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={{ ...statLabelStyle, color: '#1976D2' }}>{t('dashboard.statPresenceRate')}</div>
                                    <div style={{ ...statValueStyle, color: '#1976D2' }}>{stats.tauxPresence}%</div>
                                </div>
                            </div>

                            <div style={chartContainerStyle}>
                                <AttendanceChart userId={selectedUserId} month={month} year={year} />
                            </div>
                        </>
                    )}
                </div>
            )}
            </div>

            {/* Anomaly Report Drawer */}
            <Drawer
                anchor="right"
                open={openAnomalyDrawer}
                onClose={() => setOpenAnomalyDrawer(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', md: '50%' },
                        padding: '32px 24px',
                        backgroundColor: theme.palette.background.paper,
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        color: theme.palette.text.primary,
                        backgroundImage: 'none',
                    }
                }}
            >
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Typography variant="h6" style={{ fontWeight: '700', color: theme.palette.text.primary }}>
                        {t('dashboard.drawerTitle')}
                    </Typography>
                    <IconButton onClick={() => setOpenAnomalyDrawer(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider style={{ marginBottom: '24px' }} />
                <Box style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                    {selectedUserId && (
                        <AnomalyReport 
                            userId={selectedUserId} 
                            month={month} 
                            year={year} 
                            employee={users.find(u => u.id === selectedUserId)} 
                            onStatsUpdated={handleLoadStats}
                        />
                    )}
                </Box>
            </Drawer>
        </div>
    );
};

export default DashboardPage;

