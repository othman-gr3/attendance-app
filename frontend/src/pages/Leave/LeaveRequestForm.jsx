import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import InfoIcon from '@mui/icons-material/Info';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTheme } from '@mui/material';

const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const LeaveRequestForm = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const theme = useTheme();
    const [dateDebut, setDateDebut] = useState(getTodayDateString());
    const [dateFin, setDateFin] = useState(getTodayDateString());
    const [type, setType] = useState('annuel');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [congesRestants, setCongesRestants] = useState(20);

    const [showRules, setShowRules] = useState(() => {
        return localStorage.getItem('hide_rules_conges') !== 'true';
    });

    const toggleRules = () => {
        setShowRules(prev => {
            const next = !prev;
            localStorage.setItem('hide_rules_conges', String(!next));
            return next;
        });
    };

    useEffect(() => {
        fetchMyRequests();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            fetchMyRequests(true);
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
    }, [user]);

    const fetchMyRequests = async (silent = false) => {
        if (!silent) {
            setLoadingRequests(true);
        }
        try {
            const response = await api.get('/conge/me');
            setRequests(response.data.data || []);

            if (user?.userId) {
                const res = await api.get('/stats', {
                    params: {
                        userId: user.userId,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    }
                });
                if (res.data?.congesRestants !== undefined) {
                    setCongesRestants(res.data.congesRestants);
                }
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
            if (!silent) {
                setError(t('leave.failedLoadRequests'));
            }
        }
        if (!silent) {
            setLoadingRequests(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!dateDebut || !dateFin) {
            setError(t('leave.fillAllFields'));
            return;
        }

        const start = new Date(dateDebut);
        const end = new Date(dateFin);
        if (start > end) {
            setError(t('leave.startBeforeEnd'));
            return;
        }

        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Balance check for annual leaves
        if (type === 'annuel' && duration > congesRestants) {
            setError(t('leave.insufficientBalance', { balance: congesRestants, requested: duration }));
            return;
        }

        // Anticipation check (5 days) for annual / exceptional
        if (type !== 'maladie') {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 5);
            minDate.setHours(0, 0, 0, 0);
            if (start < minDate) {
                setError(t('leave.advanceNotice'));
                return;
            }
        }

        // Sick leave limit check
        if (type === 'maladie' && duration > 2) {
            setError(t('leave.sickLimit'));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/conge', {
                dateDebut,
                dateFin,
                type,
            });

            if (response.status === 201) {
                setMessage(t('leave.submittedSuccess'));
                setDateDebut(getTodayDateString());
                setDateFin(getTodayDateString());
                setType('annuel');
                fetchMyRequests();
            }
        } catch (err) {
            setError(err.response?.data?.error || t('leave.failedSubmitRequest'));
        }
        setLoading(false);
    };

    const getTypeLabel = (typeValue) => {
        const types = {
            annuel: t('leave.annual'),
            maladie: t('leave.sick'),
            exceptionnel: t('leave.exceptional'),
        };
        return types[typeValue] || typeValue;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            en_attente: { label: t('leave.statusPending'), color: '#FF9500' },
            valide: { label: t('leave.statusApproved'), color: '#4CAF50' },
            refuse: { label: t('leave.statusRejected'), color: '#F44336' },
        };
        const statusInfo = statusMap[status] || { label: status, color: '#757575' };

        return (
            <span style={{
                backgroundColor: statusInfo.color,
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
            }}>
                {statusInfo.label}
            </span>
        );
    };

    const pageStyle = {
        marginLeft: '240px',
        padding: '40px',
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
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

    const cardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)'
            : '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        padding: '32px',
        marginBottom: '40px',
    };

    const formGroupStyle = {
        marginBottom: '24px',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: theme.palette.text.primary,
        marginBottom: '8px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    };

    const selectStyle = {
        ...inputStyle,
    };

    const formRowStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
    };

    const buttonStyle = {
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        padding: '12px 32px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    };

    const messageStyle = {
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
    };

    const successMessageStyle = {
        ...messageStyle,
        backgroundColor: theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9',
        color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32',
        border: theme.palette.mode === 'dark' ? '1px solid #4ade8033' : 'none',
    };

    const errorMessageStyle = {
        ...messageStyle,
        backgroundColor: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE',
        color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828',
        border: theme.palette.mode === 'dark' ? '1px solid #ef444433' : 'none',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
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
        padding: '16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '13px',
        color: theme.palette.text.primary,
    };

    return (
        <div className="page-container" style={pageStyle}>
            <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={titleStyle}>{t('leave.title')}</h1>
                    <p style={subtitleStyle}>{t('leave.subtitle')}</p>
                </div>
                <button
                    onClick={toggleRules}
                    style={{
                        background: 'none', border: 'none', color: theme.palette.primary.main, cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                >
                    <InfoIcon style={{ fontSize: '16px' }} /> {showRules ? t('leave.hideRules') : t('leave.showRules')}
                </button>
            </div>

            {/* Leave Balance & Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
            }}>
                {/* Available Balance */}
                <div style={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '12px',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '11px', color: theme.palette.text.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('leave.balanceTitle')}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: theme.palette.primary.main }}>
                            {congesRestants} <span style={{ fontSize: '14px', fontWeight: '600', color: theme.palette.text.secondary }}>{congesRestants > 1 ? t('leave.days') : t('leave.day')}</span>
                        </p>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#EBF3FC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.primary.main,
                        flexShrink: 0,
                    }}>
                        <EventNoteIcon style={{ fontSize: '24px' }} />
                    </div>
                </div>

                {/* Approved Requests */}
                <div style={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '12px',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '11px', color: theme.palette.text.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('leave.approvedCount')}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: '#2E7D32' }}>
                            {requests.filter(r => r.statut === 'valide').length} <span style={{ fontSize: '14px', fontWeight: '600', color: theme.palette.text.secondary }}>{t('leave.requests')}</span>
                        </p>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.14)' : '#E8F5E9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2E7D32',
                        flexShrink: 0,
                    }}>
                        <CheckCircleIcon style={{ fontSize: '24px' }} />
                    </div>
                </div>

                {/* Pending Requests */}
                <div style={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '12px',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '11px', color: theme.palette.text.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('leave.pendingCount')}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: '#E65100' }}>
                            {requests.filter(r => r.statut === 'en_attente').length} <span style={{ fontSize: '14px', fontWeight: '600', color: theme.palette.text.secondary }}>{t('leave.requests')}</span>
                        </p>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(230, 81, 0, 0.14)' : '#FFF8E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#E65100',
                        flexShrink: 0,
                    }}>
                        <HourglassEmptyIcon style={{ fontSize: '24px' }} />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                {message && <div style={successMessageStyle}>{message}</div>}
                {error && <div style={errorMessageStyle}>{error}</div>}

                {/* Guidelines Banner */}
                {showRules && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#E3F2FD',
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(38, 115, 221, 0.3)' : '1px solid #90CAF9',
                        color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0D47A1',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '24px',
                        position: 'relative',
                    }}>
                        <button
                            onClick={toggleRules}
                            style={{
                                position: 'absolute', top: '8px', right: '12px', background: 'none', border: 'none',
                                fontSize: '16px', fontWeight: '700', color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0D47A1', cursor: 'pointer'
                            }}
                            title={t('leave.hideRules')}
                        >
                            ×
                        </button>
                        <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <InfoIcon style={{ fontSize: '16px' }} /> {t('leave.rulesHeader')}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                            <li>{t('leave.ruleBalance', { days: congesRestants })}</li>
                            <li>{t('leave.ruleNotice')}</li>
                            <li>{t('leave.ruleSick')}</li>
                            <li>{t('leave.ruleOverlap')}</li>
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>{t('leave.startDate')}</label>
                            <input
                                type="date"
                                value={dateDebut}
                                onChange={(e) => setDateDebut(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>{t('leave.endDate')}</label>
                            <input
                                type="date"
                                value={dateFin}
                                onChange={(e) => setDateFin(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>{t('leave.type')}</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="annuel">{t('leave.annual')}</option>
                            <option value="maladie">{t('leave.sick')}</option>
                            <option value="exceptionnel">{t('leave.exceptional')}</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        style={buttonStyle}
                        disabled={loading}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#1565C0';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#1976D2';
                        }}
                    >
                        {loading ? t('leave.submitting') : t('leave.submit')}
                    </button>
                </form>
            </div>

            <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.palette.text.primary, marginBottom: '16px' }}>
                    {t('leave.yourRequests')}
                </h2>

                <div style={cardStyle}>
                    {loadingRequests ? (
                        <p>{t('leave.loading')}</p>
                    ) : requests.length === 0 ? (
                        <p style={{ color: '#7A8A99' }}>{t('leave.noRequests')}</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>{t('leave.startDate')}</th>
                                    <th style={thStyle}>{t('leave.endDate')}</th>
                                    <th style={thStyle}>{t('leave.type')}</th>
                                    <th style={thStyle}>{t('leave.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req, idx) => (
                                    <tr key={idx}>
                                        <td style={tdStyle}>{req.dateDebut}</td>
                                        <td style={tdStyle}>{req.dateFin}</td>
                                        <td style={tdStyle}>{getTypeLabel(req.type)}</td>
                                        <td style={tdStyle}>{getStatusBadge(req.statut)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestForm;

