import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import ModelSelectPage from "./pages/ModelSelectPage";
import AnalyzePage from "./pages/AnalyzePage";
import PatientPage from "./pages/PatientPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/select" element={<ModelSelectPage />} />
      <Route path="/analyze" element={<AnalyzePage />} />
      <Route path="/patient/:id" element={<PatientPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
