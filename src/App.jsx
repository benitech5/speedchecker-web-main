import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MapPage from './pages/MapPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import SimulatorPage from './pages/SimulatorPage.jsx';
import MonitorApp from './pages/MonitorApp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
        </Route>
        <Route path="monitor" element={<MonitorApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
