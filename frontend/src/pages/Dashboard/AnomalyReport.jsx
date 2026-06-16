import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AnomalyReport = ({ userId, month, year }) => {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAnomalies();
    }, [userId, month, year]);

    const fetchAnomalies = async () => {
        setLoading(true);
        try {
            const response = await api.get('/stats/anomalies', {
                params: {
                    userId: userId,
                    month: month,
                    year: year,
                },
            });

            setAnomalies(response.data.data || []);
        } catch (err) {
            console.error('Error fetching anomalies:', err);
        }
        setLoading(false);
    };

    const getAnomalyBadge = (type) => {
        const typeMap = {
            retard: { label: 'Late', color: '#FF9500' },
            absence: { label: 'Absent', color: '#F44336' },
            sortie_anticipee: { label: 'Early Exit', color: '#FBC02D' },
            insuffisance: { label: 'Insufficient Hours', color: '#9C27B0' },
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

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
    };

    const titleStyle = {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1a2340',
        marginBottom: '20px',
        margin: 0,
    };

    const noAnomaliesStyle = {
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center',
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

    if (loading) {
        return (
            <div style={cardStyle}>
                <h3 style={titleStyle}>Anomaly Report</h3>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <h3 style={titleStyle}>Anomaly Report</h3>

            {anomalies.length === 0 ? (
                <div style={noAnomaliesStyle}>✓ No anomalies detected</div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {anomalies.map((anomaly, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>{anomaly.date}</td>
                                <td style={tdStyle}>{getAnomalyBadge(anomaly.type)}</td>
                                <td style={tdStyle}>{anomaly.detail}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AnomalyReport;

