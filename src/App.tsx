import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import InputPage from "@/pages/InputPage";
import ImagingPage from "@/pages/ImagingPage";
import DiagnosisPage from "@/pages/DiagnosisPage";
import TrendPage from "@/pages/TrendPage";
import ReportPage from "@/pages/ReportPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/input" replace />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/imaging" element={<ImagingPage />} />
          <Route path="/diagnosis" element={<DiagnosisPage />} />
          <Route path="/trend" element={<TrendPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/input" replace />} />
      </Routes>
    </Router>
  );
}
