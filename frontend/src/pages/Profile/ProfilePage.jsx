import { useState, useEffect, useRef } from 'react';
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

const APP_RULES = [
  {
    icon: <QrCodeScannerIcon style={{ fontSize: 18, color: '#1976D2' }} />,
    iconBg: '#E3F2FD', title: 'Scan QR Code', tag: 'Mandatory', tagColor: '#1565C0', tagBg: '#DBEAFE',
    description: 'Scan the QR Code displayed on the physical kiosk. The code updates every hour.',
  },
  {
    icon: <LocationOnIcon style={{ fontSize: 18, color: '#2E7D32' }} />,
    iconBg: '#E8F5E9', title: 'Geolocation Required', tag: 'Important', tagColor: '#2E7D32', tagBg: '#DCFCE7',
    description: 'Your GPS location is verified at each clock-in. You must be in the authorized zone.',
  },
  {
    icon: <AccessTimeIcon style={{ fontSize: 18, color: '#E65100' }} />,
    iconBg: '#FFF8E1', title: 'Schedules & Punctuality', tag: 'Schedules', tagColor: '#E65100', tagBg: '#FEF3C7',
    description: 'Clock in before 09:00 AM to avoid being late. Remember to clock out when leaving.',
  },
  {
    icon: <EventNoteIcon style={{ fontSize: 18, color: '#7B1FA2' }} />,
    iconBg: '#F3E5F5', title: 'Leave Requests', tag: 'Leaves', tagColor: '#7B1FA2', tagBg: '#F5F3FF',
    description: 'Submit your leave requests via "My Leaves". Approvals/rejections will appear in Notifications.',
  },
  {
    icon: <NotificationsActiveIcon style={{ fontSize: 18, color: '#F57C00' }} />,
    iconBg: '#FFF3E0', title: 'Notification Updates', tag: 'Info', tagColor: '#F57C00', tagBg: '#FFF7ED',
    description: 'Check Notifications to see the status of your requests (approved, rejected, pending).',
  },
  {
    icon: <SecurityIcon style={{ fontSize: 18, color: '#C62828' }} />,
    iconBg: '#FFEBEE', title: 'Account Security', tag: 'Security', tagColor: '#C62828', tagBg: '#FEE2E2',
    description: 'Do not share your credentials. Change your password regularly.',
  },
];

