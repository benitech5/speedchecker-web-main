import { NavLink, Outlet } from 'react-router-dom';
import { isMockMode } from '../api/client.js';

const MANAGER_NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/map', label: 'Map' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/trips', label: 'Trips' },
];

export default function Layout() {
  return (
    <div className="fleet-app">
      <aside className="fleet-sidebar">
        <div className="fleet-brand">
          <span className="mini-mark">↗</span>
          <div>
            <strong>SmartStart</strong>
            <small>Fleet Monitor</small>
          </div>
        </div>

        <nav className="fleet-nav" aria-label="Fleet management">
          {MANAGER_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `fleet-nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="fleet-dev-tools">
          <p className="fleet-dev-label">Original app</p>
          <nav className="fleet-nav fleet-nav-dev" aria-label="Original speed checker">
            <NavLink
              to="/monitor"
              className={({ isActive }) => `fleet-nav-link${isActive ? ' active' : ''}`}
            >
              Live Speed Check
            </NavLink>
          </nav>
        </div>

        <div className="fleet-dev-tools">
          <p className="fleet-dev-label">Developer Tools</p>
          <nav className="fleet-nav fleet-nav-dev" aria-label="Developer tools">
            <NavLink
              to="/simulator"
              className={({ isActive }) => `fleet-nav-link${isActive ? ' active' : ''}`}
            >
              Simulator
            </NavLink>
          </nav>
        </div>

        {isMockMode && (
          <p className="fleet-mock-badge">Mock data mode</p>
        )}
      </aside>
      <div className="fleet-main">
        <Outlet />
      </div>
    </div>
  );
}
