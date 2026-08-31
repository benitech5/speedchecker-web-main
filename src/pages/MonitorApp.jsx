import { useCallback, useEffect, useRef, useState } from 'react';
import warningSoundUrl from '../../assets/audio/warning.mp3';

const PINK = '#ff2d55';

function WelcomeScreen({ onContinue }) {
  return (
    <main className="welcome page dark-page">
      <div className="brand-mark" aria-hidden="true"><span>↗</span></div>
      <section className="welcome-copy">
        <p className="eyebrow">SAFER JOURNEYS START HERE</p>
        <h1>Welcome to <strong>SmartStart</strong></h1>
        <p className="lead">Your live speed companion for calmer, safer driving.</p>
      </section>
      <section className="notice-card">
        <span className="notice-icon" aria-hidden="true">i</span>
        <div>
          <h2>Before you begin</h2>
          <p>SmartStart uses your device’s GPS to estimate vehicle speed and detect overspeeding. GPS readings can vary, so never rely on this app instead of your vehicle’s speedometer.</p>
          <a href="https://www.example.com/more-info" target="_blank" rel="noreferrer">Read more about safe use <span>↗</span></a>
        </div>
      </section>
      <button className="primary-button welcome-button" onClick={onContinue}>Continue <span>→</span></button>
      <p className="permission-hint"><span>⌖</span> Location permission will be requested when checking begins</p>
    </main>
  );
}

function SetupScreen({ onStart, onBack }) {
  const [driverName, setDriverName] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [driverSex, setDriverSex] = useState('');
  const [mode, setMode] = useState('default');
  const [speedLimit, setSpeedLimit] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!driverName.trim() || !carNumber.trim()) {
      setError('Please enter both the driver name and vehicle number.');
      return;
    }
    const limit = mode === 'default' ? 80 : Number(speedLimit);
    if (mode === 'personalized' && (!limit || limit < 1 || limit > 160)) {
      setError('Enter a speed limit between 1 and 160 km/h.');
      return;
    }
    onStart({ driverName: driverName.trim(), carNumber: carNumber.trim(), driverSex, speedLimit: limit });
  };

  return (
    <main className="setup page dark-page">
      <header className="topbar">
        <button className="icon-button" onClick={onBack} aria-label="Go back">←</button>
        <div className="mini-brand"><span className="mini-mark">↗</span><span>SmartStart</span></div>
        <span className="step">SETUP</span>
      </header>
      <section className="setup-heading">
        <p className="eyebrow">DRIVER DETAILS</p>
        <h1>Ready when you are.</h1>
        <p>Tell us a little about this trip before starting the live speed check.</p>
      </section>
      <form className="setup-card" onSubmit={submit}>
        <div className="field-grid">
          <label><span>Driver name <b>*</b></span><input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="e.g. Alex Morgan" autoComplete="name" /></label>
          <label><span>Vehicle number <b>*</b></span><input value={carNumber} onChange={(e) => setCarNumber(e.target.value)} placeholder="e.g. AB12 CDE" /></label>
        </div>
        <label><span>Sex <small>OPTIONAL</small></span><select value={driverSex} onChange={(e) => setDriverSex(e.target.value)}><option value="">Prefer not to say</option><option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option></select></label>
        <fieldset>
          <legend>Speed mode</legend>
          <label className={`mode-option ${mode === 'default' ? 'selected' : ''}`}>
            <input type="radio" name="mode" checked={mode === 'default'} onChange={() => setMode('default')} />
            <span className="radio-dot"/><span><strong>Default</strong><small>Standard 80 km/h limit</small></span><em>RECOMMENDED</em>
          </label>
          <label className={`mode-option ${mode === 'personalized' ? 'selected' : ''}`}>
            <input type="radio" name="mode" checked={mode === 'personalized'} onChange={() => setMode('personalized')} />
            <span className="radio-dot"/><span><strong>Personalized</strong><small>Set a custom limit for testing</small></span>
          </label>
        </fieldset>
        {mode === 'personalized' && <label><span>Custom speed limit</span><div className="unit-input"><input type="number" min="1" max="160" value={speedLimit} onChange={(e) => setSpeedLimit(e.target.value)} placeholder="80"/><span>km/h</span></div></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Start speed check <span>→</span></button>
        <p className="legal">Only use SmartStart when your device is safely mounted. Do not interact with it while driving.</p>
      </form>
    </main>
  );
}

