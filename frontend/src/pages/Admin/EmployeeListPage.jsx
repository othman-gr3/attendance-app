import React, { useEffect, useState } from 'react';
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
    Close, Email, Badge, Key
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
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Employees</h1>
                <p style={subtitleStyle}>Manage your team members</p>
            </div>

            {success && <div style={messageStyle('success')}>{success}</div>}
            {error && <div style={messageStyle('error')}>{error}</div>}

            <div style={topBarStyle}>
                <div></div>
                <button
                    onClick={() => setOpenModal(true)}
                    style={buttonStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1565C0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1976D2'}
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
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id} style={{ transition: 'background-color 0.2s ease' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F6FA'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={tdStyle}>
                                        <div style={nameCellStyle}>
                                            <div style={avatarStyle}>{getInitials(emp.nom)}</div>
                                            {emp.nom}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{emp.email}</td>
                                    <td style={tdStyle}>
                                        <span style={rolebadgeStyle(emp.role)}>
                                            {emp.role === 'ROLE_ADMIN' ? 'Admin' : 'Employee'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            style={deleteButtonStyle}
                                            title="Delete employee"
                                        >
                                            <Delete style={{ fontSize: '18px' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Employee Modal */}
            {openModal && (
                <div style={modalOverlayStyle} onClick={() => setOpenModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={modalTitleStyle}>Add New Employee</h2>
                            <button
                                onClick={() => setOpenModal(false)}
                                style={closeButtonStyle}
                            >
                                ×
                            </button>
                        </div>

                        {formError && <div style={messageStyle('error')}>{formError}</div>}

                        <form onSubmit={handleAddEmployee}>
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
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleFormChange}
                                        required
                                        style={{ ...inputStyle, paddingRight: '40px' }}
                                        placeholder="Enter password"
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
                                    if (!formLoading) e.target.style.backgroundColor = '#1565C0';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#1976D2';
                                }}
                            >
                                {formLoading ? 'Adding...' : 'Add Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}