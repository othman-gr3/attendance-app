import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, CircularProgress, Alert,
    Avatar, Tooltip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem,
    InputAdornment
} from '@mui/material';
import {
    Delete, Person, PersonAdd, Visibility, VisibilityOff
} from '@mui/icons-material';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

const PRIMARY = '#0F2942';

const emptyForm = {
    nom: '', email: '', password: '', role: 'ROLE_EMPLOYE'
};

export default function EmployeeListPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data);
        } catch (err) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee?')) return;
        try {
            await api.delete(`/users/${id}`);
            setEmployees(employees.filter(e => e.id !== id));
            setSuccess('Employee deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to delete employee');
        }
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/auth/register', form);
            setSuccess('Employee added successfully');
            setTimeout(() => setSuccess(''), 3000);
            setOpenModal(false);
            setForm(emptyForm);
            fetchEmployees();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to create employee');
        } finally {
            setFormLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, []);

    return (
        <Box sx={{ minHeight: '100vh', background: '#F4F6F8' }}>
            <Navbar />

            <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4
                }}>
                    <Box>
                        <Typography variant="h5" color={PRIMARY} fontWeight={700}>
                            Employee Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            Manage your team members and their roles
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => setOpenModal(true)}
                        sx={{
                            background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
                            },
                            px: 3, py: 1.2
                        }}
                    >
                        Add Employee
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {/* Stats cards */}
                <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                    {[
                        { label: 'Total', value: employees.length, color: PRIMARY },
                        { label: 'Admins', value: employees.filter(e => e.role === 'ROLE_ADMIN').length, color: '#2563EB' },
                        { label: 'Employees', value: employees.filter(e => e.role === 'ROLE_EMPLOYE').length, color: '#1B6B45' },
                    ].map((stat) => (
                        <Card key={stat.label} sx={{
                            flex: 1, p: 3, borderRadius: 3,
                            borderLeft: `4px solid ${stat.color}`
                        }}>
                            <Typography variant="h4" fontWeight={700} color={stat.color}>
                                {stat.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                                {stat.label}
                            </Typography>
                        </Card>
                    ))}
                </Box>

                {/* Table */}
                <Card sx={{ borderRadius: 3 }}>
                    <Box sx={{
                        p: 3, borderBottom: '1px solid #DDE1E7',
                        display: 'flex', alignItems: 'center', gap: 1
                    }}>
                        <Person sx={{ color: PRIMARY }} />
                        <Typography variant="h6" color={PRIMARY}>
                            All Employees
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                            <CircularProgress sx={{ color: PRIMARY }} />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ background: '#F8F9FB' }}>
                                        <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: PRIMARY }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#4A5568' }}>
                                                No employees yet. Click "Add Employee" to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.map((emp) => (
                                            <TableRow key={emp.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{
                                                            bgcolor: emp.role === 'ROLE_ADMIN' ? PRIMARY : '#2563EB',
                                                            width: 36, height: 36,
                                                            fontSize: 14, fontWeight: 700
                                                        }}>
                                                            {emp.nom?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Typography fontWeight={600}>{emp.nom}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: '#4A5568' }}>{emp.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={emp.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
                                                        size="small"
                                                        sx={{
                                                            background: emp.role === 'ROLE_ADMIN' ? PRIMARY : '#E8F0FE',
                                                            color: emp.role === 'ROLE_ADMIN' ? 'white' : '#2563EB',
                                                            fontWeight: 600, fontSize: 12,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary"
                                                                sx={{ fontFamily: 'monospace' }}>
                                                        {emp.id?.slice(-8)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Delete employee">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(emp.id)}
                                                            sx={{
                                                                color: '#9B2335',
                                                                '&:hover': { background: '#FFF0F0' }
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Card>
            </Box>

            {/* Add Employee Modal */}
            <Dialog
                open={openModal}
                onClose={() => { setOpenModal(false); setForm(emptyForm); setFormError(''); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{
                    background: PRIMARY, color: 'white',
                    display: 'flex', alignItems: 'center', gap: 1.5
                }}>
                    <PersonAdd />
                    Add New Employee
                </DialogTitle>

                <Box component="form" onSubmit={handleAddEmployee}>
                    <DialogContent sx={{ pt: 3 }}>
                        {formError && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {formError}
                            </Alert>
                        )}

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            FULL NAME
                        </Typography>
                        <TextField
                            fullWidth name="nom"
                            value={form.nom}
                            onChange={handleFormChange}
                            required size="small"
                            placeholder="Walid Benali"
                            sx={{ mt: 0.5, mb: 3 }}
                        />

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            EMAIL ADDRESS
                        </Typography>
                        <TextField
                            fullWidth name="email"
                            type="email"
                            value={form.email}
                            onChange={handleFormChange}
                            required size="small"
                            placeholder="walid@company.com"
                            sx={{ mt: 0.5, mb: 3 }}
                        />

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            PASSWORD
                        </Typography>
                        <TextField
                            fullWidth name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleFormChange}
                            required size="small"
                            placeholder="••••••••"
                            sx={{ mt: 0.5, mb: 3 }}
                            InputProps={{
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
                            }}
                        />

                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ROLE
                        </Typography>
                        <TextField
                            fullWidth select name="role"
                            value={form.role}
                            onChange={handleFormChange}
                            size="small"
                            sx={{ mt: 0.5 }}
                        >
                            <MenuItem value="ROLE_EMPLOYE">Employee</MenuItem>
                            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                        </TextField>

                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                        <Button
                            onClick={() => { setOpenModal(false); setForm(emptyForm); setFormError(''); }}
                            sx={{ color: '#4A5568', textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={formLoading}
                            sx={{
                                background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
                                },
                                px: 3
                            }}
                        >
                            {formLoading
                                ? <CircularProgress size={20} color="inherit" />
                                : 'Add Employee'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

        </Box>
    );
}