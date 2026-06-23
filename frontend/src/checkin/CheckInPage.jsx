import { useState, useEffect } from "react";
import api from "../api/axios";
import QRScanner from "./QRScanner";
import { useNavigate } from "react-router-dom";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useLanguage } from "../context/LanguageContext";
import { useTheme, useMediaQuery } from "@mui/material";

const STATUS = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", ERROR: "error" };

function computeMonthStats(pointages) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.toISOString().split('T')[0];

  // Count workdays elapsed this month up to today
  let workdays = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) workdays++;
  }

  // Count distinct days with a valid entry
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const presentDays = new Set();
  pointages.forEach(p => {
    if (p.date && p.date.startsWith(monthStr) && p.date <= today && p.type === 'entree' && p.valide) {
      presentDays.add(p.date);
    }
  });

  const present = presentDays.size;
  const absent = Math.max(0, workdays - present);
  return { present, absent, workdays };
}

export default function CheckInPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pointageType, setPointageType] = useState("entree");
  const [monthStats, setMonthStats] = useState(null);
  const [devBypass, setDevBypass] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('hide_rules_pointage') !== 'true';
  });

  const toggleRules = () => {
    setShowRules(prev => {
      const next = !prev;
      localStorage.setItem('hide_rules_pointage', String(!next));
      return next;
    });
  };

  const isTimeValid = () => {
    if (devBypass) return true;
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const timeVal = hrs * 60 + mins;
    if (pointageType === 'entree') {
      // 07:00 is 420 mins, 11:30 is 690 mins
      return timeVal >= 420 && timeVal <= 690;
    } else {
      // 16:00 is 960 mins
      return timeVal >= 960;
    }
  };

  useEffect(() => {
    getLocation();
    // Fetch all user pointages for monthly stats
    api.get(`/pointage?userId=${userId}`)
      .then(r => setMonthStats(computeMonthStats(r.data || [])))
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  const getLocation = () => {
    setGettingLocation(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError(t('checkin.gpsNotSupported'));
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setLocationError(t('checkin.gpsAccessDenied'));
        setGettingLocation(false);
      }
    );
  };

  const handleQRScan = async (qrCode) => {
    setShowScanner(false);
    if (!location) {
      setStatus(STATUS.ERROR);
      setErrorMsg(t('checkin.gpsNotAvailable'));
      return;
    }
    setStatus(STATUS.LOADING);
    try {
      const res = await api.post("/pointage", {
        userId,
        type: pointageType,
        latitude: location.lat,
        longitude: location.lng,
        qrCode,
      });
      setStatus(STATUS.SUCCESS);
      setResult(res.data);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMsg(err.response?.data?.message || t('checkin.checkinErrorDefault'));
    }
  };

  const reset = () => {
    setStatus(STATUS.IDLE);
    setResult(null);
    setErrorMsg("");
  };

  const pageStyle = {
    marginLeft: isMobile ? '0' : '240px',
    height: isMobile ? 'auto' : '100vh',
    minHeight: isMobile ? 'calc(100vh - 56px)' : 'none',
    overflow: isMobile ? 'visible' : 'hidden',
    backgroundColor: theme.palette.background.default,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '16px' : '28px 32px',
    paddingTop: isMobile ? '72px' : '28px',
    boxSizing: 'border-box',
    gap: 16,
  };

  const cardStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: '12px',
    boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
    padding: '20px 24px',
    marginBottom: '12px',
  };


  return (
    <div className="page-container" style={pageStyle}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, margin: '0 0 4px' }}>{t('checkin.title')}</h1>
          <p style={{ fontSize: 13, color: theme.palette.text.secondary, margin: 0 }}>{t('checkin.subtitle')}</p>
        </div>
        <button
          onClick={toggleRules}
          style={{
            background: 'none', border: 'none', color: theme.palette.primary.main, cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <InfoIcon style={{ fontSize: '16px' }} /> {showRules ? t('checkin.hideRules') : t('checkin.showRules')}
        </button>
      </div>

      {/* Rules Banner */}
      {showRules && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: theme.palette.mode === 'dark' ? '#2A1F00' : '#FFF8E1',
          border: theme.palette.mode === 'dark' ? '1px solid #664D00' : '1px solid #FFE082',
          color: theme.palette.mode === 'dark' ? '#FFE082' : '#B78103',
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
              fontSize: '16px', fontWeight: '700', color: theme.palette.mode === 'dark' ? '#FFE082' : '#B78103', cursor: 'pointer'
            }}
            title="Hide"
          >
            ×
          </button>
          <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WarningIcon style={{ fontSize: '16px' }} /> {t('checkin.rulesTitle')}
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li><strong>{t('checkin.ruleCheckin').split(':')[0]}:</strong>{t('checkin.ruleCheckin').substring(t('checkin.ruleCheckin').indexOf(':') + 1)}</li>
            <li><strong>{t('checkin.ruleCheckout').split(':')[0]}:</strong>{t('checkin.ruleCheckout').substring(t('checkin.ruleCheckout').indexOf(':') + 1)}</li>
            <li><strong>{t('checkin.ruleUniqueness').split(':')[0]}:</strong>{t('checkin.ruleUniqueness').substring(t('checkin.ruleUniqueness').indexOf(':') + 1)}</li>
            <li><strong>{t('checkin.ruleGps').split(':')[0]}:</strong>{t('checkin.ruleGps').substring(t('checkin.ruleGps').indexOf(':') + 1)}</li>
          </ul>
        </div>
      )}

      {/* Quick stats row */}
      {monthStats && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, flexShrink: 0 }}>
          {[
            { label: t('checkin.statMonthPresent'), value: monthStats.present, icon: <EventAvailableIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32' }} />, iconBg: theme.palette.mode === 'dark' ? '#064E3B' : '#C8E6C9', color: theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32' },
            { label: t('checkin.statAbsent'), value: monthStats.absent, icon: <EventBusyIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#F87171' : '#C62828' }} />, iconBg: theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFCDD2', color: theme.palette.mode === 'dark' ? '#F87171' : '#C62828' },
            { label: t('checkin.statWorkingDays'), value: monthStats.workdays, icon: <TrendingUpIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1565C0' }} />, iconBg: theme.palette.mode === 'dark' ? '#1E3A8A' : '#BBDEFB', color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1565C0' },
          ].map(({ label, value, icon, iconBg, color }) => (
            <div key={label} style={{ background: theme.palette.background.paper, border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none', borderRadius: 10, boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.07)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content — two columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, minHeight: 0 }}>

        {/* Left: form / status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>


        {status === STATUS.SUCCESS && result && (
          <div style={{
            ...cardStyle,
            border: result.valide ? '2px solid #4CAF50' : '2px solid #F44336',
            textAlign: 'center',
            padding: '48px 32px',
          }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: result.valide ? (theme.palette.mode === 'dark' ? '#064E3B' : '#E8F5E9') : (theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFEBEE'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              {result.valide
                ? <CheckCircleOutlineIcon style={{ fontSize: 40, color: theme.palette.mode === 'dark' ? '#34D399' : '#4CAF50' }} />
                : <ErrorOutlineIcon style={{ fontSize: 40, color: theme.palette.mode === 'dark' ? '#F87171' : '#F44336' }} />
              }
            </div>

            {result.valide ? (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: theme.palette.text.primary }}>
                  {t('checkin.successTitle', { name: result.nom })}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '15px', color: theme.palette.mode === 'dark' ? '#34D399' : '#4CAF50', fontWeight: '600' }}>
                  {t('checkin.successDesc', { type: pointageType === "entree" ? t('checkin.typeEntry') : t('checkin.typeExit'), time: result.heure })}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: theme.palette.error.main }}>
                  {t('checkin.deniedTitle')}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: theme.palette.text.secondary }}>
                  {!result.qrValide && t('checkin.deniedQrInvalid') + " "}
                  {!result.gpsValide && t('checkin.deniedGpsInvalid')}
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
              {[
                { label: t('checkin.badgeQrCode'), ok: result.qrValide },
                { label: t('checkin.badgeGps'), ok: result.gpsValide },
              ].map(({ label, ok }) => (
                <span key={label} style={{
                  fontSize: '12px', padding: '6px 16px',
                  borderRadius: '20px', fontWeight: '600',
                  background: ok ? (theme.palette.mode === 'dark' ? '#064E3B' : '#E8F5E9') : (theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFEBEE'),
                  color: ok ? (theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32') : (theme.palette.mode === 'dark' ? '#F87171' : '#C62828'),
                  border: `1px solid ${ok ? (theme.palette.mode === 'dark' ? '#047857' : '#A5D6A7') : (theme.palette.mode === 'dark' ? '#B91C1C' : '#EF9A9A')}`,
                }}>
                  {label} {ok ? '✓' : '✗'}
                </span>
              ))}
            </div>

            <button
              onClick={reset}
              style={{
                padding: '12px 32px',
                background: result.valide ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA'),
                color: result.valide ? '#FFFFFF' : theme.palette.text.primary,
                border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {t('checkin.btnNewCheckin')}
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === STATUS.ERROR && (
          <div style={{
            ...cardStyle,
            border: `2px solid ${theme.palette.error.main}`,
            textAlign: 'center',
            padding: '40px 32px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFEBEE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <ErrorOutlineIcon style={{ fontSize: 36, color: theme.palette.error.main }} />
            </div>
            <p style={{ margin: '0 0 20px', fontWeight: '600', color: theme.palette.mode === 'dark' ? '#F87171' : '#C62828', fontSize: '15px' }}>{errorMsg}</p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px', background: theme.palette.error.main, color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
              }}
            >
              {t('checkin.btnRetry')}
            </button>
          </div>
        )}

        {/* IDLE */}
        {status === STATUS.IDLE && (
          <>
            {/* Dev Mode Controls */}
            <div style={{
              ...cardStyle,
              background: theme.palette.mode === 'dark' ? '#1c1004' : '#FFF3e0',
              border: '1px solid #ffe0b2',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100' }}>🧪 Mode Test / Dev Mode</span>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 22, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={devBypass}
                    onChange={(e) => {
                      setDevBypass(e.target.checked);
                      if (e.target.checked && !location) {
                        setLocation({ lat: 33.59277446026941, lng: -7.627531335827666 }); // Mock School location
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: devBypass ? '#ff9800' : '#ccc',
                    borderRadius: 22,
                    transition: '0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', height: 16, width: 16, left: devBypass ? 24 : 4, bottom: 3,
                      backgroundColor: 'white', borderRadius: '50%', transition: '0.2s'
                    }}/>
                  </span>
                </label>
              </div>
              {devBypass && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => handleQRScan("DEV_TEST_MOCK_QR")}
                    style={{
                      flex: 1, padding: '10px', background: '#e65100', color: 'white',
                      border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(230, 81, 0, 0.2)'
                    }}
                  >
                    ⚡ Simuler Pointage (Sans Caméra)
                  </button>
                </div>
              )}
            </div>

            {/* Type selector */}
            <div style={cardStyle}>
              <p style={{
                fontSize: '12px', fontWeight: '600', color: theme.palette.text.secondary,
                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px',
              }}>
                {t('checkin.typeSelectorHeader')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { value: "entree", label: t('checkin.typeEntry'), icon: <LoginIcon style={{ fontSize: 20 }} /> },
                  { value: "sortie", label: t('checkin.typeExit'), icon: <LogoutIcon style={{ fontSize: 20 }} /> },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setPointageType(value)}
                    style={{
                      flex: 1, padding: '14px 16px',
                      borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      border: pointageType === value ? `2px solid ${theme.palette.primary.main}` : `1.5px solid ${theme.palette.divider}`,
                      background: pointageType === value ? (theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD') : (theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA'),
                      color: pointageType === value ? theme.palette.primary.main : theme.palette.text.secondary,
                      fontWeight: pointageType === value ? '700' : '500',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location status */}
            <div style={{
              ...cardStyle, padding: '20px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '10px',
                  background: location ? (theme.palette.mode === 'dark' ? '#064E3B' : '#E8F5E9') : locationError ? (theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFEBEE') : (theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MyLocationIcon style={{
                    fontSize: 22,
                    color: location ? '#4CAF50' : locationError ? '#F44336' : '#7A8A99',
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: theme.palette.text.primary }}>
                    {t('checkin.gpsHeader')}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '12px',
                    color: location ? (theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32') : locationError ? theme.palette.error.main : theme.palette.text.secondary,
                  }}>
                    {gettingLocation ? t('checkin.gpsLocating')
                      : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : locationError || t('checkin.gpsNotAvailable')}
                  </p>
                </div>
              </div>
              {!location && !gettingLocation && (
                <button
                  onClick={getLocation}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA', border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', color: theme.palette.text.primary,
                  }}
                >
                  <RefreshIcon style={{ fontSize: 16 }} />
                  {t('checkin.btnRetry')}
                </button>
              )}
            </div>

            {/* Scan button */}
            <button
              onClick={() => {
                if (!isTimeValid()) {
                  setStatus(STATUS.ERROR);
                  setErrorMsg(pointageType === 'entree' 
                    ? t('checkin.btnClosedEntry') 
                    : t('checkin.btnClosedExit'));
                  return;
                }
                setShowScanner(true);
              }}
              disabled={!location || gettingLocation}
              style={{
                width: '100%', padding: '18px',
                background: (!location || gettingLocation) 
                  ? (theme.palette.mode === 'dark' ? '#1E293B' : '#E8EAED') 
                  : !isTimeValid()
                    ? '#FFA726'
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, #1E40AF)`,
                color: (!location || gettingLocation) ? (theme.palette.mode === 'dark' ? '#475569' : '#9E9E9E') : '#FFFFFF',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700',
                cursor: (location && !gettingLocation) ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: (location && !gettingLocation) ? `0 4px 14px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(25, 118, 210, 0.35)'}` : 'none',
                transition: 'all 0.2s',
                marginBottom: '16px',
              }}
            >
              <QrCodeScannerIcon style={{ fontSize: 22 }} />
              {gettingLocation 
                ? t('checkin.gpsLocating') 
                : !location 
                  ? t('checkin.btnGpsRequired') 
                  : !isTimeValid() 
                    ? (pointageType === 'entree' ? t('checkin.btnClosedEntry') : t('checkin.btnClosedExit'))
                    : t('checkin.btnScan')}
            </button>

            {/* History link */}
            <button
              onClick={() => navigate("/history")}
              style={{
                width: '100%', padding: '14px',
                background: theme.palette.background.paper, border: `1.5px solid ${theme.palette.divider}`,
                borderRadius: '12px', fontSize: '14px',
                fontWeight: '600', color: theme.palette.text.secondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.palette.primary.main;
                e.currentTarget.style.color = theme.palette.primary.main;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.palette.divider;
                e.currentTarget.style.color = theme.palette.text.secondary;
              }}
            >
              <HistoryIcon style={{ fontSize: 18 }} />
              {t('checkin.btnHistory')}
            </button>
          </>
        )}

        {/* LOADING */}
        {status === STATUS.LOADING && (
          <div style={{ background: theme.palette.background.paper, border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none', padding: '60px 32px', borderRadius: 12, boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <QrCodeScannerIcon style={{ fontSize: 28, color: theme.palette.primary.main }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: theme.palette.text.primary, margin: '0 0 8px' }}>
              {t('checkin.verifyingTitle')}
            </p>
            <p style={{ fontSize: '13px', color: theme.palette.text.secondary, margin: 0 }}>
              {t('checkin.verifyingDesc')}
            </p>
          </div>
        )}
        </div>

        {/* Right: empty decorative panel */}
        <div style={{
          background: theme.palette.background.paper, borderRadius: 12,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, gap: 16, width: isMobile ? '100%' : '350px',
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCodeScannerIcon style={{ fontSize: 40, color: theme.palette.primary.main }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: theme.palette.text.primary }}>{t('checkin.sidebarTitle')}</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: theme.palette.text.secondary, lineHeight: 1.6 }}>{t('checkin.sidebarDesc')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
            {[
              { icon: '📷', label: t('checkin.badgeQrCode'), desc: t('checkin.kioskFeature') },
              { icon: '📍', label: t('checkin.badgeGps'), desc: t('checkin.gpsFeature') },
              { icon: '🕐', label: t('checkin.typeEntry'), desc: t('checkin.entryFeature') },
              { icon: '🔒', label: language === 'fr' ? 'Sécurisé' : 'Secure', desc: t('checkin.secureFeature') },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA', borderRadius: 10, padding: '12px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                <p style={{ margin: '0 0 4px', fontSize: 20 }}>{icon}</p>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: theme.palette.text.primary }}>{label}</p>
                <p style={{ margin: 0, fontSize: 11, color: theme.palette.text.secondary }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Scanner modal */}
      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}