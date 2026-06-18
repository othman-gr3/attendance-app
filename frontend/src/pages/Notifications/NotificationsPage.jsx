import { useState, useEffect } from 'react';
import api from '../../api/axios';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventNoteIcon from '@mui/icons-material/EventNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '@mui/material';

export default function NotificationsPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();

  const STATUS_CONFIG = {
    valide: {
      label: t('notifications.statusApproved'),
      icon: <CheckCircleIcon style={{ fontSize: 18, color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32' }} />,
      bg: theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9',
      border: theme.palette.mode === 'dark' ? '#4ADE8033' : '#A5D6A7',
      color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32',
      badgeBg: theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9',
      badgeColor: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32',
      message: (type) => t('notifications.approvedMsg', { type: getTranslatedTypeLabel(type) }),
    },
    refuse: {
      label: t('notifications.statusRejected'),
      icon: <CancelIcon style={{ fontSize: 18, color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828' }} />,
      bg: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE',
      border: theme.palette.mode === 'dark' ? '#EF444433' : '#FFCDD2',
      color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828',
      badgeBg: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE',
      badgeColor: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828',
      message: (type) => t('notifications.rejectedMsg', { type: getTranslatedTypeLabel(type) }),
    },
    en_attente: {
      label: t('notifications.statusPending'),
      icon: <HourglassEmptyIcon style={{ fontSize: 18, color: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100' }} />,
      bg: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF8E1',
      border: theme.palette.mode === 'dark' ? '#F59E0B33' : '#FFE082',
      color: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100',
      badgeBg: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF8E1',
      badgeColor: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100',
      message: (type) => t('notifications.pendingMsg', { type: getTranslatedTypeLabel(type) }),
    },
  };

  function getTranslatedTypeLabel(type) {
    return {
      annuel: t('notifications.annualLeave'),
      maladie: t('notifications.sickLeave'),
      exceptionnel: t('notifications.specialLeave')
    }[type] || type;
  }

  function formatDateRange(debut, fin) {
    const localeStr = language === 'fr' ? 'fr-FR' : 'en-US';
    const fmt = (d) => new Date(d).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' });
    return debut === fin ? fmt(debut) : `${fmt(debut)} → ${fmt(fin)}`;
  }

  function formatNotificationDate(dateStr) {
    if (!dateStr) return '';
    const localeStr = language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateStr).toLocaleDateString(localeStr, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const [requests, setRequests] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Justification submission states
  const [activeJustifyId, setActiveJustifyId] = useState(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Custom alert toast state
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

  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('hide_rules_justifications') !== 'true';
  });

  const toggleRules = () => {
    setShowRules(prev => {
      const next = !prev;
      localStorage.setItem('hide_rules_justifications', String(!next));
      return next;
    });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const creationDate = new Date(dateStr);
    creationDate.setHours(0, 0, 0, 0);

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 3);
    limitDate.setHours(0, 0, 0, 0);

    return creationDate < limitDate;
  };

  const fetchNotifications = async (silent = false) => {
    if (!silent) {
      setLoading(true); setError('');
    }
    try {
      const [congeRes, reminderRes] = await Promise.all([
        api.get('/conge/me'),
        api.get('/notifications/me')
      ]);
      setRequests(congeRes.data.data || []);
      setReminders(reminderRes.data.data || []);
    } catch (err) {
      if (!silent) {
        setError(t('notifications.errorLoad'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000); // 30 seconds auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setReminders(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('notifications.maxFileSizeError'), "error");
      e.target.value = "";
      return;
    }

    // Validate type (images or PDF)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      showToast(t('notifications.invalidFileTypeError'), "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileInfo({
        name: file.name,
        type: file.type,
        base64: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendJustification = async (id) => {
    setSubmitLoading(true);
    try {
      await api.put(`/notifications/${id}/respond`, {
        responseMessage: responseMsg,
        responseAttachment: fileInfo ? fileInfo.base64 : null,
        responseAttachmentName: fileInfo ? fileInfo.name : null,
        responseAttachmentType: fileInfo ? fileInfo.type : null,
      });
      setActiveJustifyId(null);
      setResponseMsg('');
      setFileInfo(null);
      // Reload notifications to show correct status
      fetchNotifications();
    } catch (err) {
      console.error("Failed to send justification", err);
      showToast(t('notifications.errorSendJustification'), "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const order = { refuse: 0, valide: 1, en_attente: 2 };
    return (order[a.statut] ?? 3) - (order[b.statut] ?? 3);
  });
  const responded = sortedRequests.filter(r => r.statut !== 'en_attente');
  const pending = sortedRequests.filter(r => r.statut === 'en_attente');

  const totalNotificationCount = requests.length + reminders.length;

  return (
    <div className="page-container" style={{
      marginLeft: 240, height: '100vh', overflow: 'hidden',
      backgroundColor: theme.palette.background.default, fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '28px 32px', boxSizing: 'border-box', gap: 14,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, margin: '0 0 4px' }}>{t('notifications.title')}</h1>
          <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>{t('notifications.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={toggleRules}
            style={{
              background: 'none', border: 'none', color: theme.palette.primary.main, cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <InfoIcon style={{ fontSize: '16px' }} /> {showRules ? t('notifications.hideRules') : t('notifications.showRules')}
          </button>
          <button onClick={fetchNotifications} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.palette.primary.main}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.palette.divider}
          >
            <RefreshIcon style={{ fontSize: 16 }} /> {t('notifications.refresh')}
          </button>
        </div>
      </div>

      {/* Stats Chips */}
      {totalNotificationCount > 0 && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { label: t('notifications.allPill'), count: totalNotificationCount, color: '#1976D2', bg: '#E3F2FD' },
            { label: t('notifications.aiPill'), count: reminders.length, color: '#1565C0', bg: '#BBDEFB' },
            { label: t('notifications.approvedPill'), count: requests.filter(r => r.statut === 'valide').length, color: '#2E7D32', bg: '#E8F5E9' },
            { label: t('notifications.pendingPill'), count: requests.filter(r => r.statut === 'en_attente').length, color: '#E65100', bg: '#FFF8E1' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, fontSize: 12, fontWeight: 600, color: theme.palette.text.primary }}>
              {label}
              <span style={{ padding: '1px 7px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: theme.palette.mode === 'dark' ? 'rgba(38,115,221,0.14)' : bg, color: theme.palette.mode === 'dark' ? '#F8FAFC' : color }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rules Banner */}
      {showRules && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF8E1',
          border: '1px solid ' + (theme.palette.mode === 'dark' ? '#5B4F3F' : '#FFE082'),
          color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#B78103',
          fontSize: '12px',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          position: 'relative',
          flexShrink: 0
        }}>
          <button
            onClick={toggleRules}
            style={{
              position: 'absolute', top: '8px', right: '12px', background: 'none', border: 'none',
              fontSize: '16px', fontWeight: '700', color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#B78103', cursor: 'pointer'
            }}
            title="Hide"
          >
            ×
          </button>
          <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WarningIcon style={{ fontSize: '16px' }} /> {t('notifications.rulesTitle')}
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li><strong>{t('notifications.ruleDeadline').split(':')[0]}:</strong>{t('notifications.ruleDeadline').substring(t('notifications.ruleDeadline').indexOf(':') + 1)}</li>
            <li><strong>{t('notifications.ruleSize').split(':')[0]}:</strong>{t('notifications.ruleSize').substring(t('notifications.ruleSize').indexOf(':') + 1)}</li>
            <li><strong>{t('notifications.ruleFormat').split(':')[0]}:</strong>{t('notifications.ruleFormat').substring(t('notifications.ruleFormat').indexOf(':') + 1)}</li>
          </ul>
        </div>
      )}

      {/* Two-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, minHeight: 0 }}>

        {/* Left: notifications list */}
        <div style={{ background: theme.palette.background.paper, border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none', borderRadius: 12, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: theme.palette.text.secondary, fontSize: 14 }}>{t('notifications.loading')}</p>
            </div>
          ) : error ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <p style={{ color: theme.palette.error.main, fontSize: 13 }}>{error}</p>
              <button onClick={fetchNotifications} style={{ padding: '7px 18px', background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('notifications.retry')}</button>
            </div>
          ) : totalNotificationCount === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsIcon style={{ fontSize: 26, color: theme.palette.text.secondary }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>{t('notifications.noNotifications')}</p>
              <p style={{ fontSize: 12, color: theme.palette.text.secondary, margin: 0 }}>{t('notifications.noNotificationsDesc')}</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              
              {/* Category 1: AI Absence Reminders */}
              {reminders.length > 0 && (
                <>
                  <div style={{ padding: '10px 18px 6px', background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('notifications.remindersHeader')}</p>
                  </div>
                  {reminders.map((notif, idx) => (
                    <div key={notif.id || idx} 
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < reminders.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                        transition: 'background 0.15s',
                        cursor: notif.read ? 'default' : 'pointer',
                        background: notif.read ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#F0F4F8')
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = notif.read ? (theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC') : (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.25)' : '#E6ECF5')}
                      onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#F0F4F8')}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#E3F2FD', border: '1.5px solid ' + (theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.3)' : '#90CAF9'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SmartToyIcon style={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>
                          {notif.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: theme.palette.text.secondary }}>
                            {t('notifications.receivedLabel', { date: formatNotificationDate(notif.date) })}
                          </span>
                        </div>

                        {/* Justification Status Display / Form */}
                        {notif.justificationStatus === 'PENDING' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {isExpired(notif.date) ? (
                              <span style={{ fontSize: 11, color: theme.palette.text.secondary, background: theme.palette.mode === 'dark' ? '#1E293B' : '#ECEFF1', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                                {t('notifications.justifyExpired')}
                              </span>
                            ) : activeJustifyId === notif.id ? (
                              <div style={{ marginTop: 10, padding: 12, background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.palette.text.primary }}>{t('notifications.justifyMsgLabel')}</label>
                                <textarea
                                  value={responseMsg}
                                  onChange={(e) => setResponseMsg(e.target.value)}
                                  placeholder={t('notifications.justifyMsgPlaceholder')}
                                  style={{
                                    width: '100%', height: 60, padding: 8, fontSize: 12,
                                    border: `1px solid ${theme.palette.divider}`, borderRadius: 6,
                                    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', marginBottom: 10,
                                    backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#FFFFFF',
                                    color: theme.palette.text.primary,
                                    outline: 'none'
                                  }}
                                />

                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.palette.text.primary }}>{t('notifications.justifyFileLabel')}</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handleFileChange}
                                  style={{ fontSize: 11, marginBottom: 12, display: 'block', color: theme.palette.text.primary }}
                                />

                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    onClick={() => handleSendJustification(notif.id)}
                                    disabled={submitLoading || !responseMsg.trim()}
                                    style={{
                                      padding: '6px 12px', background: '#2E7D32', color: '#fff',
                                      border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {submitLoading ? t('notifications.btnSubmitting') : t('notifications.btnSubmitJustify')}
                                  </button>
                                  <button
                                    onClick={() => setActiveJustifyId(null)}
                                    style={{
                                      padding: '6px 12px', background: theme.palette.mode === 'dark' ? '#111827' : '#FAFBFC', color: theme.palette.text.secondary,
                                      border: `1px solid ${theme.palette.divider}`, borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {t('notifications.btnCancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveJustifyId(notif.id);
                                  setResponseMsg('');
                                  setFileInfo(null);
                                }}
                                style={{
                                  padding: '5px 12px', background: theme.palette.primary.main, color: '#fff',
                                  border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  cursor: 'pointer', marginTop: 4
                                }}
                              >
                                {t('notifications.btnProvideJustify')}
                              </button>
                            )}
                          </div>
                        )}

                        {notif.justificationStatus === 'JUSTIFIED' && (
                          <div style={{ marginTop: 8, padding: 8, background: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF8E1', border: '1px solid ' + (theme.palette.mode === 'dark' ? '#5B4F3F' : '#FFE082'), borderRadius: 6, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100' }}>{t('notifications.justifyStatusPending')}</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: theme.palette.text.secondary }}><strong>{language === 'fr' ? 'Votre message :' : 'Your message:'}</strong> {notif.responseMessage}</p>
                            {notif.responseAttachmentName && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: theme.palette.primary.main }}>📎 {notif.responseAttachmentName}</p>
                            )}
                          </div>
                        )}

                        {notif.justificationStatus === 'APPROVED' && (
                          <div style={{ marginTop: 8, padding: 8, background: theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9', border: '1px solid ' + (theme.palette.mode === 'dark' ? '#4ADE8033' : '#A5D6A7'), borderRadius: 6, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32' }}>{t('notifications.justifyStatusApproved')}</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: theme.palette.text.secondary }}>{t('notifications.justifyStatusApprovedDesc')}</p>
                          </div>
                        )}

                        {notif.justificationStatus === 'REJECTED' && (
                          <div style={{ marginTop: 8, padding: 8, background: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE', border: '1px solid ' + (theme.palette.mode === 'dark' ? '#EF444433' : '#FFCDD2'), borderRadius: 6, fontSize: 12 }} onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828' }}>{t('notifications.justifyStatusRejected')}</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: theme.palette.text.secondary }}>{t('notifications.justifyStatusRejectedDesc')}</p>
                            
                            {/* Allow resubmission if rejected and not expired */}
                            {isExpired(notif.date) ? (
                              <p style={{ margin: '6px 0 0', fontSize: 11, color: theme.palette.text.secondary, fontWeight: 600 }}>{t('notifications.justifyResubmitExpired')}</p>
                            ) : activeJustifyId === notif.id ? (
                              <div style={{ marginTop: 10, padding: 12, background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC', border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.palette.text.primary }}>{language === 'fr' ? 'Votre nouveau message :' : 'Your new message :'}</label>
                                <textarea
                                  value={responseMsg}
                                  onChange={(e) => setResponseMsg(e.target.value)}
                                  placeholder={language === 'fr' ? 'Nouvelle explication...' : 'New explanation...'}
                                  style={{
                                    width: '100%', height: 60, padding: 8, fontSize: 12,
                                    border: `1px solid ${theme.palette.divider}`, borderRadius: 6,
                                    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', marginBottom: 10,
                                    backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#FFFFFF',
                                    color: theme.palette.text.primary,
                                    outline: 'none'
                                  }}
                                />
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.palette.text.primary }}>{language === 'fr' ? 'Nouveau document justificatif :' : 'New justification document :'}</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handleFileChange}
                                  style={{ fontSize: 11, marginBottom: 12, display: 'block', color: theme.palette.text.primary }}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    onClick={() => handleSendJustification(notif.id)}
                                    disabled={submitLoading || !responseMsg.trim()}
                                    style={{
                                      padding: '6px 12px', background: '#2E7D32', color: '#fff',
                                      border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {submitLoading ? t('notifications.btnSubmitting') : t('notifications.btnResubmitJustify')}
                                  </button>
                                  <button
                                    onClick={() => setActiveJustifyId(null)}
                                    style={{
                                      padding: '6px 12px', background: theme.palette.mode === 'dark' ? '#111827' : '#FAFBFC', color: theme.palette.text.secondary,
                                      border: `1px solid ${theme.palette.divider}`, borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {t('notifications.btnCancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveJustifyId(notif.id);
                                  setResponseMsg('');
                                  setFileInfo(null);
                                }}
                                style={{
                                  padding: '4px 10px', background: '#C62828', color: '#fff',
                                  border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  cursor: 'pointer', marginTop: 6
                                }}
                              >
                                {t('notifications.btnResubmit')}
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: notif.read ? (theme.palette.mode === 'dark' ? '#1E293B' : '#ECEFF1') : (theme.palette.mode === 'dark' ? 'rgba(38,115,221,0.14)' : '#E3F2FD'), color: notif.read ? theme.palette.text.secondary : theme.palette.primary.main, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {notif.read ? t('notifications.statusRead') : t('notifications.statusNew')}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Category 2: Pending Leave Requests */}
              {pending.length > 0 && (
                <>
                  <div style={{ padding: '10px 18px 6px', background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC', borderBottom: `1px solid ${theme.palette.divider}`, borderTop: reminders.length > 0 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('notifications.pendingHeader')}</p>
                  </div>
                  {pending.map((req, idx) => {
                    const cfg = STATUS_CONFIG.en_attente;
                    return (
                      <div key={req.id || idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < pending.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>
                            {cfg.message(req.type)}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <EventNoteIcon style={{ fontSize: 12 }} /> {formatDateRange(req.dateDebut, req.dateFin)}
                            </span>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.badgeBg, color: cfg.badgeColor, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Category 3: Responded Leave Requests */}
              {responded.length > 0 && (
                <>
                  <div style={{ padding: '10px 18px 6px', background: theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC', borderBottom: `1px solid ${theme.palette.divider}`, borderTop: (reminders.length > 0 || pending.length > 0) ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('notifications.historyHeader')}</p>
                  </div>
                  {responded.map((req, idx) => {
                    const cfg = STATUS_CONFIG[req.statut] || STATUS_CONFIG.en_attente;
                    return (
                      <div key={req.id || idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < responded.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>
                            {cfg.message(req.type)}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <EventNoteIcon style={{ fontSize: 12 }} /> {formatDateRange(req.dateDebut, req.dateFin)}
                            </span>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.badgeBg, color: cfg.badgeColor, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}

            </div>
          )}
        </div>

        {/* Right: legend + tips */}
        <div style={{ background: theme.palette.background.paper, border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none', borderRadius: 12, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0,0,0,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>{t('notifications.legendTitle')}</p>
            {[
              { color: theme.palette.mode === 'dark' ? '#2673DD' : '#1976D2', bg: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#E3F2FD', border: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.3)' : '#90CAF9', label: t('notifications.legendAiReminder'), desc: t('notifications.legendAiReminderDesc') },
              { color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32', bg: theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9', border: theme.palette.mode === 'dark' ? '#4ADE8033' : '#A5D6A7', label: t('notifications.legendApproved'), desc: t('notifications.legendApprovedDesc') },
              { color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828', bg: theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE', border: theme.palette.mode === 'dark' ? '#EF444433' : '#FFCDD2', label: t('notifications.legendRejected'), desc: t('notifications.legendRejectedDesc') },
              { color: theme.palette.mode === 'dark' ? '#F59E0B' : '#E65100', bg: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF8E1', border: theme.palette.mode === 'dark' ? '#F59E0B33' : '#FFE082', label: t('notifications.legendPending'), desc: t('notifications.legendPendingDesc') },
            ].map(({ color, bg, border, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: bg, border: `1px solid ${border}`, marginBottom: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: theme.palette.text.secondary }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${theme.palette.divider}`, paddingTop: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>{t('notifications.infoTitle')}</p>
            {[
              t('notifications.infoTip1'),
              t('notifications.infoTip2'),
              t('notifications.infoTip3'),
              t('notifications.infoTip4'),
            ].map((tip, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontSize: 12, color: theme.palette.text.secondary, lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#E3F2FD'}` }}>{tip}</p>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${theme.palette.divider}`, paddingTop: 14, marginTop: 'auto' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.palette.text.secondary, lineHeight: 1.7 }}>
              📧 hr@company.com<br />🕐 {t('notifications.footerHours')}
            </p>
          </div>
        </div>
      </div>

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
              <CheckCircleIcon style={{ fontSize: 20 }} />
            ) : (
              <ErrorOutlineIcon style={{ fontSize: 20 }} />
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
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
