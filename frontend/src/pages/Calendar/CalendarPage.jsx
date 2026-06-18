import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

const DAY_STYLES = {
  present: { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', label: 'Present' },
  absent:  { bg: '#FFEBEE', color: '#C62828', border: '#FFCDD2', label: 'Absent' },
  invalid: { bg: '#FFF8E1', color: '#E65100', border: '#FFE082', label: 'Invalid' },
  weekend: { bg: '#F5F6FA', color: '#B0BEC5', border: '#E8EAED', label: 'Weekend' },
  future:  { bg: '#FAFBFC', color: '#CFD8DC', border: '#ECEFF1', label: 'Upcoming' },
};

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [pointagesMap, setPointagesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => { fetchData(); setSelectedDay(null); }, [year, month]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pointage?userId=${userId}`);
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const map = {};
      (res.data || []).forEach(p => {
        if (p.date?.startsWith(monthStr)) {
          if (!map[p.date]) map[p.date] = [];
          map[p.date].push(p);
        }
      });
      setPointagesMap(map);
    } catch { setPointagesMap({}); }
    finally { setLoading(false); }
  };

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const getDayKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const getDayStatus = (dk) => {
    const dow = new Date(dk).getDay();
    if (dow === 0 || dow === 6) return 'weekend';
    if (dk > today) return 'future';
    const pts = pointagesMap[dk];
    if (!pts?.length) return 'absent';
    return pts.some(p => p.type === 'entree' && p.valide) ? 'present' : 'invalid';
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const isNextDisabled = `${year}-${String(month+1).padStart(2,'0')}` >= `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const presentCount = Object.keys(pointagesMap).filter(d => getDayStatus(d) === 'present').length;
  const workdaysPassed = (() => {
    let c = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = getDayKey(d);
      if (dk > today) break;
      const dow = new Date(dk).getDay();
      if (dow !== 0 && dow !== 6) c++;
    }
    return c;
  })();
  const absentCount = Math.max(0, workdaysPassed - presentCount);

  const selectedKey = selectedDay ? getDayKey(selectedDay) : null;
  const selectedPts = selectedKey ? (pointagesMap[selectedKey] || []) : [];
  const selectedStatus = selectedKey ? getDayStatus(selectedKey) : null;

  const cardStyle = { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 18 };

  return (
    <div className="page-container" style={{
      marginLeft: 240, height: '100vh', overflow: 'hidden',
      backgroundColor: '#F5F6FA', fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '28px 32px', boxSizing: 'border-box', gap: 14,
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2340', margin: '0 0 4px' }}>Attendance Calendar</h1>
        <p style={{ fontSize: 13, color: '#7A8A99', margin: 0 }}>Monthly view of your check-ins and absences</p>
      </div>

      {/* Two-column */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 250px', gap: 16, minHeight: 0 }}>

        {/* Left: calendar + detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
              <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E8EAED', background: '#F5F6FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#1976D2'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <ChevronLeftIcon style={{ fontSize: 18 }} />
              </button>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a2340' }}>{MONTHS_EN[month]} {year}</h2>
              <button onClick={nextMonth} disabled={isNextDisabled}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E8EAED', background: '#F5F6FA', cursor: isNextDisabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isNextDisabled ? 0.4 : 1 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = '#1976D2'; }}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <ChevronRightIcon style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 5, flexShrink: 0 }}>
              {DAYS_EN.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: d === 'Sat' || d === 'Sun' ? '#B0BEC5' : '#7A8A99', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#7A8A99', fontSize: 13 }}>Loading...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, flex: 1, alignContent: 'start' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dk = getDayKey(day);
                  const status = getDayStatus(dk);
                  const st = DAY_STYLES[status];
                  const isToday = dk === today;
                  const isSel = selectedDay === day;
                  return (
                    <button key={day}
                      onClick={() => status !== 'future' && setSelectedDay(day === selectedDay ? null : day)}
                      style={{
                        minHeight: 36, borderRadius: 8, border: isSel ? '2px solid #1976D2' : isToday ? `2px solid ${st.border}` : `1px solid ${st.border}`,
                        background: isSel ? '#E3F2FD' : st.bg, color: isSel ? '#1565C0' : st.color,
                        fontWeight: isToday || isSel ? 800 : 600, fontSize: 12,
                        cursor: status === 'future' ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', transition: 'all 0.15s', outline: 'none',
                        boxShadow: isSel ? '0 0 0 3px rgba(25,118,210,0.15)' : 'none',
                      }}>
                      {day}
                      {(status === 'present' || status === 'invalid') && (
                        <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: status === 'present' ? '#2E7D32' : '#E65100' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day detail */}
          {selectedDay && selectedStatus && selectedStatus !== 'future' && (
            <div style={{ ...cardStyle, borderLeft: `4px solid ${DAY_STYLES[selectedStatus]?.border}`, flexShrink: 0, padding: '14px 18px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#1a2340' }}>
                {selectedDay} {MONTHS_EN[month]} {year}
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: DAY_STYLES[selectedStatus]?.bg, color: DAY_STYLES[selectedStatus]?.color }}>
                  {DAY_STYLES[selectedStatus]?.label}
                </span>
              </p>
              {selectedPts.length === 0 ? (
                <p style={{ color: '#7A8A99', fontSize: 12, margin: 0 }}>{selectedStatus === 'weekend' ? 'Rest day.' : 'No logs recorded for this day.'}</p>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedPts.sort((a, b) => (a.heure || '').localeCompare(b.heure || '')).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: p.type === 'entree' ? '#E3F2FD' : '#FFF8E1', border: `1px solid ${p.type === 'entree' ? '#90CAF9' : '#FFE082'}` }}>
                      {p.type === 'entree' ? <LoginIcon style={{ fontSize: 13, color: '#1565C0' }} /> : <LogoutIcon style={{ fontSize: 13, color: '#E65100' }} />}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2340' }}>{p.heure || '--'}</span>
                      <span style={{ fontSize: 11 }}>{p.valide ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: stats + legend + tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={cardStyle}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1a2340' }}>This Month — {MONTHS_EN[month]}</p>
            {[
              { label: 'Present', value: presentCount, color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
              { label: 'Absent', value: absentCount, color: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
              { label: 'Working Days', value: workdaysPassed, color: '#1565C0', bg: '#E3F2FD', border: '#90CAF9' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: bg, border: `1px solid ${border}`, marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color }}>{label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1a2340' }}>Legend</p>
            {(['present','absent','invalid','weekend','future']).map(status => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: DAY_STYLES[status].bg, border: `1.5px solid ${DAY_STYLES[status].border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>{DAY_STYLES[status].label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#F5F6FA', borderRadius: 12, border: '1px solid #E8EAED', padding: '12px 16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#1a2340' }}>💡 Tip</p>
            <p style={{ margin: 0, fontSize: 11, color: '#7A8A99', lineHeight: 1.7 }}>
              Click on a day to view its detailed check-in logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
