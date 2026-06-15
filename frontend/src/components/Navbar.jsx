import React from 'react';
import {
    AppBar, Toolbar, Typography, Button,
    Box, Avatar, Chip
} from '@mui/material';
import { LogoutOutlined, BusinessCenter } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PRIMARY = '#0F2942';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static" elevation={0} sx={{
            background: PRIMARY,
            borderBottom: '1px solid #1A4A6B',
        }}>
            <Toolbar sx={{ px: 4 }}>

                {/* Logo */}
                <BusinessCenter sx={{ mr: 1.5, fontSize: 22 }} />
                <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                    Attendance App
                </Typography>

                {/* User info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
                        size="small"
                        sx={{
                            background: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: 11,
                        }}
                    />
                    <Avatar sx={{
                        width: 34, height: 34,
                        bgcolor: '#2563EB',
                        fontSize: 14, fontWeight: 700
                    }}>
                        {user?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Button
                        onClick={handleLogout}
                        startIcon={<LogoutOutlined />}
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': { color: 'white', background: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}