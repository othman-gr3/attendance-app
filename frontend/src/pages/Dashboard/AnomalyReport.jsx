import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import SmartToy from '@mui/icons-material/SmartToy';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '@mui/material';
import { useExport } from '../../hooks/useExport';

const AnomalyReport = ({ userId: propUserId, month: propMonth, year: propYear, employee: propEmployee, onStatsUpdated }) => {
    const { t, language } = useLanguage();
    const { exportToExcel, exportToPDF, exporting } = useExport();
    const theme = useTheme();
    const isStandalone = !propUserId;

    // Filters for standalone mode
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

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

    // Main anomalies state
    const [anomalies, setAnomalies] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('ALL');

    // AI notification & review states
    const [processingIdx, setProcessingIdx] = useState(null);
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [selectedNotifForReview, setSelectedNotifForReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Determine active parameters
    const activeUserId = isStandalone ? selectedUserId : propUserId;
    const activeMonth = isStandalone ? month : propMonth;
    const activeYear = isStandalone ? year : propYear;
    const activeEmployee = isStandalone 
        ? users.find(u => u.id === selectedUserId) 
        : propEmployee;

    useEffect(() => {
        if (isStandalone) {
            fetchUsers();
        }
    }, []);

    useEffect(() => {
        if (activeUserId) {
            fetchAnomalies();
            fetchUserNotifications(activeUserId);
        } else {
            setAnomalies([]);
            setNotifications([]);
        }
    }, [activeUserId, activeMonth, activeYear]);

    useEffect(() => {
        if (!activeUserId) return;
        const interval = setInterval(() => {
            fetchAnomalies();
            fetchUserNotifications(activeUserId);
            if (isStandalone) {
                fetchUsers();
            }
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
    }, [activeUserId, activeMonth, activeYear, isStandalone]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchUserNotifications = async (userId) => {
        try {
            const res = await api.get(`/notifications/by-user/${userId}`);
            setNotifications(res.data.data || []);
        } catch (err) {
            console.error("Failed to load user notifications", err);
        }
    };

    const fetchAnomalies = async () => {
        setLoading(true);
        setAlert({ message: '', type: '' });
        try {
            const response = await api.get('/stats/anomalies', {
                params: {
                    userId: activeUserId,
                    month: activeMonth,
                    year: activeYear,
                },
            });
            setAnomalies(response.data.data || []);
        } catch (err) {
            console.error('Error fetching anomalies:', err);
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        if (activeUserId) {
            fetchAnomalies();
            fetchUserNotifications(activeUserId);
        }
    };

    const handleAutoReminder = async (anomaly, idx) => {
        const emp = activeEmployee;
        if (!emp) {
            setAlert({ message: t('anomalies.errorNoEmp'), type: 'error' });
            return;
        }

        setProcessingIdx(idx);
        setAlert({ message: '', type: '' });

        try {
            // 1. Fetch employee stats for actual absences count
            const statsRes = await api.get('/stats', {
                params: {
                    userId: emp.id,
                    month: activeMonth,
                    year: activeYear
                }
            });
            const absencesCount = statsRes.data?.absences || 1;

            // 2. Call AI reminder draft generation
            const reminderRes = await api.post('/ai/reminder', {
                nom: emp.nom,
                email: emp.email,
                absenceDays: absencesCount
            });
            const generatedMessage = reminderRes.data.message;

            // 3. Post notification to employee (linking anomaly date)
            await api.post('/notifications', {
                userId: emp.id,
                title: t('notifications.legendAiReminder'),
                message: generatedMessage,
                anomalyDate: anomaly.date // LINKING DATE
            });

            setAlert({ 
                message: t('anomalies.successReminder', { name: emp.nom, date: anomaly.date }), 
                type: 'success' 
            });

            // Reload user notifications to update list
            fetchUserNotifications(activeUserId);

            // Auto clear alert
            setTimeout(() => setAlert({ message: '', type: '' }), 4000);

        } catch (err) {
            console.error(err);
            setAlert({ 
                message: err.response?.data?.error || t('anomalies.errorReminder'), 
                type: 'error' 
            });
        } finally {
            setProcessingIdx(null);
        }
    };

    const handleDirectApprove = async (anomaly) => {
        setAlert({ message: '', type: '' });
        try {
            await api.post('/notifications/direct-approve', {
                userId: activeUserId,
                anomalyDate: anomaly.date
            });

            setAlert({ 
                message: t('anomalies.successDirectJustified', { date: anomaly.date }), 
                type: 'success' 
            });

            fetchUserNotifications(activeUserId);
            fetchAnomalies();

            if (typeof onStatsUpdated === 'function') {
                onStatsUpdated();
            }

            setTimeout(() => setAlert({ message: '', type: '' }), 4000);

        } catch (err) {
            console.error(err);
            setAlert({ 
                message: err.response?.data?.error || t('anomalies.errorDirectJustified'), 
                type: 'error' 
            });
        }
    };

    const handleReviewAction = async (action) => {
        if (!selectedNotifForReview) return;
        setReviewLoading(true);
        try {
            setAlert({
                message: t('anomalies.successReview', { action: action === 'approve' ? (language === 'fr' ? 'approuvée' : 'approved') : (language === 'fr' ? 'refusée' : 'rejected') }),
                type: 'success'
            });
            setSelectedNotifForReview(null);
            fetchUserNotifications(activeUserId);
            fetchAnomalies();
            if (typeof onStatsUpdated === 'function') {
                onStatsUpdated();
            }
            setTimeout(() => setAlert({ message: '', type: '' }), 4000);
        } catch (err) {
            console.error("Review action error", err);
            setAlert({
                message: t('anomalies.errorReview'),
                type: 'error'
            });
            setTimeout(() => setAlert({ message: '', type: '' }), 4000);
        } finally {
            setReviewLoading(false);
        }
    };

    const getAnomalyBadge = (type) => {
        const typeMap = {
            retard: { label: t('anomalies.badgeLate'), color: '#FF9500' },
            absence: { label: t('anomalies.badgeAbsent'), color: '#F44336' },
            sortie_anticipee: { label: t('anomalies.badgeEarlyExit'), color: '#FBC02D' },
            insuffisance: { label: t('anomalies.badgeInsufficient'), color: '#9C27B0' },
        };
        const typeInfo = typeMap[type] || { label: type, color: '#757575' };

        return (
            <span style={{
                backgroundColor: typeInfo.color,
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
            }}>
                {typeInfo.label}
            </span>
        );
    };

    const pageStyle = isStandalone ? {
        marginLeft: '240px',
        padding: '32px 40px',
        backgroundColor: theme.palette.background.default,
        height: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    } : {};

    const cardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        border: `1px solid ${theme.palette.divider}`,
    };

    const titleStyle = {
        fontSize: '18px',
        fontWeight: '700',
        color: theme.palette.text.primary,
        marginBottom: '4px',
        margin: 0,
    };

    const filterBarStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '16px',
        alignItems: 'flex-end',
        border: `1px solid ${theme.palette.divider}`,
    };

    const selectStyle = {
        padding: '10px 12px',
        fontSize: '14px',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        fontFamily: 'inherit',
        outline: 'none',
        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
        color: theme.palette.text.primary,
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

    const thStyle = {
        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA',
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: '600',
        color: theme.palette.text.primary,
        borderBottom: `2px solid ${theme.palette.divider}`,
    };

    const tdStyle = {
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '13px',
        color: theme.palette.text.primary,
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
    };

    const modalContentStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '550px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
    };

    const filteredAnomalies = anomalies.filter(a => typeFilter === 'ALL' || a.type === typeFilter);

    const renderReportContent = () => {
        return (
            <>
                {/* Alert Banner */}
                {alert.message && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: alert.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                        color: alert.type === 'success' ? '#2E7D32' : '#C62828',
                        border: alert.type === 'success' ? '1px solid #A5D6A7' : '1px solid #FFCDD2',
                    }}>
                        {alert.message}
                    </div>
                )}

                <div style={cardStyle}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={titleStyle}>{t('anomalies.title')}</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: theme.palette.text.secondary }}>{t('anomalies.subtitle')}</p>
                        </div>
                        {/* Export buttons – shown when there are anomalies */}
                        {anomalies.length > 0 && (() => {
                            const employeeName = activeEmployee?.nom ?? activeUserId;
                            const typeLabels = {
                                retard: 'Late', absence: 'Absence',
                                sortie_anticipee: 'Early Exit', insuffisance: 'Insufficient Hours'
                            };
                            const exportRows = filteredAnomalies.map(a => [
                                a.date, typeLabels[a.type] ?? a.type, a.detail
                            ]);
                            const exportTitle = `Anomalies — ${employeeName} — ${activeMonth}/${activeYear}`;
                            return (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => exportToExcel({
                                            filename: `anomalies_${activeUserId}_${activeYear}_${activeMonth}`,
                                            sheetName: 'Anomalies',
                                            headers: ['Date', 'Type', 'Details'],
                                            rows: exportRows,
                                        })}
                                        disabled={exporting}
                                        title="Export to Excel"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '7px 14px',
                                            backgroundColor: '#217346', color: '#FFFFFF',
                                            border: 'none', borderRadius: '7px',
                                            cursor: exporting ? 'not-allowed' : 'pointer',
                                            fontSize: '12px', fontWeight: '600',
                                        }}
                                        onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = '#185c39'; }}
                                        onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = '#217346'; }}
                                    >
                                        <TableViewIcon style={{ fontSize: '15px' }} /> Excel
                                    </button>
                                    <button
                                        onClick={() => exportToPDF({
                                            filename: `anomalies_${activeUserId}_${activeYear}_${activeMonth}`,
                                            title: exportTitle,
                                            headers: ['Date', 'Type', 'Details'],
                                            rows: exportRows,
                                        })}
                                        disabled={exporting}
                                        title="Export to PDF"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '7px 14px',
                                            backgroundColor: '#C0392B', color: '#FFFFFF',
                                            border: 'none', borderRadius: '7px',
                                            cursor: exporting ? 'not-allowed' : 'pointer',
                                            fontSize: '12px', fontWeight: '600',
                                        }}
                                        onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = '#96281B'; }}
                                        onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = '#C0392B'; }}
                                    >
                                        <PictureAsPdfIcon style={{ fontSize: '15px' }} /> PDF
                                    </button>
                                </div>
                            );
                        })()}
                    </div>

                    {loading ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: theme.palette.text.secondary }}>
                            {t('employees.loading')}
                        </div>
                    ) : anomalies.length === 0 ? (
                        <div style={{
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9',
                            color: theme.palette.mode === 'dark' ? '#81C784' : '#2E7D32',
                            padding: '16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : 'transparent'}`,
                        }}>
                            {t('anomalies.noAnomalies')}
                        </div>
                    ) : (
                        <>
                            {/* Type Filter Pills */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {[
                                    { value: 'ALL', label: t('anomalies.pillAll') },
                                    { value: 'absence', label: t('anomalies.pillAbsences'), color: '#F44336' },
                                    { value: 'retard', label: t('anomalies.pillLates'), color: '#FF9500' },
                                    { value: 'sortie_anticipee', label: t('anomalies.pillEarlyExits'), color: '#FBC02D' },
                                    { value: 'insuffisance', label: t('anomalies.pillInsufficient'), color: '#9C27B0' }
                                ].map(opt => {
                                    const isActive = typeFilter === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTypeFilter(opt.value)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                borderRadius: '16px',
                                                border: isActive ? `1px solid ${opt.color || theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                                                backgroundColor: isActive ? (opt.color || theme.palette.primary.main) : theme.palette.background.paper,
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

                            {filteredAnomalies.length === 0 ? (
                                <div style={{
                                    padding: '32px',
                                    textAlign: 'center',
                                    backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC',
                                    borderRadius: '8px',
                                    color: theme.palette.text.secondary,
                                    fontSize: '13px',
                                    border: `1px dashed ${theme.palette.divider}`,
                                }}>
                                    {t('anomalies.noFilteredAnomalies')}
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>{t('anomalies.colDate')}</th>
                                            <th style={thStyle}>{t('anomalies.colType')}</th>
                                            <th style={thStyle}>{t('anomalies.colDetails')}</th>
                                            <th style={{ ...thStyle, width: '150px', textAlign: 'center' }}>{t('anomalies.colStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAnomalies.map((anomaly, idx) => {
                                            // Find matching notification linked by date
                                            const anomalyNotif = notifications.find(n => n.anomalyDate === anomaly.date);
                                            
                                            return (
                                                <tr key={idx} style={{ transition: 'background-color 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={tdStyle}>{anomaly.date}</td>
                                                    <td style={tdStyle}>{getAnomalyBadge(anomaly.type)}</td>
                                                    <td style={tdStyle}>{anomaly.detail}</td>
                                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            {/* CASE 1: No notification yet */}
                                                            {!anomalyNotif && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleDirectApprove(anomaly)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#2E7D32',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'transform 0.15s',
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                        title={t('anomalies.directApproveTitle')}
                                                                    >
                                                                        <CheckCircle style={{ fontSize: '18px' }} />
                                                                    </button>

                                                                    {anomaly.type === 'absence' && (
                                                                        <button
                                                                            onClick={() => handleAutoReminder(anomaly, idx)}
                                                                            disabled={processingIdx !== null}
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                color: processingIdx === idx ? theme.palette.text.secondary : theme.palette.primary.main,
                                                                                cursor: processingIdx === idx ? 'not-allowed' : 'pointer',
                                                                                padding: '4px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'transform 0.15s',
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                if (processingIdx !== idx) e.currentTarget.style.transform = 'scale(1.2)';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                            }}
                                                                            title={t('anomalies.btnAiReminder')}
                                                                        >
                                                                            {processingIdx === idx ? (
                                                                                <CircularProgress size={16} color="inherit" />
                                                                            ) : (
                                                                                <SmartToy style={{ fontSize: '18px' }} />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* CASE 2: Reminder is PENDING justification */}
                                                            {anomalyNotif && anomalyNotif.justificationStatus === 'PENDING' && (
                                                                <>
                                                                    <span style={{
                                                                        fontSize: 11,
                                                                        color: theme.palette.text.secondary,
                                                                        background: theme.palette.mode === 'dark' ? '#1E293B' : '#ECEFF1',
                                                                        padding: '3px 8px',
                                                                        borderRadius: 4,
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {t('anomalies.statusPending')}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDirectApprove(anomaly)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#2E7D32',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'transform 0.15s',
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                        title={t('anomalies.directApproveTitleAlt')}
                                                                    >
                                                                        <CheckCircle style={{ fontSize: '18px' }} />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* CASE 3: Justification received, awaiting review */}
                                                            {anomalyNotif && anomalyNotif.justificationStatus === 'JUSTIFIED' && (
                                                                     <button
                                                                    onClick={() => setSelectedNotifForReview(anomalyNotif)}
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        background: theme.palette.mode === 'dark' ? 'rgba(255, 149, 0, 0.15)' : '#FFF3E0',
                                                                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 149, 0, 0.3)' : '#FFE082'}`,
                                                                        borderRadius: 4,
                                                                        color: '#FF9500',
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {t('anomalies.btnViewJustif')}
                                                                </button>
                                                            )}

                                                            {/* CASE 4: Justification approved */}
                                                            {anomalyNotif && anomalyNotif.justificationStatus === 'APPROVED' && (
                                                                <span style={{
                                                                    fontSize: 11,
                                                                    color: theme.palette.mode === 'dark' ? '#81C784' : '#2E7D32',
                                                                    background: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9',
                                                                    padding: '3px 8px',
                                                                    borderRadius: 4,
                                                                    fontWeight: 600
                                                                }}>
                                                                    {t('anomalies.statusJustified')}
                                                                </span>
                                                            )}

                                                            {/* CASE 5: Justification rejected */}
                                                            {anomalyNotif && anomalyNotif.justificationStatus === 'REJECTED' && (
                                                                <>
                                                                    <span style={{
                                                                        fontSize: 11,
                                                                        color: theme.palette.mode === 'dark' ? '#F87171' : '#C62828',
                                                                        background: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEE',
                                                                        padding: '3px 8px',
                                                                        borderRadius: 4,
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {t('anomalies.statusRejected')}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDirectApprove(anomaly)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#2E7D32',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'transform 0.15s',
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                        title={t('anomalies.directApproveTitleAlt')}
                                                                    >
                                                                        <CheckCircle style={{ fontSize: '18px' }} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>

                {/* Justification Review Modal */}
                {selectedNotifForReview && (
                    <div style={modalOverlayStyle} onClick={() => setSelectedNotifForReview(null)}>
                        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                                    {t('anomalies.modalTitle')}
                                </h2>
                                <button
                                    onClick={() => setSelectedNotifForReview(null)}
                                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.palette.text.secondary }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ marginBottom: 16, padding: 12, background: theme.palette.mode === 'dark' ? '#1E293B' : '#F8F9FA', borderRadius: 8, border: `1px solid ${theme.palette.divider}`, fontSize: 13 }}>
                                <p style={{ margin: '0 0 4px', color: theme.palette.text.secondary }}><strong>{t('anomalies.modalDate')}</strong> {selectedNotifForReview.anomalyDate}</p>
                                <p style={{ margin: '0 0 4px', color: theme.palette.text.secondary }}><strong>{t('anomalies.modalEmployee')}</strong> {activeEmployee?.nom}</p>
                                <p style={{ margin: 0, color: theme.palette.text.secondary }}><strong>{t('anomalies.modalEmail')}</strong> {activeEmployee?.email}</p>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 6 }}>{t('anomalies.modalExplain')}</label>
                                <div style={{ padding: 12, background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 13, color: theme.palette.text.primary, lineHeight: 1.6 }}>
                                    {selectedNotifForReview.responseMessage}
                                </div>
                            </div>

                            {selectedNotifForReview.responseAttachment && (
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 6 }}>{t('anomalies.modalAttached')}</label>
                                    {selectedNotifForReview.responseAttachmentType?.startsWith('image/') ? (
                                        <div style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden', textAlign: 'center', background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', padding: 8 }}>
                                            <img
                                                src={selectedNotifForReview.responseAttachment}
                                                alt="Medical Certificate"
                                                style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto', borderRadius: 6 }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ padding: 12, background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: theme.palette.text.primary }}>📎 {selectedNotifForReview.responseAttachmentName || "justification"}</span>
                                            <a
                                                href={selectedNotifForReview.responseAttachment}
                                                download={selectedNotifForReview.responseAttachmentName || "justification"}
                                                style={{
                                                    fontSize: 12, fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1976D2', textDecoration: 'none',
                                                    background: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.2)' : '#E3F2FD', padding: '5px 12px', borderRadius: 4
                                                }}
                                            >
                                                {t('anomalies.btnDownload')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                <button
                                    onClick={() => handleReviewAction('approve')}
                                    disabled={reviewLoading}
                                    style={{
                                        padding: '10px', background: '#2E7D32', color: '#fff', border: 'none',
                                        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    {t('anomalies.btnApprove')}
                                </button>

                                <button
                                    onClick={() => handleReviewAction('reject')}
                                    disabled={reviewLoading}
                                    style={{
                                        padding: '10px', background: '#C62828', color: '#fff', border: 'none',
                                        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    {t('anomalies.btnReject')}
                                </button>

                                <button
                                    onClick={() => setSelectedNotifForReview(null)}
                                    style={{
                                        padding: '10px',
                                        background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC',
                                        color: theme.palette.text.secondary,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    {t('anomalies.btnClose')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="page-container" style={pageStyle}>
            {isStandalone ? (
                // Standalone Mode (Full page route "/admin/anomalies")
                <>
                    {/* Header block with Title, Role Pills, Search Bar and Back Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.palette.text.primary, margin: '0 0 8px 0' }}>{t('anomalies.title')}</h1>
                            <p style={{ fontSize: '14px', color: theme.palette.text.secondary, margin: '0' }}>{t('anomalies.subtitle')}</p>
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
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.primary.main,
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        border: `1px solid ${theme.palette.primary.main}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.15)' : '#E3F2FD';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.palette.background.paper;
                                    }}
                                >
                                    <ArrowBackIcon style={{ fontSize: '16px' }} /> {t('anomalies.btnAllEmployees')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '4px' }}>
                        {!selectedUserId ? (
                            <>
                                {/* Full Page Grid of Big Employee Cards */}
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: theme.palette.text.primary, marginBottom: '24px' }}>
                                    {t('anomalies.selectHeader')}
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
                                    {t('anomalies.noEmployees', { searchTerm })}
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
                            </>
                        ) : (
                        /* Selected Mode: compact horizontal cards scrollbar + month/year filter + details */
                        <div>
                            {/* Horizontal scrollbar of user cards */}
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

                            {/* Month / Year Filter bar */}
                            <div style={{
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: '12px',
                                boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                padding: '24px',
                                marginBottom: '24px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1.2fr',
                                gap: '16px',
                                alignItems: 'flex-end',
                                border: `1px solid ${theme.palette.divider}`,
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.palette.text.primary, marginBottom: '8px' }}>{t('anomalies.fieldMonth')}</label>
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
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.palette.text.primary, marginBottom: '8px' }}>{t('anomalies.fieldYear')}</label>
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
                                    onClick={handleRefresh}
                                    style={buttonStyle}
                                    disabled={loading}
                                    onMouseEnter={(e) => {
                                        if (!loading) e.currentTarget.style.backgroundColor = theme.palette.primary.main;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.palette.primary.main;
                                    }}
                                >     >
                                    {loading ? t('dashboard.btnLoading') : t('anomalies.btnRefresh')}
                                </button>
                            </div>

                            {/* Report content */}
                            {renderReportContent()}
                        </div>
                    )}
                    </div>
                </>
            ) : (
                // Non-standalone Mode (Drawer inside Dashboard Page)
                renderReportContent()
            )}
        </div>
    );
};

export default AnomalyReport;