export default function ProfilePage() {
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
    if (file.size > 2 * 1024 * 1024) { showToast('Max size 2 MB.', 'error'); return; }
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
        showToast("Profile picture updated!", "success");
      } catch (err) {
        showToast("Error updating profile picture", "error");
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
      showToast("Profile picture deleted.", "success");
    } catch (err) {
      showToast("Error deleting profile picture", "error");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: 'error', text: 'Minimum 6 characters required.' }); return; }
    setPwdLoading(true);
    try {
      await api.put('/users/me/password', { oldPassword: oldPwd, newPassword: newPwd });
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.error || 'Error updating password.' });
    } finally { setPwdLoading(false); }
  };

  const getInitials = (nom) => nom ? nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?';
  const getRoleLabel = (r) => r === 'ROLE_ADMIN' ? 'Administrator' : r === 'ROLE_EMPLOYE' ? 'Employee' : r || '--';
  const formatDate = (d) => {
    if (!d) return '--';
    try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ marginLeft: 240, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#F5F6FA' }}>
        <p style={{ color: '#7A8A99', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{
      marginLeft: 240,
      height: '100vh',
      overflow: 'hidden',
      background: '#F5F6FA',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      boxSizing: 'border-box',
      gap: 20,
    }}>

      {/* ── Page header ── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2340', margin: '0 0 4px' }}>My Profile</h1>
        <p style={{ fontSize: 13, color: '#7A8A99', margin: 0 }}>Personal information, security, and application guide</p>
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
            background: '#fff', borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
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
                    border: '3px solid #E3F2FD',
                    boxShadow: '0 3px 12px rgba(25,118,210,0.2)',
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #1565C0, #1976D2)',
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
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>CHANGE</span>
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
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1a2340' }}>{profile?.nom || '--'}</p>
                <span style={{
                  display: 'inline-block', padding: '3px 10px',
                  borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: profile?.role === 'ROLE_ADMIN' ? '#1a2340' : '#1976D2',
                  color: '#fff',
                }}>
                  {getRoleLabel(profile?.role)}
                </span>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#B0BEC5' }}>Click to change photo</p>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: '1px solid #F0F2F5' }}>
              {[
                { icon: <PersonIcon style={{ fontSize: 15, color: '#1976D2' }} />, label: 'Name', value: profile?.nom || '--' },
                { icon: <EmailIcon style={{ fontSize: 15, color: '#1976D2' }} />, label: 'Email', value: profile?.email || '--' },
                { icon: <BadgeIcon style={{ fontSize: 15, color: '#1976D2' }} />, label: 'Role', value: getRoleLabel(profile?.role) },
                { icon: <CalendarMonthIcon style={{ fontSize: 15, color: '#1976D2' }} />, label: 'Member since', value: formatDate(profile?.createdAt) },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F2F5' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: '#EBF3FC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#7A8A99', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#1a2340', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Password card */}
          <div style={{
            background: '#fff', borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: '20px',
            flex: 1, minHeight: 0, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LockIcon style={{ fontSize: 16, color: '#F57C00' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a2340' }}>Change Password</p>
                <p style={{ margin: 0, fontSize: 11, color: '#7A8A99' }}>Minimum 6 characters</p>
              </div>
            </div>

            {pwdMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: pwdMsg.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                border: `1px solid ${pwdMsg.type === 'success' ? '#A5D6A7' : '#FFCDD2'}`,
              }}>
                {pwdMsg.type === 'success'
                  ? <CheckCircleIcon style={{ fontSize: 15, color: '#2E7D32', flexShrink: 0 }} />
                  : <ErrorOutlineIcon style={{ fontSize: 15, color: '#C62828', flexShrink: 0 }} />}
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: pwdMsg.type === 'success' ? '#2E7D32' : '#C62828' }}>{pwdMsg.text}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Current password', value: oldPwd, setter: setOldPwd, show: showOld, toggle: () => setShowOld(v => !v) },
                { label: 'New password', value: newPwd, setter: setNewPwd, show: showNew, toggle: () => setShowNew(v => !v) },
                { label: 'Confirm password', value: confirmPwd, setter: setConfirmPwd, show: showNew, toggle: () => setShowNew(v => !v) },
              ].map(({ label, value, setter, show, toggle }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1a2340', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={e => setter(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '9px 36px 9px 12px',
                        fontSize: 13, border: '1px solid #D0D5DD',
                        borderRadius: 8, fontFamily: 'inherit',
                        boxSizing: 'border-box', color: '#1a2340',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#1976D2'}
                      onBlur={e => e.target.style.borderColor = '#D0D5DD'}
                    />
                    <button type="button" onClick={toggle} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#7A8A99', display: 'flex', alignItems: 'center',
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
                  background: pwdLoading ? '#B0BEC5' : 'linear-gradient(135deg, #1565C0, #1976D2)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                  cursor: pwdLoading ? 'not-allowed' : 'pointer',
                  boxShadow: pwdLoading ? 'none' : '0 3px 10px rgba(25,118,210,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* ════ RIGHT COLUMN — App Guide ════ */}
        <div style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column',
          minHeight: 0, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InfoIcon style={{ fontSize: 18, color: '#1976D2' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a2340' }}>Application Guide</p>
              <p style={{ margin: 0, fontSize: 12, color: '#7A8A99' }}>Rules and important details for employees</p>
            </div>
          </div>

          {/* Warning banner */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 9,
            background: '#FFFDE7', border: '1px solid #FFE082',
            marginBottom: 14, flexShrink: 0,
          }}>
            <WarningAmberIcon style={{ fontSize: 16, color: '#F9A825', marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#6D4C0A', fontWeight: 500, lineHeight: 1.6 }}>
              Non-compliance with clocking rules may impact your monthly attendance record.
              If you face technical issues, contact your HR administrator immediately.
            </p>
          </div>

          {/* Rules grid — 2 columns, scrolls internally if needed */}
          <div style={{
            flex: 1, minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            overflowY: 'auto',
            paddingRight: 4,
          }}>
            {APP_RULES.map((rule, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: '#FAFBFC',
                  border: '1px solid #F0F2F5',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#BFDBFE';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(25,118,210,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#F0F2F5';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: rule.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {rule.icon}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a2340', flex: 1, lineHeight: 1.3 }}>
                    {rule.title}
                  </p>
                </div>
                <span style={{
                  alignSelf: 'flex-start',
                  padding: '2px 9px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700,
                  background: rule.tagBg, color: rule.tagColor,
                }}>
                  {rule.tag}
                </span>
                <p style={{ margin: 0, fontSize: 12, color: '#4A5568', lineHeight: 1.65 }}>
                  {rule.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 14, padding: '10px 14px',
            borderRadius: 9, background: '#F5F6FA',
            border: '1px solid #E8EAED', flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: '#7A8A99', lineHeight: '1.7' }}>
              📌 <strong>v1.0.0</strong> &nbsp;·&nbsp;
              📧 <strong>Support:</strong> hr@company.com &nbsp;·&nbsp;
              🕐 <strong>Available:</strong> Mon–Fri 09:00 AM–05:00 PM
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
