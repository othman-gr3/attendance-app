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
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pointageType, setPointageType] = useState("entree");
  const [monthStats, setMonthStats] = useState(null);
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
      setLocationError("Geolocation not supported.");
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setLocationError("Access denied. Please enable geolocation.");
        setGettingLocation(false);
      }
    );
  };

  const handleQRScan = async (qrCode) => {
    setShowScanner(false);
    if (!location) {
      setStatus(STATUS.ERROR);
      setErrorMsg("GPS position not available.");
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
      setErrorMsg(err.response?.data?.message || "Error during check-in/out.");
    }
  };

  const reset = () => {
    setStatus(STATUS.IDLE);
    setResult(null);
    setErrorMsg("");
  };

  const pageStyle = {
    marginLeft: '240px',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#F5F6FA',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 32px',
    boxSizing: 'border-box',
    gap: 16,
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    padding: '20px 24px',
    marginBottom: '12px',
  };


  return (
    <div className="page-container" style={pageStyle}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2340', margin: '0 0 4px' }}>Check In / Out</h1>
          <p style={{ fontSize: 13, color: '#7A8A99', margin: 0 }}>Record your check-in or check-out via QR Code</p>
        </div>
        <button
          onClick={toggleRules}
          style={{
            background: 'none', border: 'none', color: '#1976D2', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <InfoIcon style={{ fontSize: '16px' }} /> {showRules ? "Hide rules" : "Show rules"}
        </button>
      </div>

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
            <WarningIcon style={{ fontSize: '16px' }} /> Active check-in rules:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li><strong>Check-in:</strong> Allowed only from <strong>07:00 AM to 11:30 AM</strong>.</li>
            <li><strong>Check-out:</strong> Allowed only from <strong>04:00 PM onwards</strong>.</li>
            <li><strong>Uniqueness:</strong> Maximum of 1 valid check-in and 1 valid check-out per day.</li>
            <li><strong>GPS & QR:</strong> You must scan the physical QR Kiosk and be located within 200m of the office.</li>
          </ul>
        </div>
      )}

      {/* Quick stats row */}
      {monthStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, flexShrink: 0 }}>
          {[
            { label: 'This Month — Present', value: monthStats.present, icon: <EventAvailableIcon style={{ fontSize: 20, color: '#2E7D32' }} />, iconBg: '#C8E6C9', color: '#2E7D32' },
            { label: 'Absent', value: monthStats.absent, icon: <EventBusyIcon style={{ fontSize: 20, color: '#C62828' }} />, iconBg: '#FFCDD2', color: '#C62828' },
            { label: 'Working Days', value: monthStats.workdays, icon: <TrendingUpIcon style={{ fontSize: 20, color: '#1565C0' }} />, iconBg: '#BBDEFB', color: '#1565C0' },
          ].map(({ label, value, icon, iconBg, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 700, color: '#7A8A99', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content — two columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>

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
              background: result.valide ? '#E8F5E9' : '#FFEBEE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              {result.valide
                ? <CheckCircleOutlineIcon style={{ fontSize: 40, color: '#4CAF50' }} />
                : <ErrorOutlineIcon style={{ fontSize: 40, color: '#F44336' }} />
              }
            </div>

            {result.valide ? (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#1a2340' }}>
                  Hello, {result.nom}!
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#4CAF50', fontWeight: '600' }}>
                  {pointageType === "entree" ? "Entry" : "Exit"} registered at {result.heure}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#C62828' }}>
                  Check-in Denied
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#7A8A99' }}>
                  {!result.qrValide && "Invalid QR Code. "}
                  {!result.gpsValide && "You are not within the authorized zone."}
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
              {[
                { label: 'QR Code', ok: result.qrValide },
                { label: 'GPS', ok: result.gpsValide },
              ].map(({ label, ok }) => (
                <span key={label} style={{
                  fontSize: '12px', padding: '6px 16px',
                  borderRadius: '20px', fontWeight: '600',
                  background: ok ? '#E8F5E9' : '#FFEBEE',
                  color: ok ? '#2E7D32' : '#C62828',
                  border: `1px solid ${ok ? '#A5D6A7' : '#EF9A9A'}`,
                }}>
                  {label} {ok ? '✓' : '✗'}
                </span>
              ))}
            </div>

            <button
              onClick={reset}
              style={{
                padding: '12px 32px',
                background: result.valide ? '#1976D2' : '#F5F6FA',
                color: result.valide ? '#FFFFFF' : '#1a2340',
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              New check-in/out
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === STATUS.ERROR && (
          <div style={{
            ...cardStyle,
            border: '2px solid #F44336',
            textAlign: 'center',
            padding: '40px 32px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#FFEBEE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <ErrorOutlineIcon style={{ fontSize: 36, color: '#F44336' }} />
            </div>
            <p style={{ margin: '0 0 20px', fontWeight: '600', color: '#C62828', fontSize: '15px' }}>{errorMsg}</p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px', background: '#F44336', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* IDLE */}
        {status === STATUS.IDLE && (
          <>
            {/* Type selector */}
            <div style={cardStyle}>
              <p style={{
                fontSize: '12px', fontWeight: '600', color: '#7A8A99',
                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px',
              }}>
                Check-in Type
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { value: "entree", label: "Entry", icon: <LoginIcon style={{ fontSize: 20 }} /> },
                  { value: "sortie", label: "Exit", icon: <LogoutIcon style={{ fontSize: 20 }} /> },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setPointageType(value)}
                    style={{
                      flex: 1, padding: '14px 16px',
                      borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      border: pointageType === value ? '2px solid #1976D2' : '1.5px solid #E8EAED',
                      background: pointageType === value ? '#E3F2FD' : '#F5F6FA',
                      color: pointageType === value ? '#1976D2' : '#7A8A99',
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
                  background: location ? '#E8F5E9' : locationError ? '#FFEBEE' : '#F5F6FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MyLocationIcon style={{
                    fontSize: 22,
                    color: location ? '#4CAF50' : locationError ? '#F44336' : '#7A8A99',
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1a2340' }}>
                    Geolocation
                  </p>
                  <p style={{
                    margin: 0, fontSize: '12px',
                    color: location ? '#2E7D32' : locationError ? '#C62828' : '#7A8A99',
                  }}>
                    {gettingLocation ? "Locating..."
                      : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : locationError || "Not available"}
                  </p>
                </div>
              </div>
              {!location && !gettingLocation && (
                <button
                  onClick={getLocation}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: '#F5F6FA', border: '1px solid #E8EAED',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', color: '#1a2340',
                  }}
                >
                  <RefreshIcon style={{ fontSize: 16 }} />
                  Retry
                </button>
              )}
            </div>

            {/* Scan button */}
            <button
              onClick={() => {
                if (!isTimeValid()) {
                  setStatus(STATUS.ERROR);
                  setErrorMsg(pointageType === 'entree' 
                    ? "Check-in is allowed only from 07:00 AM to 11:30 AM." 
                    : "Check-out is allowed only after 04:00 PM.");
                  return;
                }
                setShowScanner(true);
              }}
              disabled={!location || gettingLocation}
              style={{
                width: '100%', padding: '18px',
                background: (!location || gettingLocation) 
                  ? '#E8EAED' 
                  : !isTimeValid()
                    ? '#FFA726'
                    : 'linear-gradient(135deg, #1565C0, #1976D2)',
                color: (!location || gettingLocation) ? '#9E9E9E' : '#FFFFFF',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700',
                cursor: (location && !gettingLocation) ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: (location && !gettingLocation) ? '0 4px 14px rgba(25, 118, 210, 0.35)' : 'none',
                transition: 'all 0.2s',
                marginBottom: '16px',
              }}
            >
              <QrCodeScannerIcon style={{ fontSize: 22 }} />
              {gettingLocation 
                ? "Locating..." 
                : !location 
                  ? "GPS Required" 
                  : !isTimeValid() 
                    ? (pointageType === 'entree' ? "Entry Closed (07:00 - 11:30)" : "Exit Closed (From 16:00)")
                    : "Scan QR Code"}
            </button>

            {/* History link */}
            <button
              onClick={() => navigate("/history")}
              style={{
                width: '100%', padding: '14px',
                background: '#FFFFFF', border: '1.5px solid #E8EAED',
                borderRadius: '12px', fontSize: '14px',
                fontWeight: '600', color: '#7A8A99', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1976D2';
                e.currentTarget.style.color = '#1976D2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8EAED';
                e.currentTarget.style.color = '#7A8A99';
              }}
            >
              <HistoryIcon style={{ fontSize: 18 }} />
              View my history
            </button>
          </>
        )}

        {/* LOADING */}
        {status === STATUS.LOADING && (
          <div style={{ background: '#fff', padding: '60px 32px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <QrCodeScannerIcon style={{ fontSize: 28, color: '#1976D2' }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a2340', margin: '0 0 8px' }}>
              Verification in progress
            </p>
            <p style={{ fontSize: '13px', color: '#7A8A99', margin: 0 }}>
              Validating QR Code and your location...
            </p>
          </div>
        )}
        </div>

        {/* Right: empty decorative panel */}
        <div style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, gap: 16, width: '350px',
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCodeScannerIcon style={{ fontSize: 40, color: '#1976D2' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1a2340' }}>Check-in System</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#7A8A99', lineHeight: 1.6 }}>Scan the QR Code displayed on the physical office kiosk to register your presence.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
            {[
              { icon: '📷', label: 'QR Code', desc: 'Physical kiosk' },
              { icon: '📍', label: 'GPS', desc: 'Authorized zone' },
              { icon: '🕐', label: 'Entry', desc: 'Before 09:00 AM' },
              { icon: '🔒', label: 'Secure', desc: 'JWT Encrypted' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: '#F5F6FA', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #E8EAED' }}>
                <p style={{ margin: '0 0 4px', fontSize: 20 }}>{icon}</p>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: '#1a2340' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#7A8A99' }}>{desc}</p>
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