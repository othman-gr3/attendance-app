import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import AttendanceChart from './AttendanceChart';
import AnomalyReport from './AnomalyReport';

const DashboardPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedUserId(response.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleLoadStats = async () => {
        if (!selectedUserId) {
            setError('Please select an employee');
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
            setError('Failed to load statistics');
            console.error('Error:', err);
        }
        setLoading(false);
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

    const filterBarStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
        fontFamily: 'inherit',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a2340',
        marginBottom: '8px',
    };

    const buttonStyle = {
        backgroundColor: '#1976D2',
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
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
    };

    const statLabelStyle = {
        fontSize: '12px',
        color: '#7A8A99',
        fontWeight: '500',
        marginBottom: '12px',
    };

    const statValueStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a2340',
    };

    const chartContainerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '40px',
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

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Dashboard</h1>
                <p style={subtitleStyle}>Team attendance overview</p>
            </div>

            <div style={filterBarStyle}>
                <div>
                    <label style={labelStyle}>Employee</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        style={{ ...selectStyle, width: '100%' }}
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.nom} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Month</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        style={{ ...selectStyle, width: '100%' }}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Year</label>
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
                        if (!loading) e.target.style.backgroundColor = '#1565C0';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#1976D2';
                    }}
                >
                    {loading ? 'Loading...' : 'Load Stats'}
                </button>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {stats && (
                <>
                    <div style={statCardsContainerStyle}>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Hours Worked</div>
                            <div style={statValueStyle}>{stats.heuresTravaillees.toFixed(1)}h</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={{ ...statLabelStyle, color: '#FF9500' }}>Late Arrivals</div>
                            <div style={{ ...statValueStyle, color: '#FF9500' }}>{stats.retards}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={{ ...statLabelStyle, color: '#F44336' }}>Absences</div>
                            <div style={{ ...statValueStyle, color: '#F44336' }}>{stats.absences}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={{ ...statLabelStyle, color: '#4CAF50' }}>Leave Days Left</div>
                            <div style={{ ...statValueStyle, color: '#4CAF50' }}>{stats.congesRestants}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={{ ...statLabelStyle, color: '#1976D2' }}>Presence Rate</div>
                            <div style={{ ...statValueStyle, color: '#1976D2' }}>{stats.tauxPresence}%</div>
                        </div>
                    </div>

                    <div style={chartContainerStyle}>
                        <AttendanceChart userId={selectedUserId} month={month} year={year} />
                    </div>

                    <AnomalyReport userId={selectedUserId} month={month} year={year} />
                </>
            )}
        </div>
    );
};

export default DashboardPage;

