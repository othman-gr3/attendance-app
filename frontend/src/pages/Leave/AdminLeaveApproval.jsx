import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminLeaveApproval = () => {
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

    const fetchData = async () => {
        setLoading(true);
        setError('');
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
            setError('Failed to load leave requests and justifications.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLeave = async (congeId) => {
        setActionInProgress(congeId);
        try {
            await api.put(`/conge/${congeId}`, { statut: 'valide' });
            fetchData();
        } catch (err) {
            setError('Failed to approve leave request');
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
            setError('Failed to reject leave request');
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
            setError('Failed to approve justification');
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
            setError('Failed to reject justification');
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
        boxSizing: 'border-box',
    };

    const headerStyle = {
        marginBottom: '32px',
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
        marginBottom: '32px',
    };

    const statCardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        border: '1px solid #E8EAED',
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
        border: '1px solid #E8EAED',
    };

    const errorStyle = {
        backgroundColor: '#FFEBEE',
        color: '#C62828',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #FFCDD2',
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

    const actionsCellStyle = {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
    };

    const modalContentStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '550px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: 'inherit',
    };

    return (
        <div className="page-container" style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Approvals Management</h1>
                <p style={subtitleStyle}>Manage employee leave requests and AI-flagged absence justifications</p>
            </div>

            {/* Stat Cards based on Active Tab */}
            {activeTab === 'leaves' ? (
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
            ) : (
                <div style={statCardsContainerStyle}>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>Justifications Pending</div>
                        <div style={{ ...statValueStyle, color: '#FF9500' }}>
                            {justifications.length}
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>Source</div>
                        <div style={{ ...statValueStyle, fontSize: '20px', color: '#1976D2', marginTop: 12 }}>
                            AI Bot Reminders 🤖
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={statLabelStyle}>Action Required</div>
                        <div style={{ ...statValueStyle, fontSize: '20px', color: '#2E7D32', marginTop: 12 }}>
                            HR Verification
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid #DDE1E7', marginBottom: '24px', gap: '24px' }}>
                <button
                    onClick={() => setActiveTab('leaves')}
                    style={{
                        padding: '12px 4px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'leaves' ? '3px solid #1976D2' : '3px solid transparent',
                        color: activeTab === 'leaves' ? '#1976D2' : '#7A8A99',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    Leave Requests
                </button>
                <button
                    onClick={() => setActiveTab('justifications')}
                    style={{
                        padding: '12px 4px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'justifications' ? '3px solid #1976D2' : '3px solid transparent',
                        color: activeTab === 'justifications' ? '#1976D2' : '#7A8A99',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    Absence Justifications {justifications.length > 0 && `(${justifications.length})`}
                </button>
            </div>

            <div style={cardStyle}>
                {error && <div style={errorStyle}>{error}</div>}

                {loading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#7A8A99' }}>
                        Loading requests...
                    </div>
                ) : activeTab === 'leaves' ? (
                    // LEAVE REQUESTS TAB
                    leaveRequests.length === 0 ? (
                        <p style={{ color: '#7A8A99', margin: 0, textAlign: 'center' }}>No leave requests</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Employee</th>
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
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '600' }}>
                                                {usersMap[req.userId]?.nom || 'Unknown employee'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#7A8A99' }}>
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
                                                            {actionInProgress === req.id ? 'Processing...' : 'Approve'}
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
                                                            {actionInProgress === req.id ? 'Processing...' : 'Reject'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#7A8A99', fontSize: '12px' }}>No action required</span>
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
                        <p style={{ color: '#7A8A99', margin: 0, textAlign: 'center' }}>No absence justifications pending validation</p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Employee</th>
                                    <th style={thStyle}>Absence Date</th>
                                    <th style={thStyle}>Justification Message</th>
                                    <th style={thStyle}>Attachment</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {justifications.map((justif) => (
                                    <tr key={justif.id}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '600' }}>
                                                {usersMap[justif.userId]?.nom || 'Unknown employee'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#7A8A99' }}>
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
                                                        padding: '4px 10px', background: '#E3F2FD', color: '#1976D2',
                                                        border: '1px solid #BBDEFB', borderRadius: 6, fontSize: 11,
                                                        fontWeight: 700, cursor: 'pointer'
                                                    }}
                                                >
                                                    View Attachment 📎
                                                </button>
                                            ) : (
                                                <span style={{ color: '#B0BEC5', fontSize: 12 }}>None</span>
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
                                                    Approve
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
                                                    Reject
                                                </button>
                                                <button
                                                    style={{
                                                        padding: '6px 12px', background: '#FAFBFC', border: '1px solid #DDE1E7',
                                                        borderRadius: '6px', color: '#555', fontSize: '12px',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}
                                                    onClick={() => setSelectedJustification(justif)}
                                                >
                                                    Details 🔍
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
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2340', margin: 0 }}>
                                Review Absence Justification
                            </h2>
                            <button
                                onClick={() => setSelectedJustification(null)}
                                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: 16, padding: 12, background: '#F8F9FA', borderRadius: 8, border: '1px solid #E8EAED', fontSize: 13 }}>
                            <p style={{ margin: '0 0 4px', color: '#7A8A99' }}>
                                <strong>Employee:</strong> {usersMap[selectedJustification.userId]?.nom || 'Unknown'}
                            </p>
                            <p style={{ margin: '0 0 4px', color: '#7A8A99' }}>
                                <strong>Email:</strong> {usersMap[selectedJustification.userId]?.email || 'Unknown'}
                            </p>
                            <p style={{ margin: 0, color: '#7A8A99' }}>
                                <strong>Absence Date:</strong> {selectedJustification.anomalyDate}
                            </p>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2340', marginBottom: 6 }}>Written Explanation:</label>
                            <div style={{ padding: 12, background: '#FAFBFC', border: '1px solid #DDE1E7', borderRadius: 8, fontSize: 13, color: '#0D1B2A', lineHeight: 1.6 }}>
                                {selectedJustification.responseMessage}
                            </div>
                        </div>

                        {selectedJustification.responseAttachment && (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2340', marginBottom: 6 }}>Attached Medical Certificate:</label>
                                {selectedJustification.responseAttachmentType?.startsWith('image/') ? (
                                    <div style={{ border: '1px solid #DDE1E7', borderRadius: 8, overflow: 'hidden', textAlign: 'center', background: '#FAFBFC', padding: 8 }}>
                                        <img
                                            src={selectedJustification.responseAttachment}
                                            alt="Medical Certificate"
                                            style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto', borderRadius: 6 }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ padding: 12, background: '#FAFBFC', border: '1px solid #DDE1E7', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: '#1a2340' }}>📎 {selectedJustification.responseAttachmentName || "justification"}</span>
                                        <a
                                            href={selectedJustification.responseAttachment}
                                            download={selectedJustification.responseAttachmentName || "justification"}
                                            style={{
                                                fontSize: 12, fontWeight: 600, color: '#1976D2', textDecoration: 'none',
                                                background: '#E3F2FD', padding: '5px 12px', borderRadius: 4
                                            }}
                                        >
                                            Download
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
                                Approve
                            </button>

                            <button
                                onClick={() => handleRejectJustification(selectedJustification.id)}
                                disabled={actionInProgress === selectedJustification.id}
                                style={{
                                    padding: '10px', background: '#C62828', color: '#fff', border: 'none',
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Reject
                            </button>

                            <button
                                onClick={() => setSelectedJustification(null)}
                                style={{
                                    padding: '10px', background: '#FAFBFC', color: '#555', border: '1px solid #DDE1E7',
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeaveApproval;
