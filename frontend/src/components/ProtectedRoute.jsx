import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();

    // While validating the token, show a centred spinner instead of a blank page
    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}>
                <CircularProgress />
            </Box>
        );
    }

    // Not authenticated → go to login
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) {
        return <Navigate to={user.role === 'ROLE_ADMIN' ? '/dashboard' : '/checkin'} replace />;
    }

    return children;
};

export default ProtectedRoute;