import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '@mui/material';

const AdminLeaveApproval = () => {
    const { t } = useLanguage();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' or 'justifications'
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [justifications, setJustifications] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionInProgress, setActionInProgress] = useState(null);
    const [selectedJustification, setSelectedJustification] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setError('');
        }
        try {
            const [leavesRes, justificationsRes, usersRes] = await Promise.all([
                api.get('/conge'),
                api.get('/notifications', { params: { status: 'JUSTIFIED' } }),
                api.get('/users')
            ]);
            setLeaveRequests(leavesRes.data.data || []);
            setJustifications(justificationsRes.data.data || []);

            // Build map of userId -> User object
            const map = {};
            (usersRes.data || []).forEach(u => {
                map[u.id] = u;
            });
            setUsersMap(map);
        } catch (err) {
            if (!silent) {
                setError(t('approvals.errorLoad'));
            }
            console.error('Error fetching data:', err);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleApproveLeave = async (congeId) => {
        setActionInProgress(congeId);
        try {
            await api.put(`/conge/${congeId}`, { statut: 'valide' });
            fetchData();
        } catch (err) {
            setError(t('approvals.errorApproveLeave'));
            console.error('Error:', err);
        }
        setActionInProgress(null);
    };

    const handleRejectLeave = async (congeId) => {
        setActionInProgress(congeId);
        try {
            await api.put(`/conge/${congeId}`, { statut: 'refuse' });
            fetchData();
        } catch (err) {
            setError(t('approvals.errorRejectLeave'));
            console.error('Error:', err);
        }
        setActionInProgress(null);
    };

    const handleApproveJustification = async (notifId) => {
        setActionInProgress(notifId);
        try {
            await api.put(`/notifications/${notifId}/approve`);
            setSelectedJustification(null);
            fetchData();
        } catch (err) {
            setError(t('approvals.errorApproveJustif'));
            console.error('Error:', err);
        }
        setActionInProgress(null);
    };

    const handleRejectJustification = async (notifId) => {
        setActionInProgress(notifId);
        try {
            await api.put(`/notifications/${notifId}/reject`);
            setSelectedJustification(null);
            fetchData();
        } catch (err) {
            setError(t('approvals.errorRejectJustif'));
            console.error('Error:', err);
        }
        setActionInProgress(null);
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

    const countStatusByType = (status) => {
        return leaveRequests.filter((req) => req.statut === status).length;
    };

    const pageStyle = {
        marginLeft: '240px',
        padding: '40px',
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
    };

    const headerStyle = {
        marginBottom: '32px',
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

    const statCardsContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '32px',
    };

    const statCardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        border: `1px solid ${theme.palette.divider}`,
    };

    const statLabelStyle = {
        fontSize: '13px',
        color: theme.palette.text.secondary,
        fontWeight: '500',
        marginBottom: '12px',
    };

    const statValueStyle = {
        fontSize: '32px',
        fontWeight: '700',
        color: theme.palette.text.primary,
    };

    const cardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '32px',
        border: `1px solid ${theme.palette.divider}`,
    };

    const errorStyle = {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEE',
        color: theme.palette.mode === 'dark' ? '#F87171' : '#C62828',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FFCDD2'}`,
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

    const actionsCellStyle = {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
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
        fontFamily: 'inherit',
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
    };

    return (
        <div className="page-container" style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>{t('approvals.title')}</h1>
                <p style={subtitleStyle}>{t('approvals.subtitle')}</p>
            </div>

            {/* Stat Cards based on Active Tab */}
            {activeTab === 'leaves' ? (
                <div style={statCardsContainerStyle}>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statTotalRequests')}</div>
                        <div style={statValueStyle}>{leaveRequests.length}</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statPending')}</div>
                        <div style={{ ...statValueStyle, color: '#FF9500' }}>
                            {countStatusByType('en_attente')}
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statApproved')}</div>
                        <div style={{ ...statValueStyle, color: '#4CAF50' }}>
                            {countStatusByType('valide')}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={statCardsContainerStyle}>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statJustifPending')}</div>
                        <div style={{ ...statValueStyle, color: '#FF9500' }}>
                            {justifications.length}
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statSource')}</div>
                        <div style={{ ...statValueStyle, fontSize: '20px', color: theme.palette.primary.main, marginTop: 12 }}>
                            {t('approvals.statSourceDesc')}
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>{t('approvals.statAction')}</div>
                        <div style={{ ...statValueStyle, fontSize: '20px', color: '#4CAF50', marginTop: 12 }}>
                            {t('approvals.statActionDesc')}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${theme.palette.divider}`, marginBottom: '24px', gap: '24px' }}>
                <button
                    onClick={() => setActiveTab('leaves')}
                    style={{
                        padding: '12px 4px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'leaves' ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                        color: activeTab === 'leaves' ? theme.palette.primary.main : theme.palette.text.secondary,
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {t('approvals.tabLeaves')}
                </button>
                <button
                    onClick={() => setActiveTab('justifications')}
                    style={{
                        padding: '12px 4px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'justifications' ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                        color: activeTab === 'justifications' ? theme.palette.primary.main : theme.palette.text.secondary,
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {t('approvals.tabJustifications')} {justifications.length > 0 && `(${justifications.length})`}
                </button>
            </div>

            <div style={cardStyle}>
                {error && <div style={errorStyle}>{error}</div>}

                {loading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: theme.palette.text.secondary }}>
                        {t('approvals.loading')}
                    </div>
                ) : activeTab === 'leaves' ? (
                    // LEAVE REQUESTS TAB
                    leaveRequests.length === 0 ? (
                        <p style={{ color: theme.palette.text.secondary, margin: 0, textAlign: 'center' }}>{t('approvals.noLeaves')}</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>{t('approvals.colEmployee')}</th>
                                    <th style={thStyle}>{t('approvals.colStartDate')}</th>
                                    <th style={thStyle}>{t('approvals.colEndDate')}</th>
                                    <th style={thStyle}>{t('approvals.colType')}</th>
                                    <th style={thStyle}>{t('approvals.colStatus')}</th>
                                    <th style={thStyle}>{t('approvals.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.map((req) => (
                                    <tr key={req.id} style={{ transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '600' }}>
                                                {usersMap[req.userId]?.nom || 'Unknown employee'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                                                {usersMap[req.userId]?.email || req.userId}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{req.dateDebut}</td>
                                        <td style={tdStyle}>{req.dateFin}</td>
                                        <td style={tdStyle}>{getTypeLabel(req.type)}</td>
                                        <td style={tdStyle}>{getStatusBadge(req.statut)}</td>
                                        <td style={tdStyle}>
                                            <div style={actionsCellStyle}>
                                                {req.statut === 'en_attente' ? (
                                                    <>
                                                        <button
                                                            style={{
                                                                padding: '6px 12px', background: '#2E7D32', color: '#fff',
                                                                border: 'none', borderRadius: '6px', fontSize: '12px',
                                                                fontWeight: '600', cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleApproveLeave(req.id)}
                                                            disabled={actionInProgress === req.id}
                                                        >
                                                            {actionInProgress === req.id ? t('approvals.btnProcessing') : t('approvals.btnApprove')}
                                                        </button>
                                                        <button
                                                            style={{
                                                                padding: '6px 12px', background: '#C62828', color: '#fff',
                                                                border: 'none', borderRadius: '6px', fontSize: '12px',
                                                                fontWeight: '600', cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleRejectLeave(req.id)}
                                                            disabled={actionInProgress === req.id}
                                                        >
                                                            {actionInProgress === req.id ? t('approvals.btnProcessing') : t('approvals.btnReject')}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ color: theme.palette.text.secondary, fontSize: '12px' }}>{t('approvals.noActionRequired')}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    // ABSENCE JUSTIFICATIONS TAB
                    justifications.length === 0 ? (
                        <p style={{ color: theme.palette.text.secondary, margin: 0, textAlign: 'center' }}>{t('approvals.noJustifications')}</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>{t('approvals.colEmployee')}</th>
                                    <th style={thStyle}>{t('approvals.colAbsenceDate')}</th>
                                    <th style={thStyle}>{t('approvals.colJustifMsg')}</th>
                                    <th style={thStyle}>{t('approvals.colAttachment')}</th>
                                    <th style={thStyle}>{t('approvals.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {justifications.map((justif) => (
                                    <tr key={justif.id} style={{ transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '600' }}>
                                                {usersMap[justif.userId]?.nom || 'Unknown employee'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                                                {usersMap[justif.userId]?.email || justif.userId}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{justif.anomalyDate}</td>
                                        <td style={{ ...tdStyle, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {justif.responseMessage}
                                        </td>
                                        <td style={tdStyle}>
                                            {justif.responseAttachment ? (
                                                <button
                                                    onClick={() => setSelectedJustification(justif)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        background: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.2)' : '#E3F2FD',
                                                        color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1976D2',
                                                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.3)' : '#BBDEFB'}`,
                                                        borderRadius: 6, fontSize: 11,
                                                        fontWeight: 700, cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('approvals.btnViewAttachment')}
                                                </button>
                                            ) : (
                                                <span style={{ color: theme.palette.text.secondary, opacity: 0.6, fontSize: 12 }}>{t('approvals.attachmentNone')}</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={actionsCellStyle}>
                                                <button
                                                    style={{
                                                        padding: '6px 12px', background: '#2E7D32', color: '#fff',
                                                        border: 'none', borderRadius: '6px', fontSize: '12px',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleApproveJustification(justif.id)}
                                                    disabled={actionInProgress === justif.id}
                                                >
                                                    {actionInProgress === justif.id ? t('approvals.btnProcessing') : t('approvals.btnApprove')}
                                                </button>
                                                <button
                                                    style={{
                                                        padding: '6px 12px', background: '#C62828', color: '#fff',
                                                        border: 'none', borderRadius: '6px', fontSize: '12px',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleRejectJustification(justif.id)}
                                                    disabled={actionInProgress === justif.id}
                                                >
                                                    {actionInProgress === justif.id ? t('approvals.btnProcessing') : t('approvals.btnReject')}
                                                </button>
                                                <button
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC',
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: '6px', color: theme.palette.text.primary, fontSize: '12px',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}
                                                    onClick={() => setSelectedJustification(justif)}
                                                >
                                                    {t('approvals.btnDetails')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Justification Inspection Modal */}
            {selectedJustification && (
                <div style={modalOverlayStyle} onClick={() => setSelectedJustification(null)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                                {t('approvals.modalTitle')}
                            </h2>
                            <button
                                onClick={() => setSelectedJustification(null)}
                                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.palette.text.secondary }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: 16, padding: 12, background: theme.palette.mode === 'dark' ? '#1E293B' : '#F8F9FA', borderRadius: 8, border: `1px solid ${theme.palette.divider}`, fontSize: 13 }}>
                            <p style={{ margin: '0 0 4px', color: theme.palette.text.secondary }}>
                                <strong>{t('approvals.modalEmployee')}</strong> {usersMap[selectedJustification.userId]?.nom || 'Unknown'}
                            </p>
                            <p style={{ margin: '0 0 4px', color: theme.palette.text.secondary }}>
                                <strong>{t('approvals.modalEmail')}</strong> {usersMap[selectedJustification.userId]?.email || 'Unknown'}
                            </p>
                            <p style={{ margin: 0, color: theme.palette.text.secondary }}>
                                <strong>{t('approvals.modalDate')}</strong> {selectedJustification.anomalyDate}
                            </p>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 6 }}>{t('approvals.modalExplain')}</label>
                            <div style={{ padding: 12, background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 13, color: theme.palette.text.primary, lineHeight: 1.6 }}>
                                {selectedJustification.responseMessage}
                            </div>
                        </div>

                        {selectedJustification.responseAttachment && (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 6 }}>{t('approvals.modalAttached')}</label>
                                {selectedJustification.responseAttachmentType?.startsWith('image/') ? (
                                    <div style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden', textAlign: 'center', background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', padding: 8 }}>
                                        <img
                                            src={selectedJustification.responseAttachment}
                                            alt="Medical Certificate"
                                            style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto', borderRadius: 6 }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ padding: 12, background: theme.palette.mode === 'dark' ? '#0F172A' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: theme.palette.text.primary }}>📎 {selectedJustification.responseAttachmentName || "justification"}</span>
                                        <a
                                            href={selectedJustification.responseAttachment}
                                            download={selectedJustification.responseAttachmentName || "justification"}
                                            style={{
                                                fontSize: 12, fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1976D2', textDecoration: 'none',
                                                background: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.2)' : '#E3F2FD', padding: '5px 12px', borderRadius: 4
                                            }}
                                        >
                                            {t('approvals.btnDownload')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <button
                                onClick={() => handleApproveJustification(selectedJustification.id)}
                                disabled={actionInProgress === selectedJustification.id}
                                style={{
                                    padding: '10px', background: '#2E7D32', color: '#fff', border: 'none',
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {actionInProgress === selectedJustification.id ? t('approvals.btnProcessing') : t('approvals.btnApprove')}
                            </button>

                            <button
                                onClick={() => handleRejectJustification(selectedJustification.id)}
                                disabled={actionInProgress === selectedJustification.id}
                                style={{
                                    padding: '10px', background: '#C62828', color: '#fff', border: 'none',
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {actionInProgress === selectedJustification.id ? t('approvals.btnProcessing') : t('approvals.btnReject')}
                            </button>

                            <button
                                onClick={() => setSelectedJustification(null)}
                                style={{
                                    padding: '10px',
                                    background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC',
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {t('approvals.btnClose')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeaveApproval;
