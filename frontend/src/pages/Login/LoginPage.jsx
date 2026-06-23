import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function LoginPage() {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState('');
    const [loading, setLoading]           = useState(false);
    const { user, login }                 = useAuth();
    const { t }                           = useLanguage();
    const navigate                        = useNavigate();

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
            navigate(res.data.role === 'ROLE_ADMIN' ? '/dashboard' : '/checkin', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || t('login.errorInvalid'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100vw',
            height: '100vh',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .signin-btn-x91:hover {
                    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.45);
                    opacity: 0.93;
                }
                .input-field-x91:focus {
                    outline: none;
                    border-color: #3B82F6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                }
                .forgot-link-x91:hover {
                    color: #1E3A8A;
                    text-decoration: underline;
                }
            `}</style>

            {/* ── Left: hero image ── */}
            <Box sx={{
                width: '50%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#071440',
            }}>
                <Box
                    component="img"
                    src="/loginpage22222.jpeg"
                    alt="IN – your space, your people"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
            </Box>

            {/* ── Right: form panel ── */}
            <Box sx={{
                width: { xs: '100%', md: '50%' },
                height: '100%',
                backgroundColor: '#F8F9FB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '-4px 0 24px rgba(30, 58, 138, 0.07)',
            }}>
                <Box sx={{
                    width: '100%',
                    maxWidth: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                    px: '24px',
                }}>
                    {/* Logo */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: '16px', mb: '16px' }}>
                        <Box
                            component="img"
                            src="/inlogo2.jpeg"
                            alt="Logo"
                            sx={{
                                height: '56px',
                                objectFit: 'contain',
                            }}
                        />
                    </Box>

                    {/* Heading */}
                    <Box sx={{ mb: '28px' }}>
                        <Typography sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 700,
                            fontSize: '28px',
                            color: '#1a2340',
                            lineHeight: 1.2,
                            mb: '8px',
                        }}>
                            {t('login.title') || 'Welcome back'}
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: '15px',
                            color: '#888',
                            lineHeight: 1.5,
                        }}>
                            {t('login.subtitle') || 'Sign in to continue to your space'}
                        </Typography>
                    </Box>

                    {/* Error message */}
                    {error && (
                        <Box sx={{
                            mb: '18px',
                            p: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#FFF0F0',
                            border: '1.5px solid #FECACA',
                            color: '#DC2626',
                            fontSize: '13px',
                            fontFamily: "'Inter', sans-serif",
                        }}>
                            {error}
                        </Box>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        {/* Email */}
                        <Box sx={{ mb: '18px' }}>
                            <Typography
                                component="label"
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    color: '#1a2340',
                                    mb: '7px',
                                    display: 'block',
                                }}
                            >
                                {t('login.emailLabel') || 'Email address'}
                            </Typography>
                            <Box
                                component="input"
                                className="input-field-x91"
                                type="email"
                                placeholder={t('login.emailPlaceholder') || 'you@company.com'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '13px 16px',
                                    fontSize: '14px',
                                    fontFamily: "'Inter', sans-serif",
                                    color: '#1a2340',
                                    backgroundColor: '#fff',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    '&::placeholder': { color: '#B0BAC9' },
                                }}
                            />
                        </Box>

                        {/* Password */}
                        <Box sx={{ mb: '8px' }}>
                            <Typography
                                component="label"
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    color: '#1a2340',
                                    mb: '7px',
                                    display: 'block',
                                }}
                            >
                                {t('login.passwordLabel') || 'Password'}
                            </Typography>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                                <Box
                                    component="input"
                                    className="input-field-x91"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    sx={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '13px 44px 13px 16px',
                                        fontSize: '14px',
                                        fontFamily: "'Inter', sans-serif",
                                        color: '#1a2340',
                                        backgroundColor: '#fff',
                                        border: '1.5px solid #E2E8F0',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                />
                                <Box
                                    onClick={() => setShowPassword(!showPassword)}
                                    sx={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        style={{ width: '20px', height: '20px' }}
                                        alt={showPassword ? 'Hide password' : 'Show password'}
                                        src={
                                            showPassword
                                                ? 'https://api.iconify.design/mdi/eye-off-outline.svg?color=%23B0BAC9'
                                                : 'https://api.iconify.design/mdi/eye-outline.svg?color=%23B0BAC9'
                                        }
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Forgot password */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '24px' }}>
                            <Typography
                                component="a"
                                className="forgot-link-x91"
                                href="#"
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#3B82F6',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s',
                                }}
                            >
                                
                            </Typography>
                        </Box>

                        {/* Sign In button */}
                        <Box
                            component="button"
                            type="submit"
                            className="signin-btn-x91"
                            disabled={loading}
                            sx={{
                                width: '100%',
                                padding: '14px 0',
                                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                                color: '#fff',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 700,
                                fontSize: '15px',
                                letterSpacing: '0.3px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'box-shadow 0.25s, opacity 0.25s',
                                mb: '32px',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? (t('login.signing') || 'Signing in…') : (t('login.button') || 'Sign In')}
                        </Box>
                    </Box>

                    {/* Footer */}
                    <Typography sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px',
                        color: '#C0C8D4',
                        textAlign: 'center',
                        fontWeight: 400,
                        mt: '4px',
                    }}>
                        {t('login.footer') || '© 2026 in — All rights reserved'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}