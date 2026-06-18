import React, { useState, useRef, useEffect } from 'react';
import {
    Box, IconButton, Typography, TextField,
    CircularProgress, Avatar, Tooltip, useTheme
} from '@mui/material';
import {
    SmartToy, Close, Send, Person
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import './ChatBot.css';

export default function ChatBot() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!user) return;
        const username = user.email?.split('@')[0] || (language === 'fr' ? 'ici' : 'there');
        const welcomeMsg = t('chatbot.introGreeting', {
            name: username,
            adminText: user.role === 'ROLE_ADMIN' ? t('chatbot.introAdminText') : ''
        });
        setMessages(prev => {
            if (prev.length === 0) {
                return [{ role: 'assistant', content: welcomeMsg }];
            }
            const updated = [...prev];
            updated[0] = { ...updated[0], content: welcomeMsg };
            return updated;
        });
    }, [language, user, t]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildSystemPrompt = () => {
        return `You are an HR assistant for an attendance management app.
The current user email is: ${user?.email}
The current user ID is: ${user?.userId}
The current user role is: ${user?.role}

IMPORTANT RULES:
- You will receive REAL DATA from the database in this conversation
- USE that data to answer questions directly — never say "check the page"
- If data shows the user has 0 absences, say so directly
- If data shows check-in times, tell the user exactly
- Format numbers and dates clearly
- Keep responses short and friendly
- If no data is available for a question, say "No data found for this period"
- ${t('chatbot.systemPromptLangRule')}
- Never make up data`;
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        console.log("Sending with userId:", user?.userId); // ← ADD THIS
        console.log("Full user object:", user); // ← ADD THIS
        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', {
                messages: newMessages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                systemPrompt: buildSystemPrompt(),
                userId: user?.userId,
                role: user?.role
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data.message
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('chatbot.errorMsg')
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Chat Window */}
            {open && (
                <Box sx={{
                    position: 'fixed',
                    bottom: 90,
                    right: 24,
                    width: 370,
                    height: 520,
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'dark' ? '0 20px 60px rgba(0,0,0,0.45)' : '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.paper,
                }}>

                    {/* Header */}
                    <Box sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'})`,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                                width: 36, height: 36,
                                bgcolor: 'rgba(255,255,255,0.2)',
                            }}>
                                <SmartToy sx={{ fontSize: 20, color: 'white' }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="white">
                                    {t('chatbot.title')}
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                    {t('chatbot.subtitle')}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => setOpen(false)}
                            sx={{ color: 'white' }}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        background: theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8F9FB'
                    }}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: 1,
                                    alignItems: 'flex-end'
                                }}
                            >
                                {msg.role === 'assistant' && (
                                    <Avatar sx={{
                                        width: 28, height: 28,
                                        bgcolor: theme.palette.primary.main, mb: 0.5
                                    }}>
                                        <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                                    </Avatar>
                                )}
                                <Box sx={{
                                    maxWidth: '75%',
                                    p: 1.5,
                                    borderRadius: msg.role === 'user'
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                    background: msg.role === 'user'
                                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'})`
                                        : theme.palette.background.paper,
                                    color: msg.role === 'user' ? 'white' : theme.palette.text.primary,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: msg.role === 'assistant' ? `1px solid ${theme.palette.divider}` : 'none',
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.6,
                                            fontSize: 13
                                        }}
                                    >
                                        {msg.content}
                                    </Typography>
                                </Box>
                                {msg.role === 'user' && (
                                    <Avatar sx={{
                                        width: 28, height: 28,
                                        bgcolor: theme.palette.primary.main, mb: 0.5
                                    }}>
                                        <Person sx={{ fontSize: 16, color: 'white' }} />
                                    </Avatar>
                                )}
                            </Box>
                        ))}

                        {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main }}>
                                    <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                                </Avatar>
                                <Box sx={{
                                    p: 1.5, borderRadius: '16px 16px 16px 4px',
                                    background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <Box className="dot-1" />
                                        <Box className="dot-2" />
                                        <Box className="dot-3" />
                                    </Box>
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{
                        p: 1.5,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-end'
                    }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            size="small"
                            placeholder={t('chatbot.placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    fontSize: 13,
                                    backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
                                    color: theme.palette.text.primary,
                                    '& fieldset': {
                                        borderColor: theme.palette.divider,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                }
                            }}
                        />
                        <IconButton
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'})`,
                                color: 'white',
                                width: 38,
                                height: 38,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'}, ${theme.palette.primary.main})`,
                                },
                                '&:disabled': {
                                    background: theme.palette.mode === 'dark' ? '#1E293B' : '#DDE1E7',
                                    color: theme.palette.mode === 'dark' ? '#475569' : '#9CA3AF'
                                }
                            }}
                        >
                            {loading
                                ? <CircularProgress size={16} color="inherit" />
                                : <Send sx={{ fontSize: 16 }} />}
                        </IconButton>
                    </Box>
                </Box>
            )}

            {/* Floating Button */}
            <Tooltip title={t('chatbot.title')} placement="left">
                <IconButton
                    onClick={() => setOpen(!open)}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'})`,
                        color: 'white',
                        zIndex: 1000,
                        boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(38, 115, 221, 0.4)',
                        '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? '#0F172A' : '#1A4A6B'}, ${theme.palette.primary.main})`,
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    {open ? <Close /> : <SmartToy />}
                </IconButton>
            </Tooltip>
        </>
    );
}