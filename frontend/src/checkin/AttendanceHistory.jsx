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
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "@mui/material";

const today = new Date().toISOString().split("T")[0];

export default function AttendanceHistory() {
  const { t } = useLanguage();
  const theme = useTheme();
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(today);

  const userId = localStorage.getItem("userId");

  const fetchPointages = async (selectedDate, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await api.get(`/pointage?userId=${userId}&date=${selectedDate}`);
      setPointages(res.data);
    } catch {
      if (!silent) {
        setError(t('history.errorLoad'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPointages(date);
  }, [date]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPointages(date, true);
    }, 30000); // 30 seconds auto-refresh
    return () => clearInterval(interval);
  }, [date]);

  const entrees = pointages.filter((p) => p.type === "entree");
  const sorties = pointages.filter((p) => p.type === "sortie");
  const premEntree = entrees[0]?.heure || "--";
  const dernSortie = sorties[sorties.length - 1]?.heure || "--";

  const pageStyle = {
    marginLeft: '240px',
    padding: '40px',
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  };

  const cardStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: '12px',
    boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
    padding: '24px',
    marginBottom: '24px',
  };

  return (
    <div className="page-container" style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.palette.text.primary, margin: '0 0 8px 0' }}>
          {t('history.title')}
        </h1>
        <p style={{ fontSize: '14px', color: theme.palette.text.secondary, margin: 0 }}>
          {t('history.subtitle')}
        </p>
      </div>

      <div style={{ maxWidth: 720 }}>
        {/* Date picker card */}
        <div style={{ ...cardStyle, padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '10px',
              background: theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarTodayIcon style={{ fontSize: 22, color: theme.palette.primary.main }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                {t('history.selectedDateLabel')}
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  color: theme.palette.text.primary,
                  background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA',
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
                label: t('history.stat1stEntry'),
                value: premEntree,
                icon: <LoginIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1976D2' }} />,
                bg: theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD',
                valueColor: theme.palette.mode === 'dark' ? '#60A5FA' : '#1565C0',
              },
              {
                label: t('history.statLastExit'),
                value: dernSortie,
                icon: <LogoutIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#FBBF24' : '#FF9500' }} />,
                bg: theme.palette.mode === 'dark' ? '#451A03' : '#FFF8E1',
                valueColor: theme.palette.mode === 'dark' ? '#FBBF24' : '#E65100',
              },
              {
                label: t('history.statTotalLogs'),
                value: pointages.length,
                icon: <AccessTimeIcon style={{ fontSize: 20, color: theme.palette.mode === 'dark' ? '#34D399' : '#4CAF50' }} />,
                bg: theme.palette.mode === 'dark' ? '#064E3B' : '#E8F5E9',
                valueColor: theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32',
              },
            ].map(({ label, value, icon, bg, valueColor }) => (
              <div key={label} style={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: '12px',
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
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
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: theme.palette.text.secondary, fontWeight: '500' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: valueColor }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pointage list */}
        <div style={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 120px 100px',
            padding: '12px 24px',
            background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA',
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}>
            {[t('history.colTime'), t('history.colType'), t('history.colGps'), t('history.colStatus')].map((h) => (
              <span key={h} style={{
                fontSize: '12px', fontWeight: '600',
                color: theme.palette.text.primary, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: theme.palette.text.secondary, fontWeight: '500' }}>
                {t('history.loading')}
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: theme.palette.error.main, fontSize: '14px', fontWeight: '500', marginBottom: 16 }}>
                ⚠ {error}
              </p>
              <button
                onClick={() => fetchPointages(date)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px',
                  background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA', border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', color: theme.palette.text.primary,
                }}
              >
                <RefreshIcon style={{ fontSize: 16 }} />
                {t('history.btnRetry')}
              </button>
            </div>
          ) : pointages.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: theme.palette.mode === 'dark' ? '#1E293B' : '#F5F6FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <EventNoteIcon style={{ fontSize: 32, color: theme.palette.text.secondary }} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: theme.palette.text.primary, margin: '0 0 8px' }}>
                {t('history.noLogsTitle')}
              </p>
              <p style={{ fontSize: '13px', color: theme.palette.text.secondary, margin: 0 }}>
                {t('history.noLogsDesc')}
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
                    borderBottom: i < pointages.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.palette.mode === 'dark' ? '#1E293B' : '#FAFBFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Time */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 44, height: 44,
                      borderRadius: '10px',
                      background: isEntree ? (theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD') : (theme.palette.mode === 'dark' ? '#451A03' : '#FFF8E1'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontSize: '13px', fontWeight: '700',
                        color: isEntree ? (theme.palette.mode === 'dark' ? '#60A5FA' : '#1565C0') : (theme.palette.mode === 'dark' ? '#FBBF24' : '#E65100'),
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
                      background: isEntree ? (theme.palette.mode === 'dark' ? '#1E3A8A' : '#E3F2FD') : (theme.palette.mode === 'dark' ? '#451A03' : '#FFF8E1'),
                      color: isEntree ? (theme.palette.mode === 'dark' ? '#60A5FA' : '#1565C0') : (theme.palette.mode === 'dark' ? '#FBBF24' : '#E65100'),
                    }}>
                      {isEntree
                        ? <LoginIcon style={{ fontSize: 14 }} />
                        : <LogoutIcon style={{ fontSize: 14 }} />
                      }
                      {isEntree ? t('history.typeEntry') : t('history.typeExit')}
                    </span>
                  </div>

                  {/* GPS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LocationOnIcon style={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    <span style={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                      {p.latitude?.toFixed(3)}, {p.longitude?.toFixed(3)}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px',
                      borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: p.valide ? (theme.palette.mode === 'dark' ? '#064E3B' : '#E8F5E9') : (theme.palette.mode === 'dark' ? '#7F1D1D' : '#FFEBEE'),
                      color: p.valide ? (theme.palette.mode === 'dark' ? '#34D399' : '#2E7D32') : (theme.palette.mode === 'dark' ? '#F87171' : '#C62828'),
                    }}>
                      {p.valide
                        ? <CheckCircleIcon style={{ fontSize: 13 }} />
                        : <CancelIcon style={{ fontSize: 13 }} />
                      }
                      {p.valide ? t('history.statusValid') : t('history.statusInvalid')}
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
