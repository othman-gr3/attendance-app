import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SecurityIcon from '@mui/icons-material/Security';

export default function QRCodeDisplay() {
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const clockRef = useRef(null);

  const fetchQRCode = async () => {
    try {
      const res = await api.get("/pointage/qr");
      setQrData(res.data);
      setTimeLeft(30);
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Failed to load QR Code");
    }
  };

  useEffect(() => {
    fetchQRCode();
    intervalRef.current = setInterval(fetchQRCode, 30000);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          fetchQRCode();
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      clearInterval(clockRef.current);
    };
  }, []);

  const formatTime = (s) => {
    return `${s}s`;
  };

  const progress = (timeLeft / 30) * 100;
  const isExpiringSoon = timeLeft < 8;

  const timeString = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = currentTime.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '20px 24px',
    border: '1px solid #E8EAED',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  return (
    <div className="page-container" style={pageStyle}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2340', margin: '0 0 4px' }}>Attendance Kiosk</h1>
          <p style={{ fontSize: 13, color: '#7A8A99', margin: 0 }}>Generate and display the dynamic attendance QR Code for employees</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#E8F5E9',
          color: '#2E7D32',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
          Kiosk Active
        </div>
      </div>

      {/* Main content — two columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, minHeight: 0 }}>

        {/* Left Column: QR Card */}
        <div style={{ ...cardStyle, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{
              fontSize: '32px', fontWeight: '800', margin: "0 0 4px",
              color: '#1a2340', letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {timeString}
            </h2>
            <p style={{
              fontSize: '14px', color: '#7A8A99', margin: 0,
              textTransform: 'capitalize', fontWeight: 500,
            }}>
              {dateString}
            </p>
          </div>

          {error ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#FFEBEE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <WarningAmberIcon style={{ fontSize: 32, color: '#C62828' }} />
              </div>
              <p style={{ color: '#C62828', fontSize: '14px', fontWeight: '600', margin: "0 0 16px" }}>{error}</p>
              <button onClick={fetchQRCode} style={{
                padding: "10px 20px", borderRadius: "8px",
                background: "#1976D2", color: "white",
                border: "none", cursor: "pointer", fontSize: '14px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
                boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
              }}>
                <RefreshIcon style={{ fontSize: 18 }} />
                Retry
              </button>
            </div>
          ) : qrData ? (
            <>
              {/* QR Image Display */}
              <div style={{
                background: "#FFFFFF",
                padding: 16,
                borderRadius: "16px",
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                position: 'relative',
                border: '1px solid #E8EAED',
              }}>
                {/* Corner markers overlay style */}
                {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
                  <div key={corner} style={{
                    position: 'absolute',
                    width: 16, height: 16,
                    borderColor: '#1976D2',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    ...(corner === 'topLeft' && { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: '6px 0 0 0' }),
                    ...(corner === 'topRight' && { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderRadius: '0 6px 0 0' }),
                    ...(corner === 'bottomLeft' && { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: '0 0 0 6px' }),
                    ...(corner === 'bottomRight' && { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: '0 0 6px 0' }),
                  }} />
                ))}
                <img
                  src={qrData.image}
                  alt="Attendance QR Code"
                  width={220}
                  height={220}
                  style={{ display: "block", borderRadius: 8 }}
                />
              </div>

              {/* Progress and instructions */}
              <div style={{ width: "100%", maxWidth: 360 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AccessTimeIcon style={{ fontSize: 16, color: '#7A8A99' }} />
                    <span style={{ fontSize: '13px', color: '#7A8A99', fontWeight: 500 }}>
                      Code rotation in:
                    </span>
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: '700',
                    color: isExpiringSoon ? '#C62828' : '#2E7D32',
                    fontVariantNumeric: 'tabular-nums',
                    background: isExpiringSoon ? '#FFEBEE' : '#E8F5E9',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: 6, background: "#E8EAED",
                  borderRadius: 3, overflow: "hidden", marginBottom: 16
                }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: isExpiringSoon
                      ? 'linear-gradient(90deg, #D32F2F, #FF5252)'
                      : 'linear-gradient(90deg, #1976D2, #42A5F5)',
                    borderRadius: 3,
                    transition: "width 1s linear, background 0.3s",
                  }} />
                </div>

                {/* Refresh button */}
                <button
                  onClick={fetchQRCode}
                  style={{
                    width: "100%", padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid #E8EAED",
                    background: "#FAFBFC",
                    color: "#555555",
                    fontSize: '13px', fontWeight: '600', cursor: "pointer",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F3F5';
                    e.currentTarget.style.borderColor = '#CED4DA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFBFC';
                    e.currentTarget.style.borderColor = '#E8EAED';
                  }}
                >
                  <RefreshIcon style={{ fontSize: 16 }} />
                  Force Generation
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#F0F4F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                animation: 'spin 2s linear infinite',
              }}>
                <QrCode2Icon style={{ fontSize: 24, color: '#1976D2' }} />
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: '#7A8A99' }}>
                Loading QR Code...
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          
          {/* Instructions Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InfoIcon style={{ fontSize: 18, color: '#1976D2' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a2340' }}>How Kiosk Works</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: "Dynamic QR Code", desc: "The QR Code updates automatically to prevent spoofing or screenshot sharing." },
                { title: "Double Verification", desc: "To verify attendance, the employee must scan this code and be within the authorized location." },
                { title: "Mobile Application", desc: "The scan is performed from the 'Check In' page on the employee's mobile app." }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#F0F4F8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#1976D2', flexShrink: 0, marginTop: 2
                  }}>{idx + 1}</div>
                  <div>
                    <h4 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#1a2340' }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#7A8A99', lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Info Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GpsFixedIcon style={{ fontSize: 18, color: '#00796B' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a2340' }}>Authorized Geographical Zone</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#F8F9FA', borderRadius: 8, padding: 12, border: '1px solid #E8EAED' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#7A8A99' }}>Coordinates (Test)</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2340' }}>Casablanca</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#7A8A99' }}>Latitude</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2340', fontVariantNumeric: 'tabular-nums' }}>33.587422</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#7A8A99' }}>Longitude</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2340', fontVariantNumeric: 'tabular-nums' }}>-7.581844</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E0F2F1', color: '#00796B', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                <SecurityIcon style={{ fontSize: 16 }} />
                <span>Maximum validation radius: <strong>200 meters</strong> around the point.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CSS keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}