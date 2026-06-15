import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress,
    InputAdornment, IconButton, Divider
} from '@mui/material';
import {
    Visibility, VisibilityOff, BusinessCenter
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

const PRIMARY = '#0F2942';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data);
            if (res.data.role === 'ROLE_ADMIN') {
                navigate('/admin/employees');
            } else {
                navigate('/checkin');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            background: '#F4F6F8',
        }}>
            {/* Left panel */}
            <Box sx={{
                width: { xs: 0, md: '45%' },
                background: `linear-gradient(160deg, ${PRIMARY} 0%, #1A4A6B 100%)`,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 6,
            }}>
                <BusinessCenter sx={{ fontSize: 64, color: '#E8E0D0', mb: 3 }} />
                <Typography variant="h4" fontWeight={700} color="white" textAlign="center">
                    Attendance Management
                </Typography>
                <Typography variant="body1" color="#A0B4C8" textAlign="center" mt={2}>
                    Track presence, manage leave requests and monitor your team in real time.
                </Typography>

                {/* Stats */}
                <Box sx={{ mt: 6, display: 'flex', gap: 4 }}>
                    {[
                        { label: 'Employees', value: '100+' },
                        { label: 'Accuracy', value: '99%' },
                        { label: 'Uptime', value: '24/7' },
                    ].map((stat) => (
                        <Box key={stat.label} sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={700} color="white">
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" color="#A0B4C8">
                                {stat.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Right panel — form */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
            }}>
                <Card sx={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 3,
                    p: 1,
                }}>
                    <CardContent sx={{ p: 4 }}>

                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" color={PRIMARY} gutterBottom>
                                Welcome back
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sign in to access your dashboard
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        {/* Error */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Form */}
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                EMAIL ADDRESS
                            </Typography>
                            <TextField
                                fullWidth
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                size="small"
                                sx={{ mt: 0.5, mb: 3 }}
                                placeholder="you@company.com"
                            />

                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                PASSWORD
                            </Typography>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                size="small"
                                sx={{ mt: 0.5, mb: 4 }}
                                placeholder="••••••••"
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword
                                                        ? <VisibilityOff fontSize="small" />
                                                        : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    fontSize: 15,
                                    background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
                                    },
                                }}
                            >
                                {loading
                                    ? <CircularProgress size={22} color="inherit" />
                                    : 'Sign In'}
                            </Button>
                        </Box>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            textAlign="center"
                            mt={3}
                        >
                            © 2026 Attendance App — All rights reserved
                        </Typography>

                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}