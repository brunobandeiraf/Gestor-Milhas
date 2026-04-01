import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/Button";
import {
  Plane,
  LayoutDashboard,
  Wallet,
  CreditCard,
  Crown,
  ArrowLeftRight,
  Gift,
  Repeat,
  Ticket,
  CalendarClock,
  LogOut,
  Users,
  BookOpen,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contas", label: "Contas", icon: Wallet },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/clubes", label: "Clubes", icon: Crown },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/compras-bonificadas", label: "Compras Bonificadas", icon: Gift },
  { to: "/transferencias", label: "Transferências", icon: Repeat },
  { to: "/emissoes", label: "Emissões", icon: Ticket },
  { to: "/agendamentos", label: "Agendamentos", icon: CalendarClock },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3 },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/catalogos", label: "Catálogos", icon: BookOpen },
  { to: "/admin/programas", label: "Programas", icon: Settings },
];

const ProtectedLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-200">
          <Plane className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-blue-600">Gestor Milhas</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === "ADMIN" && (
            <>
              <div className="border-t border-gray-200 my-3" />
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
