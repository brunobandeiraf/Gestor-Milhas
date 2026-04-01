import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import CompleteRegistrationPage from "./pages/CompleteRegistrationPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/funcionalidades" element={<FeaturesPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected routes — allows PENDING users */}
      <Route element={<ProtectedRoute allowPending />}>
        <Route path="/completar-cadastro" element={<CompleteRegistrationPage />} />
      </Route>

      {/* Protected routes — requires COMPLETE registration */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Route>
    </Routes>
  );
};

const DashboardPlaceholder = () => (
  <div className="py-20 text-center">
    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p className="text-gray-600 mt-2">Área protegida será implementada em breve.</p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
