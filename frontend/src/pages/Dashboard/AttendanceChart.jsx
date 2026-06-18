import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '@mui/material';

const AttendanceChart = ({ userId, month, year }) => {
    const { t } = useLanguage();
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChartData();
    }, [userId, month, year]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchChartData();
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
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
                [t('dashboard.chartHoursLabel')]: stat.heuresTravaillees,
                [t('dashboard.chartLatesLabel')]: stat.retards,
                [t('dashboard.chartAbsencesLabel')]: stat.absences,
            }));

            setData(chartData);
        } catch (err) {
            console.error('Error fetching chart data:', err);
        }
        setLoading(false);
    };

    const cardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        padding: '24px',
    };

    const titleStyle = {
        fontSize: '16px',
        fontWeight: '700',
        color: theme.palette.text.primary,
        marginBottom: '20px',
        margin: 0,
    };

    const containerStyle = {
        width: '100%',
        height: '300px',
    };

    if (loading) {
        return <div style={{ ...cardStyle, color: theme.palette.text.secondary }}>{t('employees.loading')}</div>;
    }

    const tooltipContentStyle = {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        color: theme.palette.text.primary,
    };

    return (
        <>
            <div style={cardStyle}>
                <h3 style={titleStyle}>{t('dashboard.chartHoursTitle')}</h3>
                <div style={containerStyle}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                            <Tooltip 
                                contentStyle={tooltipContentStyle} 
                                itemStyle={{ color: theme.palette.text.primary }} 
                                labelStyle={{ color: theme.palette.text.primary }}
                            />
                            <Legend />
                            <Bar dataKey={t('dashboard.chartHoursLabel')} fill={theme.palette.primary.main} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={titleStyle}>{t('dashboard.chartLatesTitle')}</h3>
                <div style={containerStyle}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                            <Tooltip 
                                contentStyle={tooltipContentStyle} 
                                itemStyle={{ color: theme.palette.text.primary }} 
                                labelStyle={{ color: theme.palette.text.primary }}
                            />
                            <Legend />
                            <Bar dataKey={t('dashboard.chartLatesLabel')} fill="#FF9500" />
                            <Bar dataKey={t('dashboard.chartAbsencesLabel')} fill="#F44336" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default AttendanceChart;

