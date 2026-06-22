import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuthStorage = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('nom');
        localStorage.removeItem('email');
    };

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const userId = localStorage.getItem('userId');
            const nom = localStorage.getItem('nom');
            const email = localStorage.getItem('email');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/users/me');
                setUser({
                    token,
                    role,
                    userId,
                    nom: res.data?.nom || nom,
                    email: res.data?.email || email,
                });
            } catch (err) {
                clearAuthStorage();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = (data) => {
        localStorage.setItem('token',  data.token);
        localStorage.setItem('role',   data.role);
        localStorage.setItem('userId', data.userId);
        if (data.nom)   localStorage.setItem('nom',   data.nom);
        if (data.email) localStorage.setItem('email', data.email);
        setUser(data);
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);