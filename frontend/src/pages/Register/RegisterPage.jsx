import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress,
    InputAdornment, IconButton, Divider, MenuItem
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthContext';

const PRIMARY = '#0F2942';

export default function RegisterPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        nom: '', email: '', password: '', role: 'ROLE_EMPLOYE'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate(user.role === 'ROLE_ADMIN' ? '/dashboard' : '/checkin', { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F4F6F8',
            p: 3,
        }}>
            <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 3, p: 1 }}>
                <CardContent sx={{ p: 4 }}>

                    {/* Header */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" color={PRIMARY} gutterBottom>
                            Create an account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Fill in the details below to register
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            FULL NAME
                        </Typography>
                        <TextField
                            fullWidth name="nom"
                            value={form.nom}
                            onChange={handleChange}
                            required size="small"
                            placeholder="Othmane Bennani"
                            sx={{ mt: 0.5, mb: 3 }}
                        />

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            EMAIL ADDRESS
                        </Typography>
                        <TextField
                            fullWidth name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required size="small"
                            placeholder="you@company.com"
                            sx={{ mt: 0.5, mb: 3 }}
                        />

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            PASSWORD
                        </Typography>
                        <TextField
                            fullWidth name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange}
                            required size="small"
                            placeholder="••••••••"
                            sx={{ mt: 0.5, mb: 3 }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end" size="small"
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

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ROLE
                        </Typography>
                        <TextField
                            fullWidth select name="role"
                            value={form.role}
                            onChange={handleChange}
                            size="small"
                            sx={{ mt: 0.5, mb: 4 }}
                        >
                            <MenuItem value="ROLE_EMPLOYE">Employee</MenuItem>
                            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                        </TextField>

                        <Button
                            fullWidth type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.5, fontSize: 15,
                                background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
                                },
                            }}
                        >
                            {loading
                                ? <CircularProgress size={22} color="inherit" />
                                : 'Create Account'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: '#2563EB', fontWeight: 600 }}>
                                    Sign in
                                </Link>
                            </Typography>
                        </Box>

                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}