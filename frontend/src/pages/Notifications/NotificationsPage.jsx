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

const STATUS_CONFIG = {
  valide: {
    label: 'Approved',
    icon: <CheckCircleIcon style={{ fontSize: 18, color: '#2E7D32' }} />,
    bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32',
    badgeBg: '#E8F5E9', badgeColor: '#2E7D32',
    message: (type) => `Your leave request (${getTypeLabel(type)}) has been approved`,
  },
  refuse: {
    label: 'Rejected',
    icon: <CancelIcon style={{ fontSize: 18, color: '#C62828' }} />,
    bg: '#FFEBEE', border: '#FFCDD2', color: '#C62828',
    badgeBg: '#FFEBEE', badgeColor: '#C62828',
    message: (type) => `Your leave request (${getTypeLabel(type)}) has been rejected`,
  },
  en_attente: {
    label: 'Pending',
    icon: <HourglassEmptyIcon style={{ fontSize: 18, color: '#E65100' }} />,
    bg: '#FFF8E1', border: '#FFE082', color: '#E65100',
    badgeBg: '#FFF8E1', badgeColor: '#E65100',
    message: (type) => `Your leave request (${getTypeLabel(type)}) is under review`,
  },
};

function getTypeLabel(type) {
  return { annuel: 'annual leave', maladie: 'sick leave', exceptionnel: 'special leave' }[type] || type;
}

function formatDateRange(debut, fin) {
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return debut === fin ? fmt(debut) : `${fmt(debut)} → ${fmt(fin)}`;
}

function formatNotificationDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NotificationsPage() {
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

  const fetchNotifications = async () => {
    setLoading(true); setError('');
    try {
      const [congeRes, reminderRes] = await Promise.all([
        api.get('/conge/me'),
        api.get('/notifications/me')
      ]);
      setRequests(congeRes.data.data || []);
      setReminders(reminderRes.data.data || []);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
      showToast("File size must not exceed 2 MB.", "error");
      e.target.value = "";
      return;
    }

    // Validate type (images or PDF)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      showToast("Unsupported file format. Only images (JPEG, PNG, WEBP) and PDFs are allowed.", "error");
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
      showToast("Error sending justification.", "error");
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
      backgroundColor: '#F5F6FA', fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '28px 32px', boxSizing: 'border-box', gap: 14,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2340', margin: '0 0 4px' }}>Notifications</h1>
          <p style={{ fontSize: 13, color: '#7A8A99', margin: 0 }}>Status of your leaves and AI attendance alerts</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={toggleRules}
            style={{
              background: 'none', border: 'none', color: '#1976D2', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <InfoIcon style={{ fontSize: '16px' }} /> {showRules ? "Hide rules" : "Show rules"}
          </button>
          <button onClick={fetchNotifications} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#1a2340', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1976D2'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}
          >
            <RefreshIcon style={{ fontSize: 16 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Chips */}
      {totalNotificationCount > 0 && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'All', count: totalNotificationCount, color: '#1976D2', bg: '#E3F2FD' },
            { label: 'AI Reminders', count: reminders.length, color: '#1565C0', bg: '#BBDEFB' },
            { label: 'Approved Leaves', count: requests.filter(r => r.statut === 'valide').length, color: '#2E7D32', bg: '#E8F5E9' },
            { label: 'Pending', count: requests.filter(r => r.statut === 'en_attente').length, color: '#E65100', bg: '#FFF8E1' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#fff', border: '1px solid #E8EAED', fontSize: 12, fontWeight: 600, color: '#1a2340' }}>
              {label}
              <span style={{ padding: '1px 7px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: bg, color }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rules Banner */}
      {showRules && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#FFF8E1',
          border: '1px solid #FFE082',
          color: '#B78103',
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
              fontSize: '16px', fontWeight: '700', color: '#B78103', cursor: 'pointer'
            }}
            title="Hide"
          >
            ×
          </button>
          <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WarningIcon style={{ fontSize: '16px' }} /> Absence justification rules:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li><strong>Deadline:</strong> You have <strong>72 hours (3 days)</strong> after receiving a reminder to submit a justification.</li>
            <li><strong>File size:</strong> The justification file (image or PDF) must not exceed <strong>2 MB</strong>.</li>
            <li><strong>Accepted formats:</strong> Only images (JPEG, PNG, WEBP) or PDF documents.</li>
          </ul>
        </div>
      )}

      {/* Two-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, minHeight: 0 }}>

        {/* Left: notifications list */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#7A8A99', fontSize: 14 }}>Loading...</p>
            </div>
          ) : error ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <p style={{ color: '#C62828', fontSize: 13 }}>{error}</p>
              <button onClick={fetchNotifications} style={{ padding: '7px 18px', background: '#F5F6FA', border: '1px solid #E8EAED', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Retry</button>
            </div>
          ) : totalNotificationCount === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsIcon style={{ fontSize: 26, color: '#B0BEC5' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2340', margin: 0 }}>No notifications</p>
              <p style={{ fontSize: 12, color: '#7A8A99', margin: 0 }}>You have no messages or pending requests.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              
              {/* Category 1: AI Absence Reminders */}
              {reminders.length > 0 && (
                <>
                  <div style={{ padding: '10px 18px 6px', background: '#FAFBFC', borderBottom: '1px solid #F0F2F5' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#1976D2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attendance Reminders (AI)</p>
                  </div>
                  {reminders.map((notif, idx) => (
                    <div key={notif.id || idx} 
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < reminders.length - 1 ? '1px solid #F0F2F5' : 'none',
                        transition: 'background 0.15s',
                        cursor: notif.read ? 'default' : 'pointer',
                        background: notif.read ? 'transparent' : '#F0F4F8'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = notif.read ? '#FAFBFC' : '#E6ECF5'}
                      onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : '#F0F4F8'}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E3F2FD', border: '1.5px solid #90CAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SmartToyIcon style={{ fontSize: 18, color: '#1976D2' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#1a2340', lineHeight: 1.5 }}>
                          {notif.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: '#7A8A99' }}>
                            Received: {formatNotificationDate(notif.date)}
                          </span>
                        </div>

                        {/* Justification Status Display / Form */}
                        {notif.justificationStatus === 'PENDING' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {isExpired(notif.date) ? (
                              <span style={{ fontSize: 11, color: '#7A8A99', background: '#ECEFF1', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                                Justification deadline exceeded (72h) ⚠️
                              </span>
                            ) : activeJustifyId === notif.id ? (
                              <div style={{ marginTop: 10, padding: 12, background: '#FAFBFC', border: '1px solid #DDE1E7', borderRadius: 8 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1a2340' }}>Your justification message:</label>
                                <textarea
                                  value={responseMsg}
                                  onChange={(e) => setResponseMsg(e.target.value)}
                                  placeholder="Explain the reason for your absence..."
                                  style={{
                                    width: '100%', height: 60, padding: 8, fontSize: 12,
                                    border: '1px solid #D0D5DD', borderRadius: 6,
                                    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', marginBottom: 10
                                  }}
                                />

                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1a2340' }}>Medical certificate or justification document (Image/PDF):</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handleFileChange}
                                  style={{ fontSize: 11, marginBottom: 12, display: 'block' }}
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
                                    {submitLoading ? 'Sending...' : 'Submit Justification'}
                                  </button>
                                  <button
                                    onClick={() => setActiveJustifyId(null)}
                                    style={{
                                      padding: '6px 12px', background: '#FAFBFC', color: '#555',
                                      border: '1px solid #DDE1E7', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
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
                                  padding: '5px 12px', background: '#1976D2', color: '#fff',
                                  border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  cursor: 'pointer', marginTop: 4
                                }}
                              >
                                Provide Justification
                              </button>
                            )}
                          </div>
                        )}

                        {notif.justificationStatus === 'JUSTIFIED' && (
                          <div style={{ marginTop: 8, padding: 8, background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 6, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: '#E65100' }}>Justification submitted (HR Pending) ⏳</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4A5568' }}><strong>Your message:</strong> {notif.responseMessage}</p>
                            {notif.responseAttachmentName && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1976D2' }}>📎 {notif.responseAttachmentName}</p>
                            )}
                          </div>
                        )}

                        {notif.justificationStatus === 'APPROVED' && (
                          <div style={{ marginTop: 8, padding: 8, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 6, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: '#2E7D32' }}>Justification approved by HR ✅</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4A5568' }}>The absence has been resolved in your history.</p>
                          </div>
                        )}

                        {notif.justificationStatus === 'REJECTED' && (
                          <div style={{ marginTop: 8, padding: 8, background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 6, fontSize: 12 }} onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontWeight: 600, color: '#C62828' }}>Justification rejected by HR ❌</span>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4A5568' }}>Please contact HR department to resolve.</p>
                            
                            {/* Allow resubmission if rejected and not expired */}
                            {isExpired(notif.date) ? (
                              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#7A8A99', fontWeight: 600 }}>Resubmission deadline exceeded (72h since reminder) ⚠️</p>
                            ) : activeJustifyId === notif.id ? (
                              <div style={{ marginTop: 10, padding: 12, background: '#FAFBFC', border: '1px solid #DDE1E7', borderRadius: 8 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1a2340' }}>Your new message :</label>
                                <textarea
                                  value={responseMsg}
                                  onChange={(e) => setResponseMsg(e.target.value)}
                                  placeholder="New explanation..."
                                  style={{
                                    width: '100%', height: 60, padding: 8, fontSize: 12,
                                    border: '1px solid #D0D5DD', borderRadius: 6,
                                    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', marginBottom: 10
                                  }}
                                />
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1a2340' }}>New justification document :</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handleFileChange}
                                  style={{ fontSize: 11, marginBottom: 12, display: 'block' }}
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
                                    {submitLoading ? 'Submitting...' : 'Resubmit Justification'}
                                  </button>
                                  <button
                                    onClick={() => setActiveJustifyId(null)}
                                    style={{
                                      padding: '6px 12px', background: '#FAFBFC', color: '#555',
                                      border: '1px solid #DDE1E7', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
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
                                Resubmit
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: notif.read ? '#ECEFF1' : '#E3F2FD', color: notif.read ? '#607D8B' : '#1976D2', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {notif.read ? 'Read' : 'New'}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Category 2: Pending Leave Requests */}
              {pending.length > 0 && (
                <>
                  <div style={{ padding: '10px 18px 6px', background: '#FAFBFC', borderBottom: '1px solid #F0F2F5', borderTop: reminders.length > 0 ? '1px solid #F0F2F5' : 'none' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending responses</p>
                  </div>
                  {pending.map((req, idx) => {
                    const cfg = STATUS_CONFIG.en_attente;
                    return (
                      <div key={req.id || idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < pending.length - 1 ? '1px solid #F0F2F5' : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#1a2340', lineHeight: 1.5 }}>
                            {cfg.message(req.type)}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#7A8A99', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  <div style={{ padding: '10px 18px 6px', background: '#FAFBFC', borderBottom: '1px solid #F0F2F5', borderTop: (reminders.length > 0 || pending.length > 0) ? '1px solid #F0F2F5' : 'none' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leave request history</p>
                  </div>
                  {responded.map((req, idx) => {
                    const cfg = STATUS_CONFIG[req.statut] || STATUS_CONFIG.en_attente;
                    return (
                      <div key={req.id || idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: idx < responded.length - 1 ? '1px solid #F0F2F5' : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#1a2340', lineHeight: 1.5 }}>
                            {cfg.message(req.type)}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#7A8A99', display: 'flex', alignItems: 'center', gap: 3 }}>
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
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1a2340' }}>Status Legend</p>
            {[
              { color: '#1976D2', bg: '#E3F2FD', border: '#90CAF9', label: 'AI Reminder', desc: 'Attendance alert 🤖' },
              { color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', label: 'Approved', desc: 'Leave granted ✅' },
              { color: '#C62828', bg: '#FFEBEE', border: '#FFCDD2', label: 'Rejected', desc: 'Leave rejected ❌' },
              { color: '#E65100', bg: '#FFF8E1', border: '#FFE082', label: 'Pending', desc: 'Under review 🕐' },
            ].map(({ color, bg, border, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: bg, border: `1px solid ${border}`, marginBottom: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#7A8A99' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #F0F2F5', paddingTop: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1a2340' }}>ℹ️ Reminders</p>
            {[
              'AI alerts require your immediate attention.',
              'Submit your leave requests in advance.',
              'Response within 48 business hours.',
              'Check this page regularly.',
            ].map((tip, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontSize: 12, color: '#4A5568', lineHeight: 1.6, paddingLeft: 10, borderLeft: '2px solid #E3F2FD' }}>{tip}</p>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #F0F2F5', paddingTop: 14, marginTop: 'auto' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#B0BEC5', lineHeight: 1.7 }}>
              📧 hr@company.com<br />🕐 Mon–Fri 09:00 AM–05:00 PM
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
