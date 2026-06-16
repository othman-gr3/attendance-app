import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthContext';

const LeaveRequestForm = () => {
    const { user } = useAuth();
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [type, setType] = useState('annuel');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoadingRequests(true);
        try {
            const response = await api.get('/conge/me');
            setRequests(response.data.data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to load your leave requests');
        }
        setLoadingRequests(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!dateDebut || !dateFin) {
            setError('Please fill in all fields');
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
                setMessage('Leave request submitted successfully');
                setDateDebut('');
                setDateFin('');
                setType('annuel');
                fetchMyRequests();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit leave request');
        }
        setLoading(false);
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

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
        color: '#1a2340',
        marginBottom: '8px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #D0D5DD',
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
        backgroundColor: '#1976D2',
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
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
    };

    const errorMessageStyle = {
        ...messageStyle,
        backgroundColor: '#FFEBEE',
        color: '#C62828',
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

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Leave Request</h1>
                <p style={subtitleStyle}>Submit a new leave request</p>
            </div>

            <div style={cardStyle}>
                {message && <div style={successMessageStyle}>{message}</div>}
                {error && <div style={errorMessageStyle}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={formRowStyle}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Start Date</label>
                            <input
                                type="date"
                                value={dateDebut}
                                onChange={(e) => setDateDebut(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>End Date</label>
                            <input
                                type="date"
                                value={dateFin}
                                onChange={(e) => setDateFin(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Leave Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="annuel">Annual Leave</option>
                            <option value="maladie">Sick Leave</option>
                            <option value="exceptionnel">Exceptional Leave</option>
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
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2340', marginBottom: '16px' }}>
                    Your Leave Requests
                </h2>

                <div style={cardStyle}>
                    {loadingRequests ? (
                        <p>Loading...</p>
                    ) : requests.length === 0 ? (
                        <p style={{ color: '#7A8A99' }}>No leave requests yet</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Start Date</th>
                                    <th style={thStyle}>End Date</th>
                                    <th style={thStyle}>Type</th>
                                    <th style={thStyle}>Status</th>
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