const toRadians = (degrees) => (degrees * Math.PI) / 180;
function distanceInKm(a, b) {
  const earthRadius = 6371;
  const lat = toRadians(b.latitude - a.latitude);
  const lon = toRadians(b.longitude - a.longitude);
  const value = Math.sin(lat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(lon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function CheckerScreen({ trip, onExit }) {
  const [status, setStatus] = useState('requesting');
  const [message, setMessage] = useState('Requesting location permission…');
  const [seconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [overspeed, setOverspeed] = useState(false);
  const [logs, setLogs] = useState([]);
  const [ended, setEnded] = useState(false);
  const previousRef = useRef(null);
  const latestReadingRef = useRef(null);
  const watchRef = useRef(null);
  const logTimerRef = useRef(null);
  const audioRef = useRef(null);
  const startRef = useRef(Date.now());

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(warningSoundUrl);
    audioRef.current.loop = true;
    return stopAudio;
  }, [stopAudio]);

  useEffect(() => {
    if (ended) return undefined;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [ended]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error'); setMessage('Geolocation is not supported by this browser.'); return undefined;
    }
    watchRef.current = navigator.geolocation.watchPosition((position) => {
      const current = { latitude: position.coords.latitude, longitude: position.coords.longitude, timestamp: position.timestamp };
      setStatus('active'); setMessage('GPS connected');
      const travelled = previousRef.current ? distanceInKm(previousRef.current, current) : 0;
      const elapsedHours = previousRef.current
        ? Math.max((current.timestamp - previousRef.current.timestamp) / 3600000, 1 / 3600000)
        : 0;
      const calculated = position.coords.speed != null && position.coords.speed >= 0
        ? position.coords.speed * 3.6
        : elapsedHours > 0 ? travelled / elapsedHours : 0;
      const safeSpeed = Number.isFinite(calculated) && calculated < 400 ? calculated : 0;
      const isOver = safeSpeed > trip.speedLimit;
      latestReadingRef.current = { distance: travelled, speed: safeSpeed, overspeed: isOver };
      setDistance(travelled); setSpeed(safeSpeed); setOverspeed(isOver);
      if (logTimerRef.current == null) {
        logTimerRef.current = window.setInterval(() => {
          const reading = latestReadingRef.current;
          if (!reading) return;
          setLogs((items) => [...items, {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            ...reading,
          }]);
        }, 10000);
      }
      if (isOver && travelled > 0.005) audioRef.current?.play().catch(() => {}); else stopAudio();
      previousRef.current = current;
    }, (error) => {
      setStatus('error');
      setMessage(error.code === 1 ? 'Location permission was denied. Enable it in your browser settings.' : 'Unable to get a reliable GPS position.');
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      if (logTimerRef.current != null) {
        window.clearInterval(logTimerRef.current);
        logTimerRef.current = null;
      }
      stopAudio();
    };
  }, [trip.speedLimit, stopAudio]);

  const endSession = () => {
    if (!window.confirm('Are you sure you want to end the session?')) return;
    setEnded(true); setStatus('ended'); setMessage('Session ended'); stopAudio();
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    if (logTimerRef.current != null) {
      window.clearInterval(logTimerRef.current);
      logTimerRef.current = null;
    }
  };

  const downloadLogs = () => {
    const rows = logs.map((log) => `<tr><td>${log.time}</td><td>${log.distance.toFixed(3)}</td><td>${log.speed.toFixed(1)}</td><td>${log.overspeed ? 'Yes' : 'No'}</td></tr>`).join('');
    const report = `<!doctype html><html><head><title>SmartStart Speed Logs</title><style>body{font-family:Arial;padding:32px;color:#18181b}h1{color:${PINK}}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #ddd;text-align:left}@media print{button{display:none}}</style></head><body><h1>SmartStart Speed Logs</h1><p><b>Driver:</b> ${trip.driverName}</p><p><b>Vehicle:</b> ${trip.carNumber}</p><p><b>Sex:</b> ${trip.driverSex || 'Not specified'}</p><p><b>Speed limit:</b> ${trip.speedLimit} km/h</p><table><thead><tr><th>Time</th><th>Distance (km)</th><th>Speed (km/h)</th><th>Overspeed</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No readings recorded</td></tr>'}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { window.alert('Allow pop-ups to download or print the report.'); return; }
    printWindow.document.write(report); printWindow.document.close();
  };

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <main className="checker page">
      <header className="checker-header"><div className="mini-brand"><span className="mini-mark">↗</span><span>SmartStart</span></div><span className={`status ${status}`}>● {message}</span></header>
      <section className="dashboard">
        <div className="trip-summary"><div><p>DRIVER</p><strong>{trip.driverName}</strong></div><div><p>VEHICLE</p><strong>{trip.carNumber}</strong></div><div><p>LIMIT</p><strong>{trip.speedLimit} km/h</strong></div><div><p>SESSION</p><strong>{timer}</strong></div></div>
        <section className={`speed-panel ${overspeed ? 'over' : ''}`}>
          <p>{ended ? 'FINAL SPEED' : 'CURRENT SPEED'}</p><div className="speed-value"><strong>{Math.round(speed)}</strong><span>km/h</span></div>
          <div className="limit-line"><span>{overspeed ? 'Speed limit exceeded' : ended ? 'Session complete' : 'Within speed limit'}</span><strong>Limit {trip.speedLimit}</strong></div>
        </section>
        <div className="metrics"><div><span className="metric-icon">↔</span><p>LAST DISTANCE</p><strong>{distance.toFixed(3)} <small>km</small></strong></div><div><span className="metric-icon">◎</span><p>STATUS</p><strong className={overspeed ? 'danger-text' : 'safe-text'}>{overspeed ? 'Overspeeding' : 'Safe speed'}</strong></div><div><span className="metric-icon">≡</span><p>READINGS</p><strong>{logs.length}</strong></div></div>
        <section className="logs-card"><div className="logs-heading"><div><p className="eyebrow">TRIP DATA</p><h2>Speed logs</h2></div><span>Updates every 10 seconds</span></div><div className="table-wrap"><table><thead><tr><th>Time</th><th>Distance</th><th>Speed</th><th>Status</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan="4" className="empty">Waiting for the first GPS readings…</td></tr> : logs.slice().reverse().map((log, index) => <tr key={`${log.time}-${index}`}><td>{log.time}</td><td>{log.distance.toFixed(3)} km</td><td>{log.speed.toFixed(1)} km/h</td><td><span className={`pill ${log.overspeed ? 'danger' : 'safe'}`}>{log.overspeed ? 'Overspeed' : 'Safe'}</span></td></tr>)}</tbody></table></div></section>
        <div className="checker-actions">{ended ? <><button className="primary-button" onClick={downloadLogs}>Print / save speed logs</button><button className="secondary-button" onClick={onExit}>Start new session</button></> : <button className="end-button" onClick={endSession}>■ End session</button>}</div>
      </section>
    </main>
  );
}

export default function MonitorApp() {
  const [screen, setScreen] = useState('welcome');
  const [trip, setTrip] = useState(null);
  if (screen === 'welcome') return <WelcomeScreen onContinue={() => setScreen('setup')} />;
  if (screen === 'setup') return <SetupScreen onBack={() => setScreen('welcome')} onStart={(details) => { setTrip(details); setScreen('checker'); }} />;
  return <CheckerScreen trip={trip} onExit={() => { setTrip(null); setScreen('setup'); }} />;
}
