import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const AttendanceChart = ({ userId, month, year }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChartData();
    }, [userId, month, year]);

    const fetchChartData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/stats/all', {
                params: {
                    month: month,
                    year: year,
                },
            });

            const chartData = response.data.data.map((stat) => ({
                name: stat.nom,
                'Hours': stat.heuresTravaillees,
                'Lates': stat.retards,
                'Absences': stat.absences,
            }));

            setData(chartData);
        } catch (err) {
            console.error('Error fetching chart data:', err);
        }
        setLoading(false);
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

    const containerStyle = {
        width: '100%',
        height: '300px',
    };

    if (loading) {
        return <div style={cardStyle}>Loading...</div>;
    }

    return (
        <>
            <div style={cardStyle}>
                <h3 style={titleStyle}>Team Hours Worked</h3>
                <div style={containerStyle}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7A8A99' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#7A8A99' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="Hours" fill="#1976D2" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={titleStyle}>Late Arrivals & Absences</h3>
                <div style={containerStyle}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7A8A99' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#7A8A99' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="Lates" fill="#FF9500" />
                            <Bar dataKey="Absences" fill="#F44336" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default AttendanceChart;

