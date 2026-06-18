import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LanguageIcon from '@mui/icons-material/Language';
import { useTheme } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const fileRef = useRef(null);

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  // Custom alert toast state
  const [alertToast, setAlertToast] = useState({ open: false, message: '', type: 'error' });

  const APP_RULES = [
    {
      icon: <QrCodeScannerIcon style={{ fontSize: 18, color: '#1976D2' }} />,
      iconBg: '#E3F2FD', title: t('profile.ruleScanTitle'), tag: t('profile.tagMandatory'), tagColor: '#1565C0', tagBg: '#DBEAFE',
      description: t('profile.ruleScanDesc'),
    },
    {
      icon: <LocationOnIcon style={{ fontSize: 18, color: '#2E7D32' }} />,
      iconBg: '#E8F5E9', title: t('profile.ruleGeoTitle'), tag: t('profile.tagImportant'), tagColor: '#2E7D32', tagBg: '#DCFCE7',
      description: t('profile.ruleGeoDesc'),
    },
    {
      icon: <AccessTimeIcon style={{ fontSize: 18, color: '#E65100' }} />,
      iconBg: '#FFF8E1', title: t('profile.ruleSchedTitle'), tag: t('profile.tagSchedules'), tagColor: '#E65100', tagBg: '#FEF3C7',
      description: t('profile.ruleSchedDesc'),
    },
    {
      icon: <EventNoteIcon style={{ fontSize: 18, color: '#7B1FA2' }} />,
      iconBg: '#F3E5F5', title: t('profile.ruleLeavesTitle'), tag: t('profile.tagLeaves'), tagColor: '#7B1FA2', tagBg: '#F5F3FF',
      description: t('profile.ruleLeavesDesc'),
    },
    {
      icon: <NotificationsActiveIcon style={{ fontSize: 18, color: '#F57C00' }} />,
      iconBg: '#FFF3E0', title: t('profile.ruleNotifTitle'), tag: t('profile.tagInfo'), tagColor: '#F57C00', tagBg: '#FFF7ED',
      description: t('profile.ruleNotifDesc'),
    },
    {
      icon: <SecurityIcon style={{ fontSize: 18, color: '#C62828' }} />,
      iconBg: '#FFEBEE', title: t('profile.ruleSecTitle'), tag: t('profile.tagSecurity'), tagColor: '#C62828', tagBg: '#FEE2E2',
      description: t('profile.ruleSecDesc'),
    },
  ];

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

  useEffect(() => {
    api.get('/users/me')
      .then(r => {
        setProfile(r.data);
        if (r.data.profilePic) {
          setAvatar(r.data.profilePic);
          localStorage.setItem(`avatar_${r.data.id}`, r.data.profilePic);
        } else {
          const saved = localStorage.getItem(`avatar_${r.data.id}`);
          if (saved) setAvatar(saved);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast(t('profile.maxSize'), 'error'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target.result;
      try {
        await api.put('/users/me/profile-pic', { profilePic: url });
        setAvatar(url);
        if (profile?.id) {
          localStorage.setItem(`avatar_${profile.id}`, url);
          window.dispatchEvent(new Event('profile-pic-updated'));
        }
        showToast(t('profile.picUpdated'), "success");
      } catch (err) {
        showToast(t('profile.picUpdateError'), "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    try {
      await api.delete('/users/me/profile-pic');
      setAvatar(null);
      if (profile?.id) {
        localStorage.removeItem(`avatar_${profile.id}`);
        window.dispatchEvent(new Event('profile-pic-updated'));
      }
      showToast(t('profile.picDeleted'), "success");
    } catch (err) {
      showToast(t('profile.picDeleteError'), "error");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: t('profile.passNotMatch') }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: 'error', text: t('profile.passMinChar') }); return; }
    setPwdLoading(true);
    try {
      await api.put('/users/me/password', { oldPassword: oldPwd, newPassword: newPwd });
      setPwdMsg({ type: 'success', text: t('profile.passSuccess') });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.error || t('profile.passError') });
    } finally { setPwdLoading(false); }
  };

  const getInitials = (nom) => nom ? nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?';
  const getRoleLabel = (r) => r === 'ROLE_ADMIN' ? t('profile.adminLabel') : r === 'ROLE_EMPLOYE' ? t('profile.employeeLabel') : r || '--';
  const formatDate = (d) => {
    if (!d) return '--';
    try { return new Date(d).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ marginLeft: 240, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: theme.palette.background.default }}>
        <p style={{ color: theme.palette.text.secondary, fontSize: 14 }}>{t('profile.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{
      marginLeft: 240,
      height: '100vh',
      overflow: 'hidden',
      background: theme.palette.background.default,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      boxSizing: 'border-box',
      gap: 20,
    }}>

      {/* ── Page header ── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, margin: '0 0 4px' }}>{t('profile.title')}</h1>
        <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>{t('profile.subtitle')}</p>
      </div>

      {/* ── Two-column body ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 20,
        minHeight: 0,
      }}>

        {/* ════ LEFT COLUMN ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>

          {/* Avatar + Info card */}
          <div style={{
            background: theme.palette.background.paper, borderRadius: 12,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            padding: '20px',
            flexShrink: 0,
          }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    border: '3px solid ' + (theme.palette.mode === 'dark' ? '#1E293B' : '#E3F2FD'),
                    boxShadow: '0 3px 12px rgba(38,115,221,0.2)',
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #2673DD, #1E40AF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: '#fff',
                    }}>
                      {getInitials(profile?.nom)}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    opacity: avatarHover ? 1 : 0, transition: 'opacity 0.2s',
                  }}>
                    <CameraAltIcon style={{ fontSize: 18, color: '#fff' }} />
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{t('profile.drawerChangePic')}</span>
                  </div>
                </div>
                {avatar && (
                  <button onClick={handleRemovePhoto} style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#F44336', color: '#fff',
                    border: '2px solid #fff', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: theme.palette.text.primary }}>{profile?.nom || '--'}</p>
                <span style={{
                  display: 'inline-block', padding: '3px 10px',
                  borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: profile?.role === 'ROLE_ADMIN' ? (theme.palette.mode === 'dark' ? '#1E293B' : '#1a2340') : theme.palette.primary.main,
                  color: '#fff',
                }}>
                  {getRoleLabel(profile?.role)}
                </span>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: theme.palette.text.secondary }}>{t('profile.changePhotoHint')}</p>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: `1px solid ${theme.palette.divider}` }}>
              {[
                { icon: <PersonIcon style={{ fontSize: 15, color: theme.palette.primary.main }} />, label: t('profile.labelName'), value: profile?.nom || '--' },
                { icon: <EmailIcon style={{ fontSize: 15, color: theme.palette.primary.main }} />, label: t('profile.labelEmail'), value: profile?.email || '--' },
                { icon: <BadgeIcon style={{ fontSize: 15, color: theme.palette.primary.main }} />, label: t('profile.labelRole'), value: getRoleLabel(profile?.role) },
                { icon: <CalendarMonthIcon style={{ fontSize: 15, color: theme.palette.primary.main }} />, label: t('profile.labelMemberSince'), value: formatDate(profile?.createdAt) },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: theme.palette.mode === 'dark' ? '#1E293B' : '#EBF3FC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* App Language Switcher */}
            <div style={{
              borderTop: `1px solid ${theme.palette.divider}`,
              marginTop: 10,
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: theme.palette.mode === 'dark' ? '#1E293B' : '#EBF3FC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <LanguageIcon style={{ fontSize: 15, color: theme.palette.primary.main }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('profile.labelLanguage') || 'Language'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: theme.palette.text.primary }}>
                    {language === 'fr' ? 'Français' : 'English'}
                  </p>
                </div>
              </div>
              
              {/* Segmented Switcher */}
              <div style={{
                display: 'flex',
                background: theme.palette.mode === 'dark' ? '#1E293B' : '#F4F6F8',
                borderRadius: '8px',
                padding: '3px',
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  style={{
                    border: 'none',
                    background: language === 'en' ? (theme.palette.mode === 'dark' ? '#0F172A' : '#FFFFFF') : 'transparent',
                    color: language === 'en' ? theme.palette.primary.main : theme.palette.text.secondary,
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: language === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  style={{
                    border: 'none',
                    background: language === 'fr' ? (theme.palette.mode === 'dark' ? '#0F172A' : '#FFFFFF') : 'transparent',
                    color: language === 'fr' ? theme.palette.primary.main : theme.palette.text.secondary,
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: language === 'fr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  FR
                </button>
              </div>
            </div>
          </div>

          {/* Password card */}
          <div style={{
            background: theme.palette.background.paper, borderRadius: 12,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            padding: '20px',
            flex: 1, minHeight: 0, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LockIcon style={{ fontSize: 16, color: '#F57C00' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>{t('profile.changePassTitle')}</p>
                <p style={{ margin: 0, fontSize: 11, color: theme.palette.text.secondary }}>{t('profile.changePassHint')}</p>
              </div>
            </div>

            {pwdMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: pwdMsg.type === 'success' ? (theme.palette.mode === 'dark' ? '#1B4D22' : '#E8F5E9') : (theme.palette.mode === 'dark' ? '#3B1F1F' : '#FFEBEE'),
                border: `1px solid ${pwdMsg.type === 'success' ? (theme.palette.mode === 'dark' ? '#4ADE8033' : '#A5D6A7') : (theme.palette.mode === 'dark' ? '#EF444433' : '#FFCDD2')}`,
              }}>
                {pwdMsg.type === 'success'
                  ? <CheckCircleIcon style={{ fontSize: 15, color: theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32', flexShrink: 0 }} />
                  : <ErrorOutlineIcon style={{ fontSize: 15, color: theme.palette.mode === 'dark' ? '#EF4444' : '#C62828', flexShrink: 0 }} />}
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: pwdMsg.type === 'success' ? (theme.palette.mode === 'dark' ? '#4ADE80' : '#2E7D32') : (theme.palette.mode === 'dark' ? '#EF4444' : '#C62828') }}>{pwdMsg.text}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: t('profile.passCurrent'), value: oldPwd, setter: setOldPwd, show: showOld, toggle: () => setShowOld(v => !v) },
                { label: t('profile.passNew'), value: newPwd, setter: setNewPwd, show: showNew, toggle: () => setShowNew(v => !v) },
                { label: t('profile.passConfirm'), value: confirmPwd, setter: setConfirmPwd, show: showNew, toggle: () => setShowNew(v => !v) },
              ].map(({ label, value, setter, show, toggle }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={e => setter(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '9px 36px 9px 12px',
                        fontSize: 13, border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8, fontFamily: 'inherit',
                        boxSizing: 'border-box', color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = theme.palette.primary.main}
                      onBlur={e => e.target.style.borderColor = theme.palette.divider}
                    />
                    <button type="button" onClick={toggle} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: theme.palette.text.secondary, display: 'flex', alignItems: 'center',
                    }}>
                      {show ? <VisibilityOffIcon style={{ fontSize: 16 }} /> : <VisibilityIcon style={{ fontSize: 16 }} />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={pwdLoading}
                style={{
                  marginTop: 4,
                  padding: '10px',
                  background: pwdLoading ? '#B0BEC5' : (theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #2673DD, #1A4A6B)' : 'linear-gradient(135deg, #2673DD, #1E40AF)'),
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                  cursor: pwdLoading ? 'not-allowed' : 'pointer',
                  boxShadow: pwdLoading ? 'none' : '0 3px 10px rgba(38,115,221,0.2)',
                  transition: 'all 0.2s',
                }}
              >
                {pwdLoading ? t('profile.passBtnUpdating') : t('profile.passBtnUpdate')}
              </button>
            </form>
          </div>
        </div>

        {/* ════ RIGHT COLUMN — App Guide ════ */}
        <div style={{
          background: theme.palette.background.paper, borderRadius: 12,
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0,0,0,0.07)',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column',
          minHeight: 0, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.palette.mode === 'dark' ? 'rgba(38, 115, 221, 0.14)' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InfoIcon style={{ fontSize: 18, color: theme.palette.primary.main }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.palette.text.primary }}>{t('profile.guideTitle')}</p>
              <p style={{ margin: 0, fontSize: 12, color: theme.palette.text.secondary }}>{t('profile.guideSubtitle')}</p>
            </div>
          </div>

          {/* Warning banner */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 9,
            background: theme.palette.mode === 'dark' ? '#3B2F1F' : '#FFFDE7',
            border: '1px solid ' + (theme.palette.mode === 'dark' ? '#5B4F3F' : '#FFE082'),
            marginBottom: 14, flexShrink: 0,
          }}>
            <WarningAmberIcon style={{ fontSize: 16, color: '#FFB300', marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12, color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#6D4C0A', fontWeight: 500, lineHeight: 1.6 }}>
              {t('profile.guideWarning')}
            </p>
          </div>

          {/* Rules grid ── 2 columns, scrolls internally if needed */}
          <div style={{
            flex: 1, minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            overflowY: 'auto',
            paddingRight: 4,
          }}>
            {APP_RULES.map((rule, i) => {
              const isDark = theme.palette.mode === 'dark';
              const iconColor = isDark ? theme.palette.primary.main : rule.icon.props.style.color;
              const icon = React.cloneElement(rule.icon, { style: { ...rule.icon.props.style, color: iconColor } });
              const iconBg = isDark ? 'rgba(38, 115, 221, 0.14)' : rule.iconBg;
              const tagColor = isDark ? '#F8FAFC' : rule.tagColor;
              const tagBg = isDark ? '#111827' : rule.tagBg;
              
              return (
                <div
                  key={i}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: isDark ? '#1E293B' : '#FAFBFC',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.palette.primary.main;
                    e.currentTarget.style.boxShadow = isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 10px rgba(25,118,210,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.palette.divider;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, flex: 1, lineHeight: 1.3 }}>
                      {rule.title}
                    </p>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start',
                    padding: '2px 9px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700,
                    background: tagBg, color: tagColor,
                  }}>
                    {rule.tag}
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: theme.palette.text.secondary, lineHeight: 1.65 }}>
                    {rule.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 14, padding: '10px 14px',
            borderRadius: 9, background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA',
            border: `1px solid ${theme.palette.divider}`, flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.palette.text.secondary, lineHeight: '1.7' }}>
              📌 <strong>{t('profile.footerVersion')}</strong> &nbsp;·&nbsp;
              📧 <strong>{t('profile.footerSupport')}</strong> hr@company.com &nbsp;·&nbsp;
              🕐 <strong>{t('profile.footerAvailable')}</strong> {t('profile.footerDays')}
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
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          boxShadow: theme.palette.mode === 'dark' ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.palette.divider}`,
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
          <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: theme.palette.text.primary }}>
            {alertToast.message}
          </div>
          <button
            onClick={() => setAlertToast(prev => ({ ...prev, open: false }))}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.text.secondary,
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
