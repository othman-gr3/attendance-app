import React, { useState, useRef, useEffect } from 'react';
import {
    Box, IconButton, Typography, TextField,
    CircularProgress, Avatar, Tooltip
} from '@mui/material';
import {
    SmartToy, Close, Send, Person
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';
import './ChatBot.css';

const PRIMARY = '#0F2942';
const ACCENT = '#2563EB';

export default function ChatBot() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi ${user?.email?.split('@')[0] || 'there'}! 👋 I'm your HR assistant. I can help you with:
- Check your attendance history
- Submit a leave request
- Check your leave status
- View your stats
${user?.role === 'ROLE_ADMIN' ? '• View absent employees\n• Generate absence reminders\n• View anomaly reports' : ''}

What can I help you with today?`
        }
    ]);
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
- Always respond in English, regardless of the language the user writes in
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
                content: 'Sorry, I encountered an error. Please try again.'
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
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #DDE1E7',
                    background: 'white',
                }}>

                    {/* Header */}
                    <Box sx={{
                        background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
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
                                    HR Assistant
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                    Always here to help
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
                        background: '#F8F9FB'
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
                                        bgcolor: PRIMARY, mb: 0.5
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
                                        ? `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`
                                        : 'white',
                                    color: msg.role === 'user' ? 'white' : '#0D1B2A',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: msg.role === 'assistant' ? '1px solid #DDE1E7' : 'none',
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
                                        bgcolor: ACCENT, mb: 0.5
                                    }}>
                                        <Person sx={{ fontSize: 16, color: 'white' }} />
                                    </Avatar>
                                )}
                            </Box>
                        ))}

                        {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: PRIMARY }}>
                                    <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                                </Avatar>
                                <Box sx={{
                                    p: 1.5, borderRadius: '16px 16px 16px 4px',
                                    background: 'white', border: '1px solid #DDE1E7',
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
                        borderTop: '1px solid #DDE1E7',
                        background: 'white',
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-end'
                    }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            size="small"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    fontSize: 13,
                                }
                            }}
                        />
                        <IconButton
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            sx={{
                                background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                                color: 'white',
                                width: 38,
                                height: 38,
                                '&:hover': {
                                    background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
                                },
                                '&:disabled': {
                                    background: '#DDE1E7',
                                    color: '#9CA3AF'
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
            <Tooltip title="HR Assistant" placement="left">
                <IconButton
                    onClick={() => setOpen(!open)}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        background: `linear-gradient(135deg, ${PRIMARY}, #1A4A6B)`,
                        color: 'white',
                        zIndex: 1000,
                        boxShadow: '0 8px 24px rgba(15,41,66,0.4)',
                        '&:hover': {
                            background: `linear-gradient(135deg, #1A4A6B, ${PRIMARY})`,
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