import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '@mui/material';
import api from '../../api/axios';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login } = useAuth();
    const { t } = useLanguage();
    const theme = useTheme();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate(user.role === 'ROLE_ADMIN' ? '/dashboard' : '/checkin', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data);
            if (res.data.role === 'ROLE_ADMIN') {
                navigate('/dashboard');
            } else {
                navigate('/checkin');
            }
        } catch (err) {
            setError(err.response?.data?.error || t('login.errorInvalid'));
        } finally {
            setLoading(false);
        }
    };

    const pageStyle = {
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    };

    const cardStyle = {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '16px',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        padding: '40px',
        maxWidth: '420px',
        width: '100%',
    };

    const headerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
    };

    const iconStyle = {
        fontSize: '40px',
        color: theme.palette.primary.main,
        marginBottom: '16px',
    };

    const titleStyle = {
        fontSize: '24px',
        fontWeight: '700',
        color: theme.palette.text.primary,
        margin: '0 0 8px 0',
        textAlign: 'center',
    };

    const subtitleStyle = {
        fontSize: '14px',
        color: theme.palette.text.secondary,
        margin: '0',
        textAlign: 'center',
    };

    const dividerStyle = {
        height: '1px',
        backgroundColor: theme.palette.divider,
        margin: '24px 0 24px 0',
    };

    const formStyle = {
        display: 'flex',
        flexDirection: 'column',
    };

    const labelStyle = {
        fontSize: '14px',
        fontWeight: '500',
        color: theme.palette.text.primary,
        marginBottom: '6px',
    };

    const inputWrapperStyle = {
        position: 'relative',
        marginBottom: '20px',
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        fontSize: '15px',
        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
        color: theme.palette.text.primary,
        border: theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #E0E0E0',
        borderRadius: '8px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
    };

    const buttonStyle = {
        width: '100%',
        padding: '14px',
        marginTop: '24px',
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        fontSize: '15px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    };

    const errorStyle = {
        backgroundColor: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE',
        color: theme.palette.mode === 'dark' ? '#EF4444' : '#D32F2F',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '24px',
        textAlign: 'center',
        border: theme.palette.mode === 'dark' ? '1px solid #ef444433' : 'none'
    };

    const footerStyle = {
        fontSize: '12px',
        color: theme.palette.text.secondary,
        textAlign: 'center',
        marginTop: '24px',
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <BusinessCenterIcon style={iconStyle} />
                    <h1 style={titleStyle}>{t('login.title')}</h1>
                    <p style={subtitleStyle}>{t('login.subtitle')}</p>
                </div>

                <div style={dividerStyle}></div>

                {/* Error Message */}
                {error && <div style={errorStyle}>{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>{t('login.emailLabel')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder={t('login.emailPlaceholder')}
                            style={inputStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = theme.palette.primary.main;
                                e.target.style.borderWidth = '2px';
                                e.target.style.padding = '12px 15px';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = theme.palette.mode === 'dark' ? '#334155' : '#E0E0E0';
                                e.target.style.borderWidth = '1px';
                                e.target.style.padding = '12px 16px';
                            }}
                        />
                    </div>

                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>{t('login.passwordLabel')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{ ...inputStyle, paddingRight: '40px' }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = theme.palette.primary.main;
                                    e.target.style.borderWidth = '2px';
                                    e.target.style.padding = '12px 40px 12px 15px';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = theme.palette.mode === 'dark' ? '#334155' : '#E0E0E0';
                                    e.target.style.borderWidth = '1px';
                                    e.target.style.padding = '12px 40px 12px 16px';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#888888',
                                    fontSize: '18px',
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#1565C0';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#1976D2';
                        }}
                    >
                        {loading ? t('login.signing') : t('login.button')}
                    </button>
                </form>

                {/* Footer */}
                <div style={footerStyle}>{t('login.footer')}</div>
            </div>
        </div>
    );
}