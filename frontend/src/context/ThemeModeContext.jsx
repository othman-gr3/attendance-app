import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ThemeModeContext = createContext();

export const ThemeModeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', themeMode);
    }, [themeMode]);

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(() => {
        const isDark = themeMode === 'dark';
        return createTheme({
            palette: {
                mode: themeMode,
                primary: { main: '#2673DD' },
                secondary: { main: '#2563EB' },
                background: {
                    default: isDark ? '#0B0F19' : '#F8FAFC',
                    paper: isDark ? '#111827' : '#FFFFFF',
                },
                text: {
                    primary: isDark ? '#F8FAFC' : '#0F172A',
                    secondary: isDark ? '#94A3B8' : '#64748B',
                },
                success: { main: isDark ? '#10B981' : '#1B6B45' },
                error: { main: isDark ? '#EF4444' : '#9B2335' },
                warning: { main: isDark ? '#F59E0B' : '#92600A' },
                divider: isDark ? '#1E293B' : '#E2E8F0',
            },
            typography: {
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                h5: { fontWeight: 700 },
                h6: { fontWeight: 600 },
                button: { textTransform: 'none', fontWeight: 600 },
            },
            shape: { borderRadius: 8 },
            components: {
                MuiCard: {
                    styleOverrides: {
                        root: {
                            boxShadow: isDark
                                ? '0 4px 20px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)'
                                : '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
                            border: isDark ? '1px solid #1E293B' : '1px solid #DDE1E7',
                            backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        }
                    }
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            padding: '10px 24px',
                        },
                        containedPrimary: {
                            background: isDark
                                ? 'linear-gradient(135deg, #2673DD, #1A4A6B)'
                                : 'linear-gradient(135deg, #2673DD, #1E40AF)',
                            '&:hover': {
                                background: isDark
                                    ? 'linear-gradient(135deg, #1A4A6B, #2673DD)'
                                    : 'linear-gradient(135deg, #1E40AF, #2673DD)',
                            }
                        }
                    }
                },
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': { borderColor: '#2673DD' },
                                '&.Mui-focused fieldset': { borderColor: '#2673DD' },
                            }
                        }
                    }
                }
            }
        });
    }, [themeMode]);

    return (
        <ThemeModeContext.Provider value={{ themeMode, toggleThemeMode, setThemeMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    );
};

export const useThemeMode = () => useContext(ThemeModeContext);
