import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, Card, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, CircularProgress, Alert,
    Avatar, Tooltip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem,
    InputAdornment, Drawer, Divider
} from '@mui/material';
import {
    Delete, Person, PersonAdd, Visibility, VisibilityOff,
    Close, Email, Badge, Key, SmartToy, Edit, CameraAlt,
    Warning, CheckCircle, ErrorOutline
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

    // Drawer state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);

    // Edit states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);

    // Drawer edit states
    const fileInputRef = useRef(null);
    const [isDrawerEditMode, setIsDrawerEditMode] = useState(false);
    const [drawerForm, setDrawerForm] = useState({ nom: '', email: '', role: 'ROLE_EMPLOYE', password: '' });
    const [drawerError, setDrawerError] = useState('');
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [avatarHover, setAvatarHover] = useState(false);

    // Custom notifications/dialogs states
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
    const [alertToast, setAlertToast] = useState({ open: false, message: '', type: 'error' });

    const showToast = (message, type = 'error') => {
        setAlertToast({ open: true, message, type });
    };

    useEffect(() => {
        if (alertToast.open) {
            const timer = setTimeout(() => {
                setAlertToast(prev => ({ ...prev, open: false }));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [alertToast.open]);



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

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Employee',
            message: 'Are you sure you want to delete this employee? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    setEmployees(prev => prev.filter(e => e.id !== id));
                    showToast('Employee deleted successfully', 'success');
                } catch {
                    showToast('Failed to delete employee', 'error');
                }
            }
        });
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            if (isEditMode) {
                const payload = { ...form };
                if (!payload.password.trim()) {
                    delete payload.password;
                }
                await api.put(`/users/${editingEmployeeId}`, payload);
                setSuccess('Employee updated successfully');
            } else {
                await api.post('/auth/register', form);
                setSuccess('Employee added successfully');
            }
            setTimeout(() => setSuccess(''), 3000);
            setOpenModal(false);
            setForm(emptyForm);
            setIsEditMode(false);
            setEditingEmployeeId(null);
            fetchEmployees();
        } catch (err) {
            setFormError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} employee`);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditEmployee = (emp) => {
        setIsEditMode(true);
        setEditingEmployeeId(emp.id);
        setForm({
            nom: emp.nom,
            email: emp.email,
            password: '',
            role: emp.role || 'ROLE_EMPLOYE'
        });
        setFormError('');
        setOpenModal(true);
    };

    const handleViewEmployee = (emp) => {
        setSelectedEmployee(emp);
        setDrawerForm({
            nom: emp.nom || '',
            email: emp.email || '',
            role: emp.role || 'ROLE_EMPLOYE',
            password: ''
        });
        setIsDrawerEditMode(false);
        setDrawerError('');
        setOpenDrawer(true);
    };

    const handleEmployeePhotoChange = async (e, empId) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('Maximum file size is 2 MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64Url = ev.target.result;
            try {
                await api.put(`/users/${empId}`, { profilePic: base64Url });
                setSelectedEmployee(prev => prev ? { ...prev, profilePic: base64Url } : null);
                setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, profilePic: base64Url } : emp));
            } catch (err) {
                showToast("Failed to update profile picture", 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleEmployeeRemovePhoto = async (empId) => {
        try {
            await api.put(`/users/${empId}`, { profilePic: "" });
            setSelectedEmployee(prev => prev ? { ...prev, profilePic: null } : null);
            setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, profilePic: null } : emp));
        } catch (err) {
            showToast("Failed to remove profile picture", 'error');
        }
    };

    const handleDrawerFormSubmit = async (e) => {
        e.preventDefault();
        setDrawerError('');
        setDrawerLoading(true);
        try {
            const payload = { ...drawerForm };
            if (!payload.password.trim()) {
                delete payload.password;
            }
            const res = await api.put(`/users/${selectedEmployee.id}`, payload);
            setSuccess('Employee updated successfully');
            setTimeout(() => setSuccess(''), 3000);
            
            const updatedUser = res.data;
            setSelectedEmployee(updatedUser);
            setEmployees(prev => prev.map(emp => emp.id === updatedUser.id ? updatedUser : emp));
            setIsDrawerEditMode(false);
        } catch (err) {
            setDrawerError(err.response?.data?.error || 'Failed to update employee');
        } finally {
            setDrawerLoading(false);
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setForm(emptyForm);
        setIsEditMode(false);
        setEditingEmployeeId(null);
        setFormError('');
    };

    useEffect(() => { fetchEmployees(); }, []);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const pageStyle = {
        marginLeft: '240px',
        padding: '40px',
        backgroundColor: '#F5F6FA',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    };

    const headerStyle = {
        marginBottom: '40px',
    };

    const titleStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a2340',
        margin: '0 0 8px 0',
    };

    const subtitleStyle = {
        fontSize: '14px',
        color: '#7A8A99',
        margin: '0',
    };

    const topBarStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        backgroundColor: '#1976D2',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s ease',
    };

    const statCardsStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '40px',
    };

    const statCardStyle = (color) => ({
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '24px',
        borderLeft: `4px solid ${color}`,
    });

    const statLabelStyle = {
        fontSize: '12px',
        color: '#7A8A99',
        fontWeight: '500',
        marginBottom: '12px',
    };

    const statValueStyle = {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a2340',
    };

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '32px',
    };

    const messageStyle = (type) => ({
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: type === 'success' ? '#E8F5E9' : '#FFEBEE',
        color: type === 'success' ? '#2E7D32' : '#C62828',
    });

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

    const avatarStyle = {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        backgroundColor: '#1976D2',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '700',
        marginRight: '12px',
    };

    const nameCellStyle = {
        display: 'flex',
        alignItems: 'center',
    };

    const rolebadgeStyle = (role) => ({
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#FFFFFF',
        backgroundColor: role === 'ROLE_ADMIN' ? '#1a2340' : '#1976D2',
    });

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const modalContentStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
    };

    const modalTitleStyle = {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1a2340',
        margin: '0 0 24px 0',
    };

    const formGroupStyle = {
        marginBottom: '24px',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a2340',
        marginBottom: '8px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    };

    const submitButtonStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#1976D2',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '24px',
    };

    const deleteButtonStyle = {
        background: 'none',
        border: 'none',
        color: '#F44336',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
    };

    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        marginLeft: 'auto',
        color: '#666',
    };

    return (
        <div className="page-container" style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Employees</h1>
                <p style={subtitleStyle}>Manage your team members</p>
            </div>

            {success && <div style={messageStyle('success')}>{success}</div>}
            {error && <div style={messageStyle('error')}>{error}</div>}

            <div style={topBarStyle}>
                <div></div>
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setForm(emptyForm);
                        setFormError('');
                        setOpenModal(true);
                    }}
                    style={buttonStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565C0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                >
                    <PersonAdd style={{ fontSize: '18px' }} />
                    Add Employee
                </button>
            </div>

            {/* Stat Cards */}
            <div style={statCardsStyle}>
                <div style={statCardStyle('#1a2340')}>
                    <div style={statLabelStyle}>Total Employee</div>
                    <div style={statValueStyle}>{employees.length}</div>
                </div>
                <div style={statCardStyle('#1976D2')}>
                    <div style={statLabelStyle}>Admins</div>
                    <div style={statValueStyle}>{employees.filter(e => e.role === 'ROLE_ADMIN').length}</div>
                </div>
                <div style={statCardStyle('#4CAF50')}>
                    <div style={statLabelStyle}>Employees</div>
                    <div style={statValueStyle}>{employees.filter(e => e.role === 'ROLE_EMPLOYE').length}</div>
                </div>
            </div>

            {/* Employee Table */}
            <div style={cardStyle}>
                {loading ? (
                    <p>Loading...</p>
                ) : employees.length === 0 ? (
                    <p style={{ color: '#7A8A99' }}>No employees found</p>
                ) : (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id} style={{ transition: 'background-color 0.2s ease', cursor: 'pointer' }}
                                    onClick={() => handleViewEmployee(emp)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F6FA'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={tdStyle}>
                                        <div style={nameCellStyle}>
                                            <div style={{ ...avatarStyle, overflow: 'hidden' }}>
                                                {emp.profilePic || localStorage.getItem(`avatar_${emp.id}`) ? (
                                                    <img src={emp.profilePic || localStorage.getItem(`avatar_${emp.id}`)} alt={emp.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    getInitials(emp.nom)
                                                )}
                                            </div>
                                            {emp.nom}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{emp.email}</td>
                                    <td style={tdStyle}>
                                        <span style={rolebadgeStyle(emp.role)}>
                                            {emp.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Employee Modal */}
            {openModal && (
                <div style={modalOverlayStyle} onClick={handleCloseModal}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={modalTitleStyle}>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button
                                onClick={handleCloseModal}
                                style={closeButtonStyle}
                            >
                                ×
                            </button>
                        </div>

                        {formError && <div style={messageStyle('error')}>{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={form.nom}
                                    onChange={handleFormChange}
                                    required
                                    style={inputStyle}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleFormChange}
                                    required
                                    style={inputStyle}
                                    placeholder="Enter email"
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>{isEditMode ? 'Password (Optional)' : 'Password'}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleFormChange}
                                        required={!isEditMode}
                                        style={{ ...inputStyle, paddingRight: '40px' }}
                                        placeholder={isEditMode ? "Leave empty to keep current" : "Enter password"}
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
                                            color: '#666',
                                        }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </button>
                                </div>
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Role</label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                >
                                    <option value="ROLE_EMPLOYE">Employee</option>
                                    <option value="ROLE_ADMIN">Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                style={{
                                    ...submitButtonStyle,
                                    opacity: formLoading ? 0.7 : 1,
                                    cursor: formLoading ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    if (!formLoading) e.currentTarget.style.backgroundColor = '#1565C0';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1976D2';
                                }}
                            >
                                {formLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Employee')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions & Access Drawer */}
            <Drawer
                anchor="right"
                open={openDrawer}
                onClose={() => {
                    setOpenDrawer(false);
                    setIsDrawerEditMode(false);
                }}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        padding: '32px 24px',
                        backgroundColor: '#FFFFFF',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    }
                }}
            >
                {selectedEmployee && (
                    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header */}
                        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <Typography variant="h6" style={{ fontWeight: '700', color: '#1a2340' }}>
                                Employee Details
                            </Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {!isDrawerEditMode && (
                                    <Tooltip title="Edit Info">
                                        <IconButton onClick={() => setIsDrawerEditMode(true)} size="small" style={{ color: '#F57C00' }}>
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <IconButton onClick={() => {
                                    setOpenDrawer(false);
                                    setIsDrawerEditMode(false);
                                }} size="small">
                                    <Close />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Profile Info */}
                        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onMouseEnter={() => setAvatarHover(true)}
                                    onMouseLeave={() => setAvatarHover(false)}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: '3px solid #E3F2FD',
                                        boxShadow: '0 3px 12px rgba(25,118,210,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {selectedEmployee.profilePic ? (
                                        <img src={selectedEmployee.profilePic} alt={selectedEmployee.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '28px',
                                            fontWeight: 700,
                                            color: '#FFFFFF'
                                        }}>
                                            {getInitials(selectedEmployee.nom)}
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.45)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '2px',
                                        opacity: avatarHover ? 1 : 0,
                                        transition: 'opacity 0.2s',
                                        color: '#FFFFFF'
                                    }}>
                                        <CameraAlt style={{ fontSize: 18 }} />
                                        <span style={{ fontSize: '9px', fontWeight: 700 }}>CHANGE</span>
                                    </div>
                                </div>
                                {selectedEmployee.profilePic && (
                                    <button
                                        onClick={() => handleEmployeeRemovePhoto(selectedEmployee.id)}
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#F44336',
                                            color: '#FFFFFF',
                                            border: '2px solid #FFFFFF',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleEmployeePhotoChange(e, selectedEmployee.id)}
                                />
                            </div>

                            {!isDrawerEditMode ? (
                                <>
                                    <Typography style={{ fontSize: '18px', fontWeight: '700', color: '#1a2340', marginBottom: '4px' }}>
                                        {selectedEmployee.nom}
                                    </Typography>
                                    <Typography style={{ fontSize: '14px', color: '#7A8A99', marginBottom: '12px' }}>
                                        {selectedEmployee.email}
                                    </Typography>
                                    <span style={rolebadgeStyle(selectedEmployee.role)}>
                                        {selectedEmployee.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
                                    </span>
                                </>
                            ) : (
                                <form onSubmit={handleDrawerFormSubmit} style={{ width: '100%', textAlign: 'left' }}>
                                    {drawerError && <div style={messageStyle('error')}>{drawerError}</div>}
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Full Name</label>
                                        <input
                                            type="text"
                                            value={drawerForm.nom}
                                            onChange={(e) => setDrawerForm({ ...drawerForm, nom: e.target.value })}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Email Address</label>
                                        <input
                                            type="email"
                                            value={drawerForm.email}
                                            onChange={(e) => setDrawerForm({ ...drawerForm, email: e.target.value })}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Password (Optional)</label>
                                        <input
                                            type="password"
                                            value={drawerForm.password}
                                            onChange={(e) => setDrawerForm({ ...drawerForm, password: e.target.value })}
                                            placeholder="Leave empty to keep current"
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={labelStyle}>Role</label>
                                        <select
                                            value={drawerForm.role}
                                            onChange={(e) => setDrawerForm({ ...drawerForm, role: e.target.value })}
                                            style={inputStyle}
                                        >
                                            <option value="ROLE_EMPLOYE">Employee</option>
                                            <option value="ROLE_ADMIN">Admin</option>
                                        </select>
                                    </div>

                                    <Box style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="submit"
                                            disabled={drawerLoading}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                backgroundColor: '#1976D2',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                cursor: drawerLoading ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {drawerLoading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsDrawerEditMode(false)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                backgroundColor: '#F5F6FA',
                                                color: '#1a2340',
                                                border: '1px solid #D0D5DD',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </Box>
                                </form>
                            )}
                        </Box>

                        <Divider style={{ marginBottom: '24px' }} />

                        {/* Permissions Section */}
                        <Typography style={{ fontSize: '15px', fontWeight: '700', color: '#1a2340', marginBottom: '16px' }}>
                            Permissions & Access
                        </Typography>

                        {/* Read Permissions */}
                        <Box style={{ marginBottom: '24px' }}>
                            <Typography style={{ fontSize: '12px', fontWeight: '600', color: '#7A8A99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                View Access (Read)
                            </Typography>
                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedEmployee.role === 'ROLE_ADMIN' ? (
                                    <>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Team attendance dashboard
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Complete employee directory
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Leave approval requests
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Attendance anomalies & history
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Personal check-in calendar & history
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Leave balance & request history
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Notifications & delay alerts
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Write Permissions */}
                        <Box style={{ marginBottom: '24px' }}>
                            <Typography style={{ fontSize: '12px', fontWeight: '600', color: '#7A8A99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                Submit / Modify Access (Write)
                            </Typography>
                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedEmployee.role === 'ROLE_ADMIN' ? (
                                    <>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Manage leave request approvals
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Approve/reject late justifications
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Generate / display check-in kiosk QR Code
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                            Add, update, or remove employee accounts
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Perform dynamic kiosk check-ins
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Submit new leave requests
                                        </Box>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1976D2' }} />
                                            Upload justifications for anomalies
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Delete Button inside Drawer */}
                        {!isDrawerEditMode && (
                            <Box style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                <button
                                    onClick={() => {
                                        handleDelete(selectedEmployee.id);
                                        setOpenDrawer(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#FFF5F5',
                                        color: '#E53E3E',
                                        border: '1px solid #FED7D7',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#E53E3E';
                                        e.currentTarget.style.color = '#FFFFFF';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#FFF5F5';
                                        e.currentTarget.style.color = '#E53E3E';
                                    }}
                                >
                                    Delete Employee
                                </button>
                            </Box>
                        )}
                    </Box>
                )}
            </Drawer>

            {/* Custom Confirmation Modal (Mini Card) */}
            {confirmDialog.open && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.2s ease-out',
                }}>
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        textAlign: 'center',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#FEE2E2',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Warning style={{ fontSize: 24 }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1a2340' }}>
                            {confirmDialog.title}
                        </h3>
                        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#7A8A99', lineHeight: '1.5' }}>
                            {confirmDialog.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                    setConfirmDialog(prev => ({ ...prev, open: false }));
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    backgroundColor: '#EF4444',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    backgroundColor: '#F3F4F6',
                                    color: '#374151',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Toast (Mini Card) */}
            {alertToast.open && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${alertToast.type === 'success' ? '#10B981' : '#EF4444'}`,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 2500,
                    maxWidth: '350px',
                    animation: 'slideIn 0.3s ease-out',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                }}>
                    <div style={{
                        color: alertToast.type === 'success' ? '#10B981' : '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {alertToast.type === 'success' ? (
                            <CheckCircle style={{ fontSize: 20 }} />
                        ) : (
                            <ErrorOutline style={{ fontSize: 20 }} />
                        )}
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        {alertToast.message}
                    </div>
                    <button
                        onClick={() => setAlertToast(prev => ({ ...prev, open: false }))}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: '600',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

        </div>
    );
}