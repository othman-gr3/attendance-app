import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, TextField,
    CircularProgress, Avatar, Tooltip
} from '@mui/material';
import {
    SmartToy, Close, Send, Person, AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import './ChatBot.css';

/* ── Palette ── */
const C = {
    lavender: '#D7A9C4',
    gold:     '#FDDA80',
    cyan:     '#7CEFFB',
    sky:      '#29D2FD',
    navy:     '#1220BF',
    white:    '#FEFEFE',
};

export default function ChatBot() {
    const { user }        = useAuth();
    const { t, language } = useLanguage();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const messagesEndRef          = useRef(null);

    /* Welcome message */
    useEffect(() => {
        if (!user) return;
        const username   = user.email?.split('@')[0] || (language === 'fr' ? 'ici' : 'there');
        const welcomeMsg = t('chatbot.introGreeting', {
            name:      username,
            adminText: user.role === 'ROLE_ADMIN' ? t('chatbot.introAdminText') : ''
        });
        setMessages(prev => {
            if (prev.length === 0) return [{ role: 'assistant', content: welcomeMsg }];
            const u = [...prev];
            u[0] = { ...u[0], content: welcomeMsg };
            return u;
        });
    }, [language, user, t]);

    /* Auto-scroll */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildSystemPrompt = () =>
        `You are an HR assistant for an attendance management app.
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

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        console.log("Sending with userId:", user?.userId);
        console.log("Full user object:", user);
        const userMsg     = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        try {
            const res = await api.post('/ai/chat', {
                messages:     newMessages.map(m => ({ role: m.role, content: m.content })),
                systemPrompt: buildSystemPrompt(),
                userId:       user?.userId,
                role:         user?.role,
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: t('chatbot.errorMsg') }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    if (!user) return null;

    return (
        <>
            {/* ════════ CHAT WINDOW ════════ */}
            {open && (
                <Box
                    className="chatbot-window"
                    sx={{
                        position:      'fixed',
                        bottom:        96,
                        right:         24,
                        width:         380,
                        height:        540,
                        borderRadius:  '24px',
                        overflow:      'hidden',
                        zIndex:        1000,
                        display:       'flex',
                        flexDirection: 'column',
                        boxShadow: `
                            0 24px 64px rgba(215,169,196,0.28),
                            0 8px  24px rgba(253,218,128,0.2),
                            0 2px  8px  rgba(0,0,0,0.08)
                        `,
                        border: `1.5px solid rgba(215,169,196,0.35)`,
                        background: C.white,
                    }}
                >
                    {/* ── Header (CSS animated gradient) ── */}
                    <Box
                        className="chatbot-header"
                        sx={{
                            p:             2,
                            display:       'flex',
                            alignItems:    'center',
                            justifyContent:'space-between',
                            position:      'relative',
                            overflow:      'hidden',
                            minHeight:     70,
                        }}
                    >
                        {/* shimmer sweep */}
                        <Box className="chatbot-header-shimmer" />

                        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, zIndex:1 }}>
                            {/* Bot avatar – gold, bobs */}
                            <Box
                                className="chatbot-bot-avatar"
                                sx={{
                                    width:44, height:44, borderRadius:'50%',
                                    background: `linear-gradient(135deg, ${C.gold} 0%, #FFC84A 100%)`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    boxShadow: `0 4px 14px rgba(253,218,128,0.7)`,
                                    border: `2.5px solid ${C.white}`,
                                }}
                            >
                                <SmartToy sx={{ fontSize:22, color:'#7A4F00' }} />
                            </Box>

                            <Box>
                                <Typography variant="body2" fontWeight={800}
                                    sx={{ color:'#3D1540', letterSpacing:0.3, textShadow:'0 1px 2px rgba(255,255,255,0.5)' }}>
                                    {t('chatbot.title')}
                                </Typography>
                                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.3 }}>
                                    {/* live green dot */}
                                    <Box sx={{
                                        width:7, height:7, borderRadius:'50%',
                                        background:'#22C55E',
                                        boxShadow:'0 0 6px #22C55E',
                                        animation:'liveDot 1.8s ease-in-out infinite',
                                        '@keyframes liveDot':{
                                            '0%,100%':{ opacity:1, transform:'scale(1)' },
                                            '50%':{ opacity:0.5, transform:'scale(0.75)' },
                                        }
                                    }}/>
                                    <Typography variant="caption"
                                        sx={{ fontSize:10, fontWeight:600, color:'#3D1540', opacity:0.75 }}>
                                        {t('chatbot.subtitle')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Close button */}
                        <Box
                            component="button"
                            onClick={() => setOpen(false)}
                            sx={{
                                zIndex:1,
                                background:'rgba(255,255,255,0.55)',
                                backdropFilter:'blur(4px)',
                                border:`1.5px solid rgba(255,255,255,0.7)`,
                                borderRadius:'50%',
                                width:32, height:32,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                cursor:'pointer', color:'#3D1540',
                                transition:'all 0.22s ease',
                                '&:hover':{
                                    background:'rgba(255,255,255,0.85)',
                                    transform:'rotate(90deg) scale(1.1)',
                                }
                            }}
                        >
                            <Close sx={{ fontSize:15 }} />
                        </Box>
                    </Box>

                    {/* ── Messages ── */}
                    <Box
                        className="chatbot-messages"
                        sx={{
                            flex:1, overflowY:'auto', p:2,
                            display:'flex', flexDirection:'column', gap:1.5,
                            background: `linear-gradient(160deg, #FFF9F5 0%, #F4F0FF 50%, #F0FCFF 100%)`,
                        }}
                    >
                        {messages.map((msg, i) => (
                            <Box
                                key={i}
                                className="chatbot-msg"
                                sx={{
                                    display:'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap:0.8,
                                    alignItems:'flex-end',
                                }}
                            >
                                {/* Bot avatar (small) */}
                                {msg.role === 'assistant' && (
                                    <Avatar
                                        className="chatbot-bot-avatar"
                                        sx={{
                                            width:28, height:28, mb:0.5,
                                            background:`linear-gradient(135deg, ${C.gold}, #FFC84A)`,
                                            boxShadow:`0 2px 8px rgba(253,218,128,0.5)`,
                                            border:`1.5px solid ${C.white}`,
                                        }}
                                    >
                                        <SmartToy sx={{ fontSize:15, color:'#7A4F00' }} />
                                    </Avatar>
                                )}

                                {/* Bubble */}
                                <Box sx={{
                                    maxWidth:'74%',
                                    p:'10px 14px',
                                    borderRadius: msg.role === 'user'
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    background: msg.role === 'user'
                                        ? `linear-gradient(135deg, #29D2FD 0%, #1220BF 100%)`
                                        : `rgba(215,169,196,0.18)`,
                                    color: msg.role === 'user' ? C.white : '#3D1540',
                                    border: msg.role === 'assistant'
                                        ? `1px solid rgba(215,169,196,0.35)`
                                        : 'none',
                                    boxShadow: msg.role === 'user'
                                        ? `0 4px 14px rgba(41,210,253,0.35)`
                                        : `0 2px 8px rgba(215,169,196,0.2)`,
                                }}>
                                    <Typography variant="body2" sx={{
                                        whiteSpace:'pre-wrap', lineHeight:1.65, fontSize:13,
                                    }}>
                                        {msg.content}
                                    </Typography>
                                </Box>

                                {/* User avatar */}
                                {msg.role === 'user' && (
                                    <Avatar sx={{
                                        width:28, height:28, mb:0.5,
                                        background:`linear-gradient(135deg, ${C.lavender}, ${C.cyan})`,
                                        boxShadow:`0 2px 8px rgba(215,169,196,0.4)`,
                                        border:`1.5px solid ${C.white}`,
                                    }}>
                                        <Person sx={{ fontSize:15, color:'#3D1540' }} />
                                    </Avatar>
                                )}
                            </Box>
                        ))}

                        {/* Typing */}
                        {loading && (
                            <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }} className="chatbot-msg">
                                <Avatar
                                    className="chatbot-bot-avatar"
                                    sx={{
                                        width:28, height:28,
                                        background:`linear-gradient(135deg, ${C.gold}, #FFC84A)`,
                                        border:`1.5px solid ${C.white}`,
                                    }}
                                >
                                    <SmartToy sx={{ fontSize:15, color:'#7A4F00' }} />
                                </Avatar>
                                <Box sx={{
                                    p:'10px 16px',
                                    borderRadius:'18px 18px 18px 4px',
                                    background:`rgba(215,169,196,0.18)`,
                                    border:`1px solid rgba(215,169,196,0.35)`,
                                    display:'flex', gap:'5px', alignItems:'center',
                                }}>
                                    <Box className="dot-1"/>
                                    <Box className="dot-2"/>
                                    <Box className="dot-3"/>
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* ── Input ── */}
                    <Box sx={{
                        p:'12px 14px',
                        borderTop:`1.5px solid rgba(215,169,196,0.25)`,
                        background:`rgba(255,255,255,0.9)`,
                        backdropFilter:'blur(8px)',
                        display:'flex', gap:1, alignItems:'flex-end',
                    }}>
                        <TextField
                            fullWidth multiline maxRows={3} size="small"
                            placeholder={t('chatbot.placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius:'14px',
                                    fontSize:13,
                                    background:'rgba(215,169,196,0.08)',
                                    color:'#3D1540',
                                    '& fieldset': { borderColor:'rgba(215,169,196,0.4)' },
                                    '&:hover fieldset': { borderColor: C.lavender },
                                    '&.Mui-focused fieldset': { borderColor: C.sky, borderWidth:'2px' },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color:'rgba(61,21,64,0.4)', opacity:1
                                },
                            }}
                        />

                        {/* Send */}
                        <Box
                            component="button"
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            sx={{
                                width:40, height:40, borderRadius:'12px',
                                border:'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                                background: input.trim() && !loading
                                    ? `linear-gradient(135deg, ${C.sky} 0%, ${C.navy} 100%)`
                                    : `rgba(215,169,196,0.2)`,
                                color: input.trim() && !loading ? C.white : 'rgba(61,21,64,0.3)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                flexShrink:0,
                                boxShadow: input.trim() && !loading
                                    ? `0 4px 14px rgba(41,210,253,0.4)` : 'none',
                                transition:'all 0.22s ease',
                                '&:hover:not(:disabled)':{ transform:'scale(1.08)' },
                                '&:active:not(:disabled)':{ transform:'scale(0.93)' },
                            }}
                        >
                            {loading
                                ? <CircularProgress size={15} sx={{ color:'rgba(61,21,64,0.4)' }} />
                                : <Send sx={{ fontSize:16 }} />}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ════════ FLOATING ACTION BUTTON ════════ */}
            <Tooltip title={t('chatbot.title')} placement="left">
                <Box className="chatbot-fab-wrapper">

                    {/* Outer pulse rings (only when closed) */}
                    {!open && (
                        <>
                            <Box className="chatbot-fab-ring1" />
                            <Box className="chatbot-fab-ring2" />
                        </>
                    )}

                    {/* Spinning conic border */}
                    <Box className="chatbot-fab-spin-ring" />

                    {/* Orbiting dots (only when closed) */}
                    {!open && (
                        <>
                            <Box className="chatbot-orb chatbot-orb-1" />
                            <Box className="chatbot-orb chatbot-orb-2" />
                            <Box className="chatbot-orb chatbot-orb-3" />
                        </>
                    )}

                    {/* Main button */}
                    <Box
                        component="button"
                        className="chatbot-fab-btn"
                        onClick={() => setOpen(prev => !prev)}
                    >
                        <Box className={`chatbot-fab-icon${open ? ' is-open' : ''}`}>
                            {open
                                ? <Close   sx={{ fontSize:22, color:'#3D1540' }} />
                                : <AutoAwesome sx={{ fontSize:24, color:'#3D1540' }} />}
                        </Box>
                    </Box>
                </Box>
            </Tooltip>
        </>
    );
}