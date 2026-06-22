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
    };

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const userId = localStorage.getItem('userId');
            const nom = localStorage.getItem('nom');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                await api.get('/users/me');
                setUser({ token, role, userId, nom });
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        if (data.nom) localStorage.setItem('nom', data.nom);
        setUser({
            token: data.token,
            role: data.role,
            userId: data.userId,
            nom: data.nom,
        });
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