import { useState, useEffect } from "react";
import api from "../api/axios";
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventNoteIcon from '@mui/icons-material/EventNote';

const today = new Date().toISOString().split("T")[0];

export default function AttendanceHistory() {
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(today);

  const userId = localStorage.getItem("userId");

  const fetchPointages = async (selectedDate) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/pointage?userId=${userId}&date=${selectedDate}`);
      setPointages(res.data);
    } catch {
      setError("Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointages(date);
  }, [date]);

  const entrees = pointages.filter((p) => p.type === "entree");
  const sorties = pointages.filter((p) => p.type === "sortie");
  const premEntree = entrees[0]?.heure || "--";
  const dernSortie = sorties[sorties.length - 1]?.heure || "--";

  const pageStyle = {
    marginLeft: '240px',
    padding: '40px',
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    padding: '24px',
    marginBottom: '24px',
  };

  return (
    <div className="page-container" style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a2340', margin: '0 0 8px 0' }}>
          Attendance History
        </h1>
        <p style={{ fontSize: '14px', color: '#7A8A99', margin: 0 }}>
          View your daily attendance logs
        </p>
      </div>

      <div style={{ maxWidth: 720 }}>
        {/* Date picker card */}
        <div style={{ ...cardStyle, padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '10px',
              background: '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarTodayIcon style={{ fontSize: 22, color: '#1976D2' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#7A8A99', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                Selected Date
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  color: '#1a2340',
                  background: '#F5F6FA',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {pointages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              {
                label: '1st Entry',
                value: premEntree,
                icon: <LoginIcon style={{ fontSize: 20, color: '#1976D2' }} />,
                bg: '#E3F2FD',
                valueColor: '#1565C0',
              },
              {
                label: 'Last Exit',
                value: dernSortie,
                icon: <LogoutIcon style={{ fontSize: 20, color: '#FF9500' }} />,
                bg: '#FFF8E1',
                valueColor: '#E65100',
              },
              {
                label: 'Total Logs',
                value: pointages.length,
                icon: <AccessTimeIcon style={{ fontSize: 20, color: '#4CAF50' }} />,
                bg: '#E8F5E9',
                valueColor: '#2E7D32',
              },
            ].map(({ label, value, icon, bg, valueColor }) => (
              <div key={label} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                padding: '20px 24px',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '8px',
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  {icon}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#7A8A99', fontWeight: '500' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: valueColor }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pointage list */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 120px 100px',
            padding: '12px 24px',
            background: '#F5F6FA',
            borderBottom: '2px solid #E8EAED',
          }}>
            {['Time', 'Type', 'GPS Position', 'Status'].map((h) => (
              <span key={h} style={{
                fontSize: '12px', fontWeight: '600',
                color: '#1a2340', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#7A8A99', fontWeight: '500' }}>
                Loading...
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: '#C62828', fontSize: '14px', fontWeight: '500', marginBottom: 16 }}>
                ⚠ {error}
              </p>
              <button
                onClick={() => fetchPointages(date)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px',
                  background: '#F5F6FA', border: '1px solid #E8EAED',
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', color: '#1a2340',
                }}
              >
                <RefreshIcon style={{ fontSize: 16 }} />
                Retry
              </button>
            </div>
          ) : pointages.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#F5F6FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <EventNoteIcon style={{ fontSize: 32, color: '#B0BEC5' }} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a2340', margin: '0 0 8px' }}>
                No logs recorded for this day
              </p>
              <p style={{ fontSize: '13px', color: '#7A8A99', margin: 0 }}>
                Select another date or complete a check-in/out.
              </p>
            </div>
          ) : (
            pointages.map((p, i) => {
              const isEntree = p.type === "entree";
              return (
                <div
                  key={p._id || i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 120px 100px',
                    padding: '16px 24px',
                    borderBottom: i < pointages.length - 1 ? '1px solid #E8EAED' : 'none',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Time */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 44, height: 44,
                      borderRadius: '10px',
                      background: isEntree ? '#E3F2FD' : '#FFF8E1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontSize: '13px', fontWeight: '700',
                        color: isEntree ? '#1565C0' : '#E65100',
                      }}>
                        {p.heure || "--"}
                      </span>
                    </div>
                  </div>

                  {/* Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px',
                      borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                      background: isEntree ? '#E3F2FD' : '#FFF8E1',
                      color: isEntree ? '#1565C0' : '#E65100',
                    }}>
                      {isEntree
                        ? <LoginIcon style={{ fontSize: 14 }} />
                        : <LogoutIcon style={{ fontSize: 14 }} />
                      }
                      {isEntree ? "Entry" : "Exit"}
                    </span>
                  </div>

                  {/* GPS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LocationOnIcon style={{ fontSize: 14, color: '#7A8A99' }} />
                    <span style={{ fontSize: '12px', color: '#7A8A99' }}>
                      {p.latitude?.toFixed(3)}, {p.longitude?.toFixed(3)}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px',
                      borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: p.valide ? '#E8F5E9' : '#FFEBEE',
                      color: p.valide ? '#2E7D32' : '#C62828',
                    }}>
                      {p.valide
                        ? <CheckCircleIcon style={{ fontSize: 13 }} />
                        : <CancelIcon style={{ fontSize: 13 }} />
                      }
                      {p.valide ? "Valid" : "Invalid"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
