import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import AttendanceChart from './AttendanceChart';
import AnomalyReport from './AnomalyReport';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { Drawer, Box, IconButton, Typography, Divider } from '@mui/material';

const DashboardPage = () => {
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

    useEffect(() => {
        if (selectedUserId) {
            handleLoadStats();
        }
        // eslint-disable-next-line
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
        backgroundColor: '#F5F6FA',
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
        <div className="page-container" style={pageStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={titleStyle}>Dashboard</h1>
                    <p style={subtitleStyle}>Team attendance overview</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Role Filter Pills */}
                    <div style={{ display: 'flex', border: '1px solid #D0D5DD', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                        {[
                            { value: 'ALL', label: 'All' },
                            { value: 'ROLE_EMPLOYE', label: 'Employees' },
                            { value: 'ROLE_ADMIN', label: 'Admins' }
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
                                        backgroundColor: isActive ? '#1976D2' : 'transparent',
                                        color: isActive ? '#FFFFFF' : '#4A5568',
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
                        <SearchIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A8A99', fontSize: '18px' }} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                fontSize: '13px',
                                border: '1px solid #D0D5DD',
                                borderRadius: '8px',
                                outline: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#1976D2'}
                            onBlur={(e) => e.target.style.borderColor = '#D0D5DD'}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: '#7A8A99', cursor: 'pointer', display: 'flex', alignItems: 'center'
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
                            <ArrowBackIcon style={{ fontSize: '16px' }} /> All employees
                        </button>
                    )}
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '4px' }}>
                {!selectedUserId ? (
                /* Full Page Grid of Big Employee Cards */
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a2340', marginBottom: '24px' }}>
                        Select an employee to display their data
                    </h2>
                    {filteredUsers.length === 0 ? (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E8EAED',
                            color: '#7A8A99',
                            fontSize: '14px',
                            marginBottom: '24px',
                        }}>
                            No employee found for "{searchTerm}"
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
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: '16px',
                                            border: '1px solid #E8EAED',
                                            padding: '32px 24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.borderColor = '#1976D2';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = '#E8EAED';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)';
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            backgroundColor: '#E0E0E0',
                                            color: '#666666',
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
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2340', margin: '0 0 6px 0' }}>
                                            {u.nom}
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#7A8A99', margin: '0 0 16px 0' }}>
                                            {u.email}
                                        </p>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            backgroundColor: u.role === 'ROLE_ADMIN' ? '#FFE2E2' : '#E0F2FE',
                                            color: u.role === 'ROLE_ADMIN' ? '#C62828' : '#0369A1'
                                        }}>
                                            {u.role === 'ROLE_ADMIN' ? 'Administrator' : 'Employee'}
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
                                            backgroundColor: isSelected ? '#E3F2FD' : '#FFFFFF',
                                            borderRadius: '10px',
                                            border: isSelected ? '2px solid #1976D2' : '1px solid #E8EAED',
                                            padding: '10px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            width: '240px',
                                            boxSizing: 'border-box',
                                            boxShadow: isSelected ? '0 4px 10px rgba(25, 118, 210, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = '#1976D2';
                                                e.currentTarget.style.backgroundColor = '#F5F9FC';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = '#E8EAED';
                                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: isSelected ? '#1976D2' : '#E0E0E0',
                                            color: isSelected ? '#FFFFFF' : '#666666',
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
                                                color: '#1a2340',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {u.nom}
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#7A8A99',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {u.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
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
                                if (!loading) e.currentTarget.style.backgroundColor = '#1565C0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#1976D2';
                            }}
                        >
                            {loading ? 'Loading...' : 'Refresh Stats'}
                        </button>

                        <button
                            onClick={() => setOpenAnomalyDrawer(true)}
                            style={{
                                ...buttonStyle,
                                backgroundColor: '#FFF5F5',
                                color: '#E53E3E',
                                border: '1px solid #FED7D7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E53E3E';
                                e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFF5F5';
                                e.currentTarget.style.color = '#E53E3E';
                            }}
                        >
                            Anomaly Board
                        </button>
                    </div>

                    {/* Stats & Charts */}
                    {stats && (
                        <>
                            <div style={statCardsContainerStyle}>
                                <div style={statCardStyle}>
                                    <div style={statLabelStyle}>Hours Worked</div>
                                    <div style={statValueStyle}>{stats.heuresTravaillees.toFixed(1)}h</div>
                                </div>
                                <div 
                                    onClick={() => setOpenAnomalyDrawer(true)}
                                    style={{ 
                                        ...statCardStyle, 
                                        cursor: 'pointer', 
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#FF9500';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <div style={{ ...statLabelStyle, color: '#FF9500' }}>Late Arrivals</div>
                                    <div style={{ ...statValueStyle, color: '#FF9500' }}>{stats.retards}</div>
                                </div>
                                <div 
                                    onClick={() => setOpenAnomalyDrawer(true)}
                                    style={{ 
                                        ...statCardStyle, 
                                        cursor: 'pointer', 
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#F44336';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
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
                        backgroundColor: '#FFFFFF',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    }
                }}
            >
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Typography variant="h6" style={{ fontWeight: '700', color: '#1a2340' }}>
                        Attendance Anomalies
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

