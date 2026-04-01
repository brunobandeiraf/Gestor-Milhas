import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import CompleteRegistrationPage from "./pages/CompleteRegistrationPage";
import DashboardPage from "./pages/DashboardPage";
import LoyaltyAccountsPage from "./pages/LoyaltyAccountsPage";
import CardsPage from "./pages/CardsPage";
import ClubsPage from "./pages/ClubsPage";
import TransactionsPage from "./pages/TransactionsPage";
import BonusPurchasesPage from "./pages/BonusPurchasesPage";
import TransfersPage from "./pages/TransfersPage";
import IssuancesPage from "./pages/IssuancesPage";
import SchedulesPage from "./pages/SchedulesPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCatalogsPage from "./pages/AdminCatalogsPage";
import AdminProgramsPage from "./pages/AdminProgramsPage";

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
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contas" element={<LoyaltyAccountsPage />} />
          <Route path="/cartoes" element={<CardsPage />} />
          <Route path="/clubes" element={<ClubsPage />} />
          <Route path="/movimentacoes" element={<TransactionsPage />} />
          <Route path="/compras-bonificadas" element={<BonusPurchasesPage />} />
          <Route path="/transferencias" element={<TransfersPage />} />
          <Route path="/emissoes" element={<IssuancesPage />} />
          <Route path="/agendamentos" element={<SchedulesPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/catalogos" element={<AdminCatalogsPage />} />
          <Route path="/admin/programas" element={<AdminProgramsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
