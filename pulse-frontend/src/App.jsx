import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DoctorPage from './pages/DoctorPage';
import BuilderPage from './pages/BuilderPage';
import AuditorPage from './pages/AuditorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/doctor" element={<DoctorPage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="/auditor" element={<AuditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
