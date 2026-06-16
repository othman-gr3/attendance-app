import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminLeaveApproval = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionInProgress, setActionInProgress] = useState(null);

    useEffect(() => {
        fetchAllRequests();
    }, []);

    const fetchAllRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/conge');
            setLeaveRequests(response.data.data || []);
        } catch (err) {
            setError('Failed to load leave requests');
            console.error('Error:', err);
        }
        setLoading(false);
    };

    const handleApprove = async (congeId) => {
        setActionInProgress(congeId);
        try {
            await api.put(`/conge/${congeId}`, { statut: 'valide' });
            fetchAllRequests();
        } catch (err) {
            setError('Failed to approve leave request');
            console.error('Error:', err);
        }
        setActionInProgress(null);
    };

    const handleReject = async (congeId) => {
        setActionInProgress(congeId);
        try {
            await api.put(`/conge/${congeId}`, { statut: 'refuse' });
            fetchAllRequests();
        } catch (err) {
            setError('Failed to reject leave request');
            console.error('Error:', err);
        }
        setActionInProgress(null);
    };

    const getTypeLabel = (typeValue) => {
        const types = {
            annuel: 'Annual Leave',
            maladie: 'Sick Leave',
            exceptionnel: 'Exceptional Leave',
        };
        return types[typeValue] || typeValue;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            en_attente: { label: 'Pending', color: '#FF9500' },
            valide: { label: 'Approved', color: '#4CAF50' },
            refuse: { label: 'Rejected', color: '#F44336' },
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
        backgroundColor: '#F5F6FA',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    };

    const headerStyle = {
        marginBottom: '40px',
    };

    const titleStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a2340',
        margin: '0 0 8px 0',
    };

    const subtitleStyle = {
        fontSize: '14px',
        color: '#7A8A99',
        margin: '0',
    };

    const statCardsContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '40px',
    };

    const statCardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
    };

    const statLabelStyle = {
        fontSize: '13px',
        color: '#7A8A99',
        fontWeight: '500',
        marginBottom: '12px',
    };

    const statValueStyle = {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a2340',
    };

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '32px',
    };

    const errorStyle = {
        backgroundColor: '#FFEBEE',
        color: '#C62828',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
    };

    const thStyle = {
        backgroundColor: '#F5F6FA',
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: '600',
        color: '#1a2340',
        borderBottom: '2px solid #E8EAED',
    };

    const tdStyle = {
        padding: '16px',
        borderBottom: '1px solid #E8EAED',
        fontSize: '13px',
        color: '#1a2340',
    };

    const buttonStyle = (type) => ({
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '8px',
        transition: 'all 0.2s ease',
        backgroundColor: type === 'approve' ? '#4CAF50' : '#F44336',
        color: '#FFFFFF',
    });

    const actionsCellStyle = {
        display: 'flex',
        gap: '8px',
    };

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Leave Approval</h1>
                <p style={subtitleStyle}>Manage employee leave requests</p>
            </div>

            <div style={statCardsContainerStyle}>
                <div style={statCardStyle}>
                    <div style={statLabelStyle}>Total Requests</div>
                    <div style={statValueStyle}>{leaveRequests.length}</div>
                </div>
                <div style={statCardStyle}>
                    <div style={statLabelStyle}>Pending</div>
                    <div style={{ ...statValueStyle, color: '#FF9500' }}>
                        {countStatusByType('en_attente')}
                    </div>
                </div>
                <div style={statCardStyle}>
                    <div style={statLabelStyle}>Approved</div>
                    <div style={{ ...statValueStyle, color: '#4CAF50' }}>
                        {countStatusByType('valide')}
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                {error && <div style={errorStyle}>{error}</div>}

                {loading ? (
                    <p>Loading...</p>
                ) : leaveRequests.length === 0 ? (
                    <p style={{ color: '#7A8A99' }}>No leave requests</p>
                ) : (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Employee ID</th>
                                <th style={thStyle}>Start Date</th>
                                <th style={thStyle}>End Date</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRequests.map((req) => (
                                <tr key={req.id}>
                                    <td style={tdStyle}>{req.userId}</td>
                                    <td style={tdStyle}>{req.dateDebut}</td>
                                    <td style={tdStyle}>{req.dateFin}</td>
                                    <td style={tdStyle}>{getTypeLabel(req.type)}</td>
                                    <td style={tdStyle}>{getStatusBadge(req.statut)}</td>
                                    <td style={tdStyle}>
                                        <div style={actionsCellStyle}>
                                            {req.statut === 'en_attente' ? (
                                                <>
                                                    <button
                                                        style={buttonStyle('approve')}
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionInProgress === req.id}
                                                        onMouseEnter={(e) => {
                                                            if (actionInProgress !== req.id) {
                                                                e.target.style.backgroundColor = '#45a049';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = '#4CAF50';
                                                        }}
                                                    >
                                                        {actionInProgress === req.id ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        style={buttonStyle('reject')}
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={actionInProgress === req.id}
                                                        onMouseEnter={(e) => {
                                                            if (actionInProgress !== req.id) {
                                                                e.target.style.backgroundColor = '#da190b';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = '#F44336';
                                                        }}
                                                    >
                                                        {actionInProgress === req.id ? 'Processing...' : 'Reject'}
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ color: '#7A8A99', fontSize: '12px' }}>No action</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminLeaveApproval;

